%option noyywrap
%{
/* C code from lex.l */
#include "parser.h"


%}

digit [0-9]


%%
{digit}+ { yylval=atof(yytext); return NUM; }
[;]	{ return SEMI; }
.	{ printf("Unknown char '%s'\n",yytext); }

%%

