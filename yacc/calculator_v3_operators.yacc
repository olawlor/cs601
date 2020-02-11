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
  fprintf(stderr, "%s\n",s);
  exit(1);
}

int regs[256]; /* letter-named variables */
int base=10; /* used for octal input */

#define YYSTYPE long /* type used for $ values during the parse */


%}

/* This defines the tokens produced by our lexer */
%token DIGIT LETTER 

/* Precedence rules: these also avoid "shift-reduce conflict" warnings. */
%left '|'
%left '&'
%left '+' '-'
%left '*' '/' '%'
%left UMINUS  /*supplies precedence for unary minus */

/* This is the grammar's start symbol */
%start list

%%  /* grammar rules section starts here */

list:  /*empty */
     |
        list stat '\n'
     ;
stat:    expr
         {
           printf(" Result: %ld\n",$1);
         }
     |
         LETTER '=' expr
         {
           regs[$1] = $3;
         }

         ;

expr: 
        '(' expr ')'
         {
           $$ = $2;
         }
     |
         expr '*' expr
         {

           $$ = $1 * $3;
         }
     |
         expr '/' expr
         {
           $$ = $1 / $3;
         }
     |
         expr '%' expr
         {
           $$ = $1 % $3;
         }
     |
         expr '+' expr
         {
           $$ = $1 + $3;
         }
     |
         expr '-' expr
         {
           $$ = $1 - $3;
         }
     |
         expr '&' expr
         {
           $$ = $1 & $3;
         }
     |
         expr '|' expr
         {
           $$ = $1 | $3;
         }
     |

        '-' expr %prec UMINUS
         {
           $$ = -$2;
         }
     |
         LETTER
         {
           $$ = regs[$1];
         }

     |
         number
         ;

number:  DIGIT
         {
           $$ = $1;
           base = ($1==0) ? 8 : 10;
         }       
         |
         number DIGIT
         {
           $$ = base * $1 + $2;
         }
         ;

%%
/* More C/C++ code pasted at bottom */

/* Trivial hand-coded lexer: just reads chars from stdin and match */
int yylex() {
  char c=getchar();
  
  if (isdigit(c)) {
    yylval = c-'0'; // becomes the $ value
    return DIGIT; // used in the grammar
  }
  
  if (isalpha(c)) {
    yylval = c;
    return LETTER;
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
