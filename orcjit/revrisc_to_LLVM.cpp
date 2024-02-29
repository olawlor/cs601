/*
  Translates RevRISC machine code to LLVM IR, with the goal of understanding
  what the LLVM optimizers can do with complex programs.
  
  Uses alloca to simulate modifiable registers.
  Uses a "jump table" to support arbitrary register F jumps.
  
  This version 0.1 supports function calls (via 0xC), 
  a variety of arithmetic instructions: 0xA add, 0x8 mul, 0x7 div, 0xB sub,
  but not mem/stack ops (0xE) yet.
  
  Dr. Orion Lawlor and the CS 601 class, 2024-02 (Public Domain)
*/
#include <iostream>
#include <stdio.h>

typedef int32_t reg_t; // data in our registers
typedef uint32_t inst_t; // one machine code instruction
typedef reg_t mem_t; // data in memory

template <const int memsize, const int stacksize=16>
class RevRISC_interpreter {
public:
	// Normal user-visible registers
	enum {
		reg_stack = 0xA, // stack pointer register
		reg_pc = 0xF, // program counter / instruction pointer register
	};
	reg_t regs[16]; 

	// System registers, for an OS and hypervisor
	enum {
		sysreg_heapstart = 0  // Address of beginning of read-write memory area
	};
	reg_t sysregs[16]; 
	
	// RAM memory
	mem_t mem[memsize]; // instructions, heap, and the stack

	void fatal(inst_t inst,const char *why) {
		printf("Fatal error: %s (inst %08x at addr %08x)\n",
			why,inst,regs[0xF]);
		exit(1);
	}
	
	// Convert this number to a hex string.
	std::string hex(unsigned long r,int digits=1) {
		std::string ret="";
		// Extract the highest digit first
		for (int digit=digits-1;digit>=0;digit--)
		{
			int place = 0xF & (r >> (4*digit));
			char c = "0123456789ABCDEF"[place]; // index out hex digit
			ret += c;
		}
		return ret;
	}
	
	// Convert this program counter value to a hex string
	std::string hex_pc(unsigned long pc) {
		return hex(pc,2); //<- defines policy on number of hex digits for jump labels
	}
	
	// Return the jump label for this pc value
	std::string label_pc(unsigned long pc) {
		return "j"+hex_pc(pc);
	}
	
	// Emit the start of this instruction.  
	//  Returns an ID used for temporaries.
	std::string start_inst() {
		unsigned long this_pc = regs[reg_pc]-1; // our own address
		std::cout<<label_pc(this_pc)+":\n";
		return hex_pc(this_pc);
	}
	
	// Return the LLVM variable that stores this register's address
	std::string reg_addr(int rN) {
		return "%r"+hex(rN,1)+"addr";
	}
	
	// Load this RevRISC register's value into this LLVM variable
	void load_reg(int rN,const std::string &varname) {
		std::cout<<"  "+varname+" = ";
		if (rN==0) { // special case: zero
			std::cout<<"add i32 0, 0\n";
		}
		else if (rN==0xF) { // special case: we know the PC addr at compile time
			std::cout<<"add i32 0, "<<regs[reg_pc]<<"\n";
		} else { // normal register, load from memory
			std::cout<<"load i32, i32 * "+reg_addr(rN)+", align 4\n";
		}
	}
	
	// Store this LLVM variable into this RevRISC register.
	//   Returns true if the store is normal and needs a normal jump afterwards.
	bool store_reg(int rN,const std::string &varname) {
		std::cout<<"  store i32 "+varname+", i32 * "+reg_addr(rN)+", align 4\n";
		
		if (rN==0xF)
		{ // write to PC, so we need an indirect jump
			std::cout<<"  br label %rFjump\n";
			return false;
		}
		return true;
	}
	
	// Finish this instruction, with a jump to the next instruction.
	void end_inst() {
		std::cout<<"  br label %"+label_pc(regs[reg_pc])+"\n"; 
	}
	
