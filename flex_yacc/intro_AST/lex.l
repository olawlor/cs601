%option noyywrap
%{
/* lex turns this file into "lexer.cpp" */
#include "ast.h"
#include "parser.h"

%}

digit [0-9]


%%
{digit}+|{digit}+[.]{digit}*|[.]{digit}+ { // a number
    double parsed_num = atof(yytext);
    yylval=std::make_shared<const_val>(parsed_num);
    return NUM; 
}
[a-zA-Z_$][a-zA-Z_$0-9]* {  // a variable reference
    yylval=std::make_shared<var_ref>(yytext);
    return VAR;
}
[;]	{ // semicolon (returned as a token)
    return SEMI; 
}
[+\-*/%^=()] { // operators (returned as a bare char)
    return yytext[0]; 
} 
.	{ // unrecognized chars
    printf("Unknown char '%s'\n",yytext); 
}
%%

