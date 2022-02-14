// This gets included in the middle of ast.h

#include <map>

class symbol_table_t {
public:
    symbol_table_t();
    ~symbol_table_t();
    
    // Look up the variable reference for this variable name,
    //  or create a new one if none exists yet.
    std::shared_ptr<var_ref> lookup(const char *name);

private:
    regnum nextReg; // next unused register number
    std::map<std::string,std::shared_ptr<var_ref> > table;
};

extern symbol_table_t symbol_table;

