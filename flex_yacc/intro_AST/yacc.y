%{
/* yacc / bison turns this file into "parser.cpp" and "parser.h" */
#include "ast.h"
#include "parser.h"

int yylex();
int yyerror(const char *s);

%}

%token NUM SEMI VAR

%right '='
%left '+'
%left '*'

%%

input: /* empty */
	| input line 
	{ 
	    //std::cout<<"Parsed a line: ";
	    printf("Infix: ");
	    $2 -> print_infix();
	    printf("\n\n");
	    
	    printf("Postfix: ");
	    $2 -> print_postfix();
	    printf("\n\n");
	    
	    printf("LISP style: ");
	    $2 -> print_LISP();
	    printf("\n\n");
	    
	    printf("Indented tree: \n");
	    $2 -> print_indent(0);
	    printf("\n");
	    
	    printf("JSON = \"");
	    $2 -> print_json();
	    printf("\"\n\n");
	}
;

line: expr SEMI;

expr: number 
 | 
  expr '*' expr  {
     $$ = std::make_shared<syntax_tree_node>("*",$1,$3); 
  }
 |
  expr '+' expr {
     $$ = std::make_shared<syntax_tree_node>("+",$1,$3); 
  }
 |
  '(' expr ')' {
     $$ = $2; 
  }
 |
  VAR '=' expr {
     $$ = std::make_shared<syntax_tree_node>("=",$1,$3); 
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

