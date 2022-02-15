%option noyywrap
%option nounput
%{
/* lex turns this file into "lexer.cpp" */
#include "ast.h"
#include "parser.h"

bool verbose_tokens=false;

%}

digit [0-9]


%%
{digit}+ { // a number
    if (verbose_tokens) std::cout<<"token num ("<<yytext<<")\n";
    long parsed_num = atol(yytext);
    yylval=new const_val(parsed_num);
    return NUM; 
}
function { // keyword to declare function
    if (verbose_tokens) std::cout<<"token function keyword ("<<yytext<<")\n";
    return FUNCTION;
}
i64 { // typename for integer
    if (verbose_tokens) std::cout<<"token i64 keyword ("<<yytext<<")\n";
    return TYPENAME_INT;
}
[a-zA-Z_$][a-zA-Z_$0-9]* {  // a variable reference
    if (verbose_tokens) std::cout<<"token var ("<<yytext<<")\n";
    yylval=symbol_table.lookup(yytext).get(); // new var_ref(yytext);
    return VAR;
}
[;]	{ // semicolon (returned as a token)
    if (verbose_tokens) std::cout<<"token SEMI\n";
    return SEMI; 
}
[,+\-*/%^=<>(){}] { // operators (returned as a bare char)
    if (verbose_tokens) std::cout<<"token "<<yytext<<"\n";
    return yytext[0]; 
} 
[ \t]+ {
    if (verbose_tokens) std::cout<<"token SPACE ("<<yytext<<")\n";
    return SPACE;
}
[\n]+ {
    if (verbose_tokens) std::cout<<"token NEWLINE \n";
    return NEWLINE;
}
.	{ // unrecognized chars
    std::cerr<<"Lexer skipping unknown char '"<<yytext<<"'\n"; 
}
%%

