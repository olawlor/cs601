%{
/* yacc / bison turns this file into "parser.cpp" and "parser.h" */
#include "ast.h"
#include "parser.h"

int yylex();
int yyerror(const char *s);

%}

// For some reason yacc can be used to define lexer token symbolic names
%token NUM FUNCTION SEMI VAR SPACE TYPENAME_INT NEWLINE

// Resolve grammar ambiguities using yacc, not the grammer itself.
%right '='
%left '+'
%left '-'
%left '*'
%left '/'

%%

input: /* empty */
	| input function 
;

function: FUNCTION SPACE VAR args return_type function_body
    {
	    std::cout<<"\nFunction: ";
	    $3 -> print_infix();
	    std::cout<<"\nBody: ";
	    $6 -> print_infix();
	    std::cout<<"\n\n";
    }
;

args: '(' arglist ')'; 

arglist: arglist ',' arg
    | arg
;

arg: w VAR SPACE typename;

return_type: arrow_operator VAR w typename;

arrow_operator:
    w '=' '>' w;

typename: TYPENAME_INT;
typename: VAR;

// optional whitespace:
w: 
    SPACE
    |
    /* empty */
;

// whitespace or a newline
wn: 
    w
    |
    NEWLINE
;

function_body: wn '{' NEWLINE indentation lines NEWLINE '}' wn 
    {
        $$ = $5;
    }
    ;

indentation:
    SPACE
    ;

lines: lines line
    {
        $$ = new binary_operator(";",$2,$1);
    }
    | /* empty */
    {
        $$ = 0;
    }
    ;

line: assign_expr expr_end;

expr_end:
    SEMI
;

assign_expr:
  expr
  {
    $$ = $1;
  }
 |
  expr arrow_operator VAR {
     $$ = new assignment_operator($1,$3); 
  }
 |
  expr arrow_operator VAR typename {
     $$ = new assignment_operator($1,$3); 
  }
;

expr: number 
 | 
  expr '+' expr {
     $$ = new binary_operator("+",$1,$3); 
  }
 |
  expr '-' expr {
     $$ = new binary_operator("-",$1,$3); 
  }
 |
  expr '*' expr  {
     $$ = new binary_operator("*",$1,$3); 
  }
 |
  expr '/' expr  {
     $$ = new binary_operator("/",$1,$3); 
  }
 |
  '(' expr ')' {
     $$ = $2; 
  }
;

number:
	NUM 
|   VAR 
;

%%

int yyerror(const char *why) {
	std::cerr<<"Error during parse: "<<why<<std::endl;
	exit(1);
	return 1;
}

int main(void) {
	return yyparse();
}

