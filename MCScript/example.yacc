%{
/*
 Yacc / Bison grammar for a super simple calculator: read the letters 1 and 0.
 Example heavily adapted from IBM's A/IX documentation: 
    https://www.ibm.com/support/knowledgecenter/en/ssw_aix_72/com.ibmix.genprogc/ie_prog_4lex_yacc.htm
 
 Compile with:
    yacc grammar.yacc -o parser.cpp && g++ -Wall parser.cpp -o foo && ./foo
    
    
    
    // MCScript style
    function x(x i64) => r i64 {
        x*x => r;
    }
    
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
%start function_list

%%  /* grammar rules section starts here */

function_list:
    function function_list
    |
    function;

function:
    wn FUNCTION_KEYWORD wm varname args returntype block
    {
        std::cout<<"Parsed function \n";
    }
    ;

args: '(' arglist ')'; 

arglist: arglist ',' arg
    | arg

arg: w varname wm typename;

arrow_operator:
    w '=' '>' w ;

returntype: 
    arrow_operator varname wm typename w;
    
assigntype: 
    arrow_operator varname w;


statement:
    wn expr w statement_end;

expr:
    arith returntype
    |
    arith assigntype;


block: '{'
    statements
wn '}';

statements: statements statement
    | statement;
    
FUNCTION_KEYWORD:
    'f' 'u' 'n' 'c' 't' 'i' 'o' 'n' ;
    
varname: 
        'x' | 'r' ;

typename:
    'i' '6' '4';


statement: wn arith w statement_end
    {
        std::cout<<"          Parsed stmt: "<<$2<<std::endl;
    }
    ;

/*
shortcomment:
    '/' '/' not_newline '\n'
    ;

not_newline:
    not_newline alphanumeric
    | not_newline w
;    
*/

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
    |
    varname
    ;

number:
    '0' 'b' number2
    {
        $$ = $3;
    }
    |
    number10;

number2:
    number2 digit2
    {
        std::cout<<"Binary: assemble "<<$1<<" with "<<$2<<"\n";
        $$ = $1*2 + $2;
    }
    |
    digit2
;

number10:
    number10 digit10
    {
        std::cout<<"Decimal: assemble "<<$1<<" with "<<$2<<"\n";
        $$ = $1*10 + $2;
    }
    |
    digit10
;

digit10:
   | '9' { $$=9; }
   | '8' { $$=8; }
   | '7' { $$=7; }
   | '6' { $$=6; }
   | '5' { $$=5; }
   | '4' { $$=4; }
   | '3' { $$=3; }
   | '2' { $$=2; }
   | '1' { $$=1; }
   | '0' { $$=0; }
    ;

digit2:
   | '1' { $$=1; }
   | '0' { $$=0; }
    ;

statement_end:
    ';' '\n'
 |
    '\n'
 ;

/* Mandatory whitespace */
wm: wm whitespace
   |
   whitespace
   ;

whitespace: ' ' | '\t';

/* Whitespace, *not* including newline */
w:
   w whitespace
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
  int c=getchar();
  if (c<0) {
    std::cout<<"End of input\n";
    exit(0); 
  }
  
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
