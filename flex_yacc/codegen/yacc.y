%{
/* yacc / bison turns this file into "parser.cpp" and "parser.h" */
#include "ast.h"
#include "parser.h"

int yylex();
int yyerror(const char *s);

%}

// For some reason yacc can be used to define lexer token symbolic names
%token NUM SEMI VAR SPACE TYPENAME_INT

// Resolve grammar ambiguities using yacc, not the grammer itself.
%right '='
%left '+'
%left '-'
%left '*'
%left '/'

%%

input: /* empty */
	| input line 
	{ 
	    printf("\nExpression: ");
	    $2 -> print_infix();
	    printf("\nCode: \n");
	    $2 -> codegen();
	}
;

line: expr SEMI
    | typename SPACE VAR '=' expr SEMI {
        $$ = new assignment_operator($3,$5); 
    }
;

typename: TYPENAME_INT
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
 |
  VAR '=' expr {
     $$ = new assignment_operator($1,$3); 
  }
;

number:
	NUM 
|   VAR 
;

%%

int yyerror(const char *why) {
	printf("Error during parse: %s\n",why);
	return 1;
}

int main(void) {
	return yyparse();
}

