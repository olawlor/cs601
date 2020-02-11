all: calc run

calc: example.yacc
	yacc $< -o parser.cpp 
	g++ -Wall parser.cpp -o $@

run: calc
	./$<  || /bin/true


clean:
	- rm parser.cpp


