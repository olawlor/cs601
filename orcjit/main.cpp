/*
Demonstrates a Just-In-Time (JIT) compiler using LLVM

Once LLVM is set up, compile this file with:
 make
or
 clang++ main.cpp `llvm-config --cxxflags --ldflags --system-libs --libs core orcjit native` -o jit

Run a LLVM IR file in.ll with:
 ./jit

Make a new input.ll with:
 clang -S -emit-llvm input.c 


This is a single-file version collected from the files at:
     https://github.com/vaivaswatha/lljit

Dr. Orion Lawlor heavily modified this 2024-02-21 by:
   - Simplify by removing most llvm::Expected, to use inline error handling.
   - Add raw machine code dump to check disassembly
   - Add optimizer passes following this obsolete gist:
        https://gist.github.com/5pilow/c7b6d3b21cc93eadd1eb298d2d86c2b6

 * Copyright (C) 2020 Vaivaswatha N
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
#include <memory>
#include <string>
#include <stdio.h>


#include "llvm/Support/CommandLine.h"
#include "llvm/Support/raw_ostream.h"

#include "llvm/ADT/StringRef.h"
#include "llvm/ExecutionEngine/JITEventListener.h"
#include "llvm/ExecutionEngine/ObjectCache.h"
#include "llvm/ExecutionEngine/Orc/CompileUtils.h"
#include "llvm/ExecutionEngine/Orc/Core.h"
#include "llvm/ExecutionEngine/Orc/ExecutionUtils.h"
#include "llvm/ExecutionEngine/Orc/JITTargetMachineBuilder.h"
#include "llvm/ExecutionEngine/Orc/LLJIT.h"
#include "llvm/ExecutionEngine/Orc/RTDyldObjectLinkingLayer.h"
#include "llvm/ExecutionEngine/SectionMemoryManager.h"
#include "llvm/IR/DataLayout.h"
#include "llvm/IR/LLVMContext.h"
#include "llvm/IR/LegacyPassManager.h"
#include "llvm/IRReader/IRReader.h"
#include "llvm/Support/SourceMgr.h"
#include "llvm/Support/TargetSelect.h"
#include "llvm/Support/raw_ostream.h"
#include "llvm/Transforms/InstCombine/InstCombine.h"
#include "llvm/Transforms/Scalar.h"
#include "llvm/Transforms/Scalar/GVN.h"
#include "llvm/Transforms/Utils.h"
#include "llvm/Transforms/IPO/Inliner.h"

#include "llvm/ADT/StringMap.h"
#include "llvm/ExecutionEngine/ObjectCache.h"
#include "llvm/ExecutionEngine/Orc/LLJIT.h"
#include "llvm/Support/Error.h"
#include "llvm/Support/MemoryBuffer.h"


// An ExampleJIT object compiles an LLVM-IR module and provides access
// to the symbols inside it. TODO: Handle multiple modules.
class ExampleJIT {
private:
    bool OK=false;
    std::unique_ptr<llvm::orc::LLJIT> JIT;
    std::unique_ptr<llvm::LLVMContext> Ctx;

    llvm::Error addCallableFunctions(void);
    std::unique_ptr<llvm::Module> addIR(const std::string &Filename);
    void optimize(const std::unique_ptr<llvm::Module> &M);

public:
    // Compile this LLVM IR file
    ExampleJIT(const std::string &FileName);

    // Get address for @Symbol inside the compiled IR, ready to be used.
    //  Returns NULL if the lookup failed.
    void *lookup(const std::string &Symbol);
    
    // Check if we're OK
    operator bool () { return OK; }
};



using namespace llvm;

// Error handling strategy
ExitOnError ExitOnErr;


// Print this area as hexadecimal bytes
extern "C"
void print_hex(void *ptr,int len)
{
    unsigned char *data=(unsigned char *)ptr;
    printf("Code: \necho ");
    for (int i=0;i<len;i++) printf("%02x ",data[i]);
    printf(" | xxd -r -p | ndisasm -b 64 -\n\n");
}

// Print this long integer onscreen
extern "C" 
void print_long(long v) 
{
    printf(" long: %ld\n",v);
}



// Map function names to addresses:
struct FunctionsMap {
    const char *FName;
    const void *FAddr;
};
const static FunctionsMap CallableFuncs[] = {
    {"printf", (void *)printf},
    {"puts", (void *)puts}, //< optimizer will swap printf call to puts
    {"malloc", (void *)malloc},
    {"exit", (void *)exit},
    {"print_long", (void *)print_long}, //<- can also call local functions
    {"print_hex", (void *)print_hex}, //<- can also call local functions
};

// Add functions in the table above that the JIT'ed code can access.
Error ExampleJIT::addCallableFunctions(void) {
    const DataLayout &DL = JIT->getDataLayout();
    orc::SymbolMap syms;
    orc::MangleAndInterner Mangle(JIT->getExecutionSession(), DL);
    // Register every symbol that can be accessed from the JIT'ed code.
    for (auto fa : CallableFuncs) {
        syms[Mangle(fa.FName)] = 
#if LLVM_VERSION_MAJOR >= 17  /* compiles, but not fully working yet */
            orc::ExecutorSymbolDef(
                orc::ExecutorAddr::fromPtr(fa.FAddr), JITSymbolFlags()
            );
