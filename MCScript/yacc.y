%{
/* yacc / bison turns this file into "parser.cpp" and "parser.h" */
#include "ast.h"
#include "parser.h"

int yylex();
int yyerror(const char *s);

%}

// This improves errors a lot
%define parse.error verbose

// For some reason yacc can be used to define lexer token symbolic names
%token NUM FUNCTION SEMI VAR SPACE TYPENAME_INT NEWLINE

// Resolve grammar ambiguities using yacc, not the grammer itself.
%right '='
%left '+'
%left '-'
%left '*'
%left '/'
%left '('

%%

input: /* empty */
	| input function 
;

function: FUNCTION SPACE VAR args return_type function_body
    {
	    std::cout<<"\nFunction: ";
	    $3 -> print_infix();
	    std::cout<<"\nBody: \n";
	    $6 -> print_indent();
	    std::cout<<"\n\n";
	    $6 -> print_infix();
	    std::cout<<"\n\n";
	    $6 -> codegen();
	    std::cout<<"\n\n";
	    $6 -> print_LISP();
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

typename: TYPENAME_INT 
    {
        $$ = new var_ref("i64",0);
    }
    ;
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

function_body: wn '{' NEWLINE lines wn '}' wn 
    {
        $$ = $4;
    }
    ;

lines: line lines
    {
        $$ = new binary_operator(";",$1,$2);
    }
    | /* empty */
    {
        $$ = 0;
    }
    ;

line: indentation assign_expr expr_end
    {
        $$ = $2;
    }
;

indentation:
    SPACE
    ;

expr_end:
    SEMI
|
    NEWLINE
;

// Top-level expression:
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
  expr arrow_operator VAR w typename {
     $$ = new assignment_operator($1,
        new binary_operator("TypeDecl",$3,$5)); 
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
  expr '(' expr ')'  {
     $$ = new binary_operator("()",$1,$3); 
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

extern bool verbose_tokens; // <- declared in lex.l
int main(int argc,char *argv[]) 
{
    for (int argi=1;argi<argc;argi++) {
        if (argv[argi]==std::string("-v")) verbose_tokens=true;
        else std::cerr<<"Unknown command line option "<<argv[argi]<<std::endl;
    }
    
	return yyparse();
}

