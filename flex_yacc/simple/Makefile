all: run

run: calc
	./calc

calc: parser.o lexer.o
	g++ -g -o $@ $+ -lm

%.o: %.cpp parser.h
	g++ -g -c -Wall -std=c++11 -o $@ $<

parser.cpp lexer.cpp: yacc.y lex.l
	lex -o lexer.cpp lex.l
	bison $< -o parser.cpp --defines=parser.h

clean: FORCE
	rm -f parser.* lexer.* *.o calc

FORCE:
