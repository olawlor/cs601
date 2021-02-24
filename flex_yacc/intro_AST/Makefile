
CFLAGS=-Wall -g

all: run

run: calc
	./calc

calc: parser.o lexer.o
	g++ $(CFLAGS) -o $@ $+ -lm

%.o: %.cpp parser.h
	g++ $(CFLAGS) -c -Wall -std=c++11 -o $@ $<

parser.cpp lexer.cpp: yacc.y lex.l
	lex -o lexer.cpp lex.l
	bison $< -o parser.cpp --defines=parser.h

clean: FORCE
	rm -f parser.* lexer.* *.o calc

FORCE:

packages:
	sudo apt-get install flex bison make g++
