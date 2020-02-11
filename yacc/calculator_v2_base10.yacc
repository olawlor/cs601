%{
/*
 Yacc / Bison grammar for a simple calculator.
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

%token DIGIT /* thing that comes from lexer */


%right 'x'   /* operator 'x' is left-associative */

/* This is the grammar's start symbol */
%start program

%%  /* grammar rules section starts here */

program: /* empty */
    |
    statement '\n' program;

statement:  expression
         {
           printf(" Result: %ld\n",$1);
         }
         ;

expression:
    number 
    | 
    expression 'x' expression
      {
         printf("Multiplying %ld x %ld\n", $1, $3);
         $$ = $1 * $3;
      };

number:
      DIGIT
         { $$ = $1; }
     | number   DIGIT
       {
          $$ = ($1*10) + $2;
       }
       ;
        ;
%%
/* More C/C++ code pasted at bottom of generated parser */

/* Trivial hand-coded lexer: just reads chars from stdin and send them unchanged */
int yylex() {
  char c=getchar();
  
  if (isdigit(c)) { 
     yylval = c - '0'; /* $$ in parser */
     return DIGIT;
  }
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
