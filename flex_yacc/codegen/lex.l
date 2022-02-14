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
    yylval=new const_val(parsed_num);
    return NUM; 
}
int { // typename for integer
    return TYPENAME_INT;
}
[a-zA-Z_$][a-zA-Z_$0-9]* {  // a variable reference
    yylval=symbol_table.lookup(yytext).get(); // new var_ref(yytext);
    return VAR;
}
[;]	{ // semicolon (returned as a token)
    return SEMI; 
}
[+\-*/%^=()] { // operators (returned as a bare char)
    return yytext[0]; 
} 
[ \t]+ {
    return SPACE;
}
.	{ // unrecognized chars
    printf("Unknown char '%s'\n",yytext); 
}
%%