#else
            JITEvaluatedSymbol(
                 pointerToJITTargetAddress(fa.FAddr), JITSymbolFlags()
            );
#endif
    }

    return JIT->getMainJITDylib().define(absoluteSymbols(syms));
}

// Parse this LLVM IR file into a Module
std::unique_ptr<llvm::Module> ExampleJIT::addIR(const std::string &Filename)
{
    SMDiagnostic Smd;
    auto M = parseIRFile(Filename, Smd, *Ctx);
    if (!M) { // Get compile errors
        std::string Err;
        raw_string_ostream OS(Err);
        Smd.print("lljit", OS);
        ExitOnErr(createStringError(inconvertibleErrorCode(), Err.c_str()));
    }
    return M;
}

// Print this LLVM IR module's functions and blocks
void printModule(const std::unique_ptr<llvm::Module> &M,const char *where)
{
    for (llvm::Function &F : *M)
    {
        errs()<<"define "<<F.getName()<<"() { ;  ("<<where<<")\n";
        for (llvm::BasicBlock &B : F)
        {
            if (B.getName()!="") errs()<<"\n  "<<B.getName()<<": ";
            for (llvm::BasicBlock *pre : predecessors(&B))
                errs()<<"    ; Predecessor: %"<<pre->getName()<<"\n";
            
            for (llvm::Instruction &I : B)
                errs()<<"    "<<I<<"\n";
        }
        errs()<<"}\n\n";
    }
}

// Run optimization passes on this LLVM IR Module
//  Source: https://llvm.org/docs/tutorial/BuildingAJIT2.html
void ExampleJIT::optimize(const std::unique_ptr<llvm::Module> &M)
{
    auto FPM = std::make_unique<llvm::legacy::FunctionPassManager>(M.get());

    // Add some optimizations.
    FPM->add(createGVNPass());
    FPM->add(createInstructionCombiningPass());
    FPM->add(createCFGSimplificationPass());
    FPM->add(createReassociatePass());
    FPM->add(createLoopUnrollPass());
    
    
    // FPM->add(new llvm::InlinerPass(false)); //   https://llvm.org/doxygen/classllvm_1_1InlinerPass.html
    
    
    FPM->doInitialization();

    // Run the optimizations over all functions in the module
    const int nrepeat=3;
    for (int repeat=0;repeat<nrepeat;repeat++) 
        for (llvm::Function &F : *M)
            FPM->run(F);
}

// Compile this LLVM IR file
ExampleJIT::ExampleJIT(const std::string &Filename) 
    :OK(false)
{
    InitializeNativeTarget();
    InitializeNativeTargetAsmPrinter();

    // Create LLVM context
    Ctx = std::make_unique<LLVMContext>();

    // Create an LLJIT instance
    auto J = orc::LLJITBuilder().create();
    if (!J) {
        ExitOnErr(std::move(J));
        return;
    }
    JIT = std::move(*J);

    if (addCallableFunctions()) {
        return;
    }

    // Parse IR into a Module
    std::unique_ptr<llvm::Module> M = addIR(Filename);
    if (!M) {
        return;
    }
    
    printModule(M,"before optimization");
    
    // Optimization passes
    optimize(M);
    
    printModule(M,"after optimization");

    // Add the Module to our JIT
    orc::ThreadSafeModule TSM(std::move(M), std::move(Ctx));
    if (auto Err = JIT->addIRModule(std::move(TSM))) {
        ExitOnErr( std::move(Err) );
        return;
    }

    OK = true;
}

// Return the in-memory address of this symbol
void * ExampleJIT::lookup(const std::string &Symbol) {
    auto SA = JIT->lookup(Symbol);
    if (SA.takeError()) {
        return 0;
    }

#if LLVM_VERSION_MAJOR >= 15
    return reinterpret_cast<void *>((*SA).getValue());
#else
    return reinterpret_cast<void *>((*SA).getAddress());
#endif
}


int main(int argc, char *argv[]) {
    // Compile the LLVM IR input
    ExampleJIT jit("in.ll");
    if (!jit) {
        printf("Error setting up LLVM JIT\n");
        return 1;
    }

    // Look up the code entry point
    typedef long (*function_ptr)(long arg0);
    function_ptr run = reinterpret_cast<function_ptr>(
        jit.lookup("jitentry")
    );

    // Print some machine code at that entry point
    print_hex((void *)run,32);

    // Run the code
    long result = run(6);

    // Show the returned value
    printf(" result %ld (%08lx)\n", result, result);
    return EXIT_SUCCESS;
}


