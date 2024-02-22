#OPTS=-g
#OPTS=-O3
OPTS=

all: jit

jit: main.cpp
	clang++ $(OPTS) $< `llvm-config --cxxflags --ldflags --system-libs --libs core orcjit native` -o $@

run: jit
	./jit

clean:
	rm jit


