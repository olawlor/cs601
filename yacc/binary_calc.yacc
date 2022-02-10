%{
/*
 Yacc / Bison grammar for a super simple calculator: read the letters 1 and 0.
 Example heavily adapted from IBM's A/IX documentation: 
    https://www.ibm.com/support/knowledgecenter/en/ssw_aix_72/com.ibmix.genprogc/ie_prog_4lex_yacc.htm
 
 Compile with:
    yacc grammar.yacc -o parser.cpp && g++ -Wall parser.cpp -o foo && ./foo
*/
#include <iostream>
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

/* Define associativity & priority of operators */
%left '+' '-'
%left '*'

/* This is the grammar's start symbol */
%start statement_list

%%  /* grammar rules section starts here */

statement_list: statement statement_list
    | statement
    ;

statement: wn arith w statement_end
    {
        std::cout<<"          Parsed stmt: "<<$2<<std::endl;
    }
    ;


arith: 
    '(' arith ')'
    {
        std::cout<<"Paren "<<$2<<"\n";
        $$ = $2;
    }
    |
    arith '+' arith
    {
        std::cout<<"Add "<<$1<<"+"<<$3<<"\n";
        $$ = $1 + $3;
    }
    |
    arith '*' arith
    {
        std::cout<<"Mul "<<$1<<"*"<<$3<<"\n";
        $$ = $1 * $3;
    }
    |
    number
    ;

number:
    number2;

number2:
    number2 digit2
    {
        std::cout<<"Binary: assemble "<<$1<<" with "<<$2<<"\n";
        $$ = $1*2 + $2;
    }
    |
    digit2
;

digit2:
   '0'
    { 
        $$ = 0; 
    }
 | '1'
    {  
        $$ = 1; 
    }
    ;

statement_end:
    ';' '\n'
 |
    '\n'
 ;

/* Whitespace, *not* including newline */
w:
    ' ' w
   |
    '\t' w
   |
    /* empty */
   ;

/* Whitespace including newlines */
wn:
    '\n' wn
   |
    w
   ;


%%
/* More C/C++ code pasted at bottom of generated parser */

/* Trivial hand-coded lexer: just reads chars from stdin and send them unchanged */
int yylex() {
  char c=getchar();
  if (c=='\n') std::cout<<"lexed newline"<<std::endl;
  else std::cout<<"lexed char: "<<c<<std::endl;
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
