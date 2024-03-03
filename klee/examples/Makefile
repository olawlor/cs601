all: run

run: main.cpp
	clang++ -I ../../include -emit-llvm -c -g -O0 -Xclang -disable-O0-optnone "$<" 
	klee --emit-all-errors --ubsan-runtime main.bc

test: run
	ktest-tool klee-last/`basename klee-last/*.err .assert.err`.ktest

clean:
	- rm main.bc


