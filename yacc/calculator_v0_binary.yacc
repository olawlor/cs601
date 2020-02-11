%{
/*
 Yacc / Bison grammar for a super simple calculator: read the letters 1 and 0.
 Example heavily adapted from IBM's A/IX documentation: 
    https://www.ibm.com/support/knowledgecenter/en/ssw_aix_72/com.ibmix.genprogc/ie_prog_4lex_yacc.htm
 
 Compile with:
    yacc grammar.yacc -o parser.cpp && g++ -Wall parser.cpp -o foo && ./foo
*/
#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>

/* Prototype for our lexer, which returns token types, or bare chars */
int yylex();

/* Error handling call */
void yyerror(const char *s)
{
  fprintf(stderr, "ERROR> %s\n",s);
  exit(1);
}

#define YYSTYPE long /* type used for $ values during the parse */

%}

/* This is the grammar's start symbol */
%start statement

%%  /* grammar rules section starts here */

statement:  number
    {
        printf(" Result: %ld\n",$1);
    }
    ;

number:
   '0'
    { 
        $$ = 0; 
    }
 | '1'
    {  
        $$ = 1; 
    }
    ;
%%
/* More C/C++ code pasted at bottom of generated parser */

/* Trivial hand-coded lexer: just reads chars from stdin and send them unchanged */
int yylex() {
  char c=getchar();
  return c;
}

int main()
{
  printf("Starting yacc calculator\n");
  return(yyparse());
}

int yywrap()
{
  return(1);
}