	// Emit a complete arithmetic instruction sequence
	void emit_arith(const std::string &op, int rD, int rX, int rY, int c)
	{
		std::string id = start_inst();
		if (rD==0xF && rX==0 && rY==0) { // jump to a constant
		    std::cout<<"  br label %"+label_pc(c)+"\n";
		}
		else { // General case
		    load_reg(rX,"%X"+id);
		    load_reg(rY,"%Y"+id);
		    
		    std::cout<<"  %C"+id+" = add i32 %Y"+id+", "<<c<<"\n";
		    std::cout<<"  %D"+id+" = "+op+" i32 %X"+id+", %C"+id+"\n";
		    if (store_reg(rD,"%D"+id))
			    end_inst();
		}
    }
    // Emit a conditional swap
    void emit_cswap(const std::string &cmp, int rD, int rX, int rY, int c)
    {
	// if (regs[rX] < ( regs[rY] + c ))
		std::string id = start_inst();
		load_reg(rX,"%X"+id);
		load_reg(rY,"%Y"+id);
		
		std::cout<<"  %C"+id+" = add i32 %Y"+id+", "<<c<<"\n";
		std::cout<<"  %S"+id+" = "+cmp+" i32 %X"+id+", %C"+id+"\n";
		std::cout<<"  br i1 %S"+id+", label %swap"+id+", label %"+label_pc(regs[reg_pc])+"\n";
		
	// std::swap(regs[rD],regs[rD-1]), behind a label
		std::cout<<" swap"+id+":\n";
		
		load_reg(rD,  "%D"+id);
		load_reg(rD-1,"%E"+id);
		// do stores in opposite order for swap
		store_reg(rD-1,"%D"+id);
		if (store_reg(rD,"%E"+id)) 
			end_inst();
    }

	void translate(inst_t inst)
	{
		// Decode bits of machine code instruction
		// 0x O O R R R C C C
		inst_t opG = 0xF & (inst >> 28); // opcode group
		inst_t opL = 0xF & (inst >> 24); // low opcode
		inst_t rD = 0xF & (inst >> 20); // destination
		inst_t rX = 0xF & (inst >> 16);
		inst_t rY = 0xF & (inst >> 12);
		reg_t c = 0xFFF & (inst >> 0);
		
		// sign-extend c from 12 bits to 32 bits
		//  c = 0x00000CCC <- loaded from instruction
		//  c = 0xfffffCCC  (if negative, sign extended)
		//if (c & 0x800) c = c|0xFFFFF000; // manual, find sign bit and extend
		c = (c<<20)>>20; // use hardware sign-extend
		
		// Execute instruction
		switch(opG) {
		case 0x7: // / divide:
			switch (opL) {
			case 0x0: emit_arith("sdiv", rD, rX, rY, c);
				//regs[rD] = regs[rX] / (regs[rY] + c); 
				break;
			case 0x1: emit_arith("srem", rD, rX, rY, c);
				//regs[rD] = regs[rX] % (regs[rY] + c); 
				break;
			default: fatal(inst,"Unknown opL in divide");
			}
			break;
		case 0x8: // x multiply:
			emit_arith("mul", rD, rX, rY, c);
			//regs[rD] = regs[rX] * (regs[rY] + c);
			break;
		case 0xA: // + Add:
			emit_arith("add", rD, rX, rY, c);
			// regs[rD] = regs[rX] + (regs[rY] + c);
			break;
		case 0xB: // - suBtract:
			emit_arith("sub", rD, rX, rY, c);
			//regs[rD] = regs[rX] - (regs[rY] + c);
			break;

		case 0xC: // Conditional swap:
			emit_cswap("icmp slt", rD, rX, rY, c);
			/*
			if (regs[rX] < ( regs[rY] + c ))
			{
				std::swap(regs[rD],regs[rD-1]);
			}
			*/
			break;
		case 0xE: { // mEmory access, including the stack
				if (opL==1) regs[rX]++; // pre-increment (push, ++pointer)
				
				reg_t addr = regs[rX] + regs[rY] + c;
				if (addr<0 || addr>=memsize) fatal(inst,"Bad mem addr");
				printf("   mem[%08x] to regs[%01x]\n", addr, rD);
				std::swap(regs[rD],mem[ addr ]);
				
				if (opL==0xD) regs[rX]--; // post-decrement (pop, pointer--)
			}
			break;
		case 0xF: // OS calls
			switch(opL) {
			case 0x0: //exit(1); 
				{
					std::string id = start_inst();
					std::cout<<"  br label %exit \n";
				}
				break;
			
			case 0xF: // print
				//printf("0x%08x  %d\n", regs[rD], regs[rD]);
				{
					std::string id = start_inst();
					load_reg(rD,"%D"+id);
					std::cout<<"  ret i32 %D"+id+"\n";
				}
				break;
			default:
				fatal(inst,"Unknown opL in OS call");
			};
			break;
		default:
			fatal(inst,"Unknown opG");
		}
	}
	
