/*
Demonstrates a Just-In-Time (JIT) compiler using LLVM
 
Set up LLVM ORC packages for clang 14 on Ubuntu 22.04:
 sudo apt-get install clang llvm-dev libstdc++-12-dev
The llvm that comes with Ubuntu 18.04 is too old for this code.
 
Compile with:
 clang++ main.cpp `llvm-config --cxxflags --ldflags --system-libs --libs core orcjit native` -o jit

Run a LLVM IR file in.ll with:
 ./jit

Make a new input.ll with:
 clang -S -emit-llvm input.c 


This is a single-file version collected from the files at:
     https://github.com/vaivaswatha/lljit

Dr. Orion Lawlor heavily modified this 2024-02-21 by:
   - Simplify by removing all the llvm::Expected and use inline error handling.
   - Add machine code dump


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
#include "llvm/ExecutionEngine/JITSymbol.h"
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

public:
  // Compile this LLVM IR file
  ExampleJIT(const std::string &FileName, llvm::ObjectCache * = nullptr);
  
  // Get address for @Symbol inside the compiled IR, ready to be used.
  //  Returns NULL if the lookup failed.
  void *lookup(const std::string &Symbol);
};



using namespace llvm;

// Error handling strategy
ExitOnError ErrorHandler;


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
    {"print_long", (void *)print_long},
    {"malloc", (void *)malloc},
    {"exit", (void *)exit},
};

// Add functions in SRTL that the JIT'ed code can access.
Error addExampleBuiltins(orc::LLJIT &JIT, const DataLayout &DL) {
  orc::SymbolMap M;
  orc::MangleAndInterner Mangle(JIT.getExecutionSession(), DL);
  // Register every symbol that can be accessed from the JIT'ed code.
  for (auto fa : CallableFuncs) {
    M[Mangle(fa.FName)] = JITEvaluatedSymbol(
        pointerToJITTargetAddress(fa.FAddr), JITSymbolFlags());
  }

  if (auto Err = (JIT.getMainJITDylib().define(absoluteSymbols(M))))
    return Err;

  return Error::success();
}


using namespace orc;

ExampleJIT::ExampleJIT(const std::string &Filename, ObjectCache *OC) 
    :OK(false)
{
  InitializeNativeTarget();
  InitializeNativeTargetAsmPrinter();

  // Create an LLJIT instance with a custom CompileFunction and
  // ObjectLinkingLayer.
  auto J = orc::LLJITBuilder()
               .setCompileFunctionCreator(
                   [&](JITTargetMachineBuilder JTMB)
                       -> Expected<std::unique_ptr<IRCompileLayer::IRCompiler>> {
                     auto TM = JTMB.createTargetMachine();
                     if (!TM)
                       return TM.takeError();
                     return std::make_unique<TMOwningSimpleCompiler>(std::move(*TM), OC);
                   })
               .setObjectLinkingLayerCreator([&](ExecutionSession &ES,
                                                 const Triple &TT)
                                             -> std::unique_ptr<ObjectLayer> {
                 
                 // the code is taken from LLJIT.cpp.
                 auto GetMemMgr = []() {
                   return std::make_unique<SectionMemoryManager>();
                 };
                 auto ObjLinkingLayer = std::make_unique<RTDyldObjectLinkingLayer>(
                     ES, std::move(GetMemMgr));
                 if (TT.isOSBinFormatCOFF()) {
                   ObjLinkingLayer->setOverrideObjectFlagsWithResponsibilityFlags(
                       true);
                   ObjLinkingLayer->setAutoClaimResponsibilityForObjectSymbols(true);
                 }
                 return ObjLinkingLayer;
               })
               .create();

  if (!J)
    return;

  JIT = std::move(*J);

  if (auto Err =
          addExampleBuiltins(*JIT, JIT->getDataLayout()))
    return;

  auto Ctx = std::make_unique<LLVMContext>();
  SMDiagnostic Smd;
  auto M = parseIRFile(Filename, Smd, *Ctx);
  if (!M) {
    std::string ErrMsg;
    raw_string_ostream OS(ErrMsg);
    Smd.print("lljit", OS);
    ErrorHandler(createStringError(inconvertibleErrorCode(), OS.str().c_str()));
  }

  ThreadSafeModule TSM(std::move(M), std::move(Ctx));
  if (auto Err = JIT->addIRModule(std::move(TSM))) {
    ErrorHandler( std::move(Err) );
  }
  
  OK = true;
}

void * ExampleJIT::lookup(const std::string &Symbol) {

  auto SA = JIT->lookup(Symbol);
  if (auto Err = SA.takeError()) {
    return 0;
  }

  return reinterpret_cast<void *>((*SA).getAddress());
}


using namespace llvm;


int main(int argc, char *argv[]) {

  // Compile the LLVM IR
  ExampleJIT jit("in.ll");
  
  // Look up the code entry point
  typedef void (*function_ptr)();
  function_ptr run = reinterpret_cast<function_ptr>(jit.lookup("jitentry"));
  
  // Print some machine code at that entry point
  print_hex((void *)run,32);

  // Run it
  run();

  return EXIT_SUCCESS;
}


