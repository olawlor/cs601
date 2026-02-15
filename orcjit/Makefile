#OPTS=-g
#OPTS=-O3
OPTS=

LLVMFLAGS= -fuse-ld=lld  `llvm-config --cxxflags --ldflags --system-libs --libs core orcjit native` 


all: jit

jit: main.cpp
	clang++ $(OPTS) $< -o $@ $(LLVMFLAGS) 

run: jit
	./jit

in.ll: examples/input.c Makefile
	clang -S -emit-llvm $< -o $@

revrisc_to_LLVM: revrisc_to_LLVM.cpp
	clang++ $< -o $@
	./$@ > in.ll

clean:
	-rm jit


