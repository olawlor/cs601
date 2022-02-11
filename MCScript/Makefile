all: calc run

calc: example.yacc
	yacc $< -o parser.cpp 
	g++ -Wall parser.cpp -o $@

run: calc
	./$<  < ex.mcs || /bin/true


clean:
	- rm parser.cpp calc



