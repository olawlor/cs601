%{
/* yacc / bison turns this file into "parser.cpp" and "parser.h" */
#include <stdio.h>
#include <iostream>
#include <ctype.h>
#include "shared.h"
#include "parser.h"

int yylex();
int yyerror(const char *s);

%}

%token NUM SEMI

%%

input: 
	| input line
;

line:
	NUM SEMI { printf("NUM %f\n",$1); }
;

%%

int yyerror(const char *why) {
	printf("Syntax error: %s\n",why);
	return 1;
}

int main(void) {
	return yyparse();
}

