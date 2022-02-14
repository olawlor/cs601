#include "ast.h"

symbol_table_t symbol_table;

symbol_table_t::symbol_table_t()
    :nextReg(VARREG)
{
}
symbol_table_t::~symbol_table_t()
{}

// Look up the variable reference for this variable name,
//  or create a new one if none exists yet.
std::shared_ptr<var_ref> symbol_table_t::lookup(const char *name)
{
    auto it=table.find(name);
    if (it!=table.end()) return it->second;

    // Else make new variable
    regnum r=nextReg++;
    printf("; %s = %s\n",reggen(r),name);
    std::shared_ptr<var_ref> v=std::make_shared<var_ref>(name,r);
    table[name]=v;
    return v;
}



