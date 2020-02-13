%option noyywrap
%{
/* lex turns this file into "lexer.cpp" */
#include "shared.h"
#include "parser.h"


%}

digit [0-9]


%%
{digit}+ { yylval=atof(yytext); return NUM; }
[;]	{ return SEMI; }
.	{ printf("Unknown char '%s'\n",yytext); }

%%

