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
#include <math.h>

/* Prototype for our lexer, which returns token types, or bare chars */
int yylex();

/* Error handling call */
void yyerror(const char *s)
{
  fprintf(stderr, "%s\n",s);
  exit(1);
}

double regs[256]; /* letter-named variables */
int base=10; /* used for octal input */
double decimal_scale=0.0;

#define YYSTYPE double /* type used for $ values during the parse */


%}

/* This defines the tokens produced by our lexer */
%token DIGIT LETTER 

/* Precedence rules: these also avoid "shift-reduce conflict" warnings. */
%left '+' '-'
%left '*' '/' '%'
%right '^'
%left UMINUS  UPLUS  /*supplies precedence for unary minus */

/* This is the grammar's start symbol */
%start list

%%  /* grammar rules section starts here */

list:  /*empty */
     |
        stat '\n'  list  
     ;
stat:    expr
         {
           printf(" Result: %f\n",$1);
         }
     |
         LETTER '=' expr
         {
           regs[(int)$1] = $3;
         }

         ;

expr: 
        '(' expr ')'
         {
           $$ = $2;
         }
     |
         expr '^' expr
         {
         printf("Exponent: \n");
         printf("  $1=%f\n", $1);
         printf("  $3=%f\n", $3);
           $$ = (long)pow($1,$3);
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

        '-' expr %prec UMINUS
         {
           $$ = -$2;
         }
     |
        '+' expr %prec UPLUS
         {
           $$ = $2;
         }
     |
         LETTER
         {
           $$ = regs[(int)$1];
         }

     |
         number
         ;


number:  int | fraction;

int:     DIGIT
         {
           $$ = $1;
         }       
         |
         int DIGIT
         {
           $$ = base * $1 + $2;
         }
      ;
 
fraction:
         int '.' decimal
         {
            $$ = $1 + $3;
         }
         ;

decimal: DIGIT
         {
           decimal_scale=0.1;
           $$ = decimal_scale*$1;
         }       
         |
         decimal DIGIT
         {
           decimal_scale*=0.1;
           
           $$ = $1 + decimal_scale*$2;
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
