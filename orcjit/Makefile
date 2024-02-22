#OPTS=-g
#OPTS=-O3
OPTS=

all: jit

jit: main.cpp
	clang++ $(OPTS) $< `llvm-config --cxxflags --ldflags --system-libs --libs core orcjit native` -o $@

run: jit
	./jit

in.ll: examples/input.c Makefile
	clang -S -emit-llvm $< -o $@

clean:
	rm jit