	void translate(const inst_t *inst,int n_inst,int count=1000,reg_t start=0)
	{
		// Emit prologue
		std::cout<<"define i32 @jitentry() {\n";
		
		// Create a zero constant
		std::cout<<"  %zero = add i32 0,0\n";
		
		// Reserve space for all the (mutable) registers, and zero them
		for (int r=1;r<=0xF;r++) {
			std::cout<<"  "+reg_addr(r)+" = alloca i32, align 4\n";
			std::cout<<"  store i32 %zero, i32 *"+reg_addr(r)+", align 4\n";
		}
		
		// Start the code
		std::cout<<"  br label %"+label_pc(start)+"; initial startup\n";
		
		// Set up machine
		sysregs[sysreg_heapstart] = n_inst; // heap starts after code
		regs[reg_stack]=memsize - stacksize; // stack is at end of memory
		regs[reg_pc]=start;
		
		// Translate each instruction
		for (int i=0;i<n_inst;i++) 
		{
			inst_t fetch = inst[i];
			printf(";                     TRACE %03x: %08x\n",
				i, fetch);
			regs[reg_pc] = i+1; //<- real machine has moved to next instruction
			
			translate(fetch);
		}
		
		// Create a label for falling off the end
		std::cout<<label_pc(regs[reg_pc])+":\n";
		std::cout<<"  br label %exit\n\n";
		
		// Crash handling
		std::cout<<"exit: ; fail and exit\n";
		std::cout<<"  %minus = add i32 0, -999\n";
		std::cout<<"  ret i32 %minus\n\n";
		
		// Indirect jump table, for handling runtime F writes
		std::cout<<"rFjump: ; indirect jump table\n";
		std::cout<<"  %target = load i32, i32 *%rFaddr, align 4\n";
		std::cout<<"  switch i32 %target, label %exit [ ";
		for (int i=0;i<n_inst;i++) {
			std::cout<<"  i32 "<<i<<", label %"<<label_pc(i)<<"  ";
		}
		std::cout<<" ]\n\n";
		
		std::cout<<"}\n";
	}
};












const static inst_t instructions[] = {
// 0xOORRRCCC 
#if 0 // lecture example
   0xA0500006, // 0: load r1 = 6
   0xA0550002, // 1: add 2 to r1
   0xA0E00001, // 2: load reg E with loop start (1)
   0xC0F50010, // 3: conditional jump back
   0xFF500000  // 4: print

#elif 0 // simple basics
   0xA0100006, // 0: r1 = n  (code starts on line 300, so you can count offsets!)
   0xA0E00004, // target address of skip
   0xC0F1000F, // skip r2 line if r1 < 0xF
   0xA0210001, // r2 = r1 + 1
   0xA0321000, // 4: r3 = r2 + r1
   0xFF300000, // print r3 and exit

#else // full fibonacci
   0xA0100006, // (n) fibonacci number desired 
   0xA0200000, // r2-r4 store the last three fibonacci numbers
   0xA0300001, 
   0xA0400001, 
   0xA0500000, // (i) loop counter
   0xA0F0000A, // jump to loop compare first
	   0xA0230000, // r2 = r3
	   0xA0340000, // r3 = r4
	   0xA0423000, // r4 = r2 + r3
	   0xA0550001, // i++
	   0xA0E00006, // jump target to start of loop
	   0xC0F51000, // keep looping while r5 < r1 limit
   0xFF200000, // print result from r2 and exit
#endif
	
};



int main(void)
{
	RevRISC_interpreter<1024*1024,16>	cpu = {0};
	cpu.translate(instructions, sizeof(instructions)/sizeof(inst_t));
	return 0;
}






