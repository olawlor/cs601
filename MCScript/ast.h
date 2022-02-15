/*
 Defines abstract syntax tree used for parsing.
 This version supports code generation, emitting x86-64 assembly.
*/

#include <iostream>
#include <stdio.h>
#include <iostream>
#include <ctype.h>
#include <memory>


/// Compiler backend architecture support:
typedef int listing_t; // number of lines of code used (HACK!)

typedef int regnum; // register number

/// Generate a register name from a register number.
inline const char *reggen(regnum r) {
    const char *table[16]={
        "rax","rcx","rdx","rbx","rsp","rbp","rsi","rdi",
        "r8","r9","r10","r11","r12","r13","r14","r15"
    };
    return table[r];
}
enum {RETREG=0}; // number of the return value register
enum {VARREG=6}; // first register number to use for variables


inline listing_t die(const char *why) {
    printf("Fatal error: %s\n",why);
    return 0;
}

/* This is how we pass around references to a 
  syntax_tree_node.  std::shared_ptr would be more
  sensible if a workaround can be found for using it in yacc $$ vars.
*/
typedef class syntax_tree_node *syntax_ptr;

class syntax_tree_node {
public:
    const char *stuff;
    syntax_ptr left, right;
    
    syntax_tree_node(const char *stuff_,
        syntax_ptr left_=NULL, 
        syntax_ptr right_=NULL)
        :stuff(stuff_), 
         left(std::move(left_)), 
         right(std::move(right_)) {}
    
    
    // Recursive traversal functions:
    // Postfix: 2 3 +
    void print_postfix()
    {
        if (left) left -> print_postfix();
        printf(" ");
        if (right) right -> print_postfix();
        printf(" ");
        print_me();
    }
    
    // Infix operator: (2 + 3)
    void print_infix()
    {
        printf("(");
        if (left) left -> print_infix();
        printf(" ");
        print_me();
        printf(" ");
        if (right) right -> print_infix();
        printf(")");
        
    }
    // LISP style: (+ 2 3)
    virtual void print_LISP() {
        printf("(");
        print_me();
        printf(" ");
        if (left) left -> print_LISP();
        printf(" ");
        if (right) right -> print_LISP();
        printf(")");
    }
    
    // Tree-like onscreen, rotated 90 deg
    void print_indent(int indent=0) {
        if (left) left -> print_indent(indent+1);
        for (int i=0;i<indent;i++) printf("    ");
        // printf("%s: ",stuff); 
        print_me(); //<- child type
        printf("\n");
        if (right) right -> print_indent(indent+1);
    }
    
    // Actual JSON
    void print_json(void) {
        printf("{ 'value': ");
        print_me(); //<- child type
        if (left) {
            printf(", 'left': ");
            left -> print_json();
        }
        if (right) {
            printf(", 'right': ");
            right -> print_json();
        }
        printf("}");
    }
    
    /// Compiler backend: emit assembly code to stdout.
    
    /// Puts this code's value in r0
    ///  Returns the number of lines used (HACK, should be real data structure)
    virtual listing_t codegen(void) {
        return getval(RETREG);
    }
    /// Emit code copying our value into this register number
    ///  Returns the number of lines used
    virtual listing_t getval(regnum target) {
        printf("Unknown getval for: ");
        print_me();
        return 0;
    }
    
    /// Get the register storing our value, or -1 if none.
    virtual regnum getreg(void) {
        return -1;
    }
    
    
protected:
    virtual void print_me() {
        printf("%s",stuff);
    }
};

class value_type : public syntax_tree_node {
public:
    value_type() : syntax_tree_node("value") {}
    
    virtual void print_LISP() {
        print_me();
    }
};

class const_val : public value_type {
    double val;
public:
    const_val(double val_) :val(val_) {}
    
    /// Emit code copying our value into this register number
    virtual listing_t getval(regnum target) {
        printf("mov %s,%d\n", reggen(target),(int)val);
        return 1;
    }
    
protected:
    virtual void print_me() {
        printf("%f",val);
    }
};

class var_ref : public value_type {
    std::string var;
public:
    regnum reg;
    var_ref(std::string var_,regnum reg_) :var(var_), reg(reg_) {}
    
    /// Emit code copying our value into this register number
    virtual listing_t getval(regnum target) {
        if (target==reg) return 0; // already there!
        
        printf("mov %s,%s\n", reggen(target),reggen(reg));
        return 1;
    }
    virtual regnum getreg(void) { return reg; }
protected:
    virtual void print_me() {
        printf("%s",var.c_str());
    }
};

#include "symbol_table.h"

class binary_operator : public syntax_tree_node {
public:
    binary_operator(const char *op,
        syntax_ptr left_,
        syntax_ptr right_)
        :syntax_tree_node(op,left_,right_)
    {
    }
    virtual regnum getreg(void) { return RETREG; }
    
    /// 3-operand arithmetic:
    listing_t opgen(regnum target,regnum A,regnum B)
    {
        listing_t count=0;
        if (target!=A) { // need to copy first
            count++; 
            printf("mov %s,%s\n",reggen(target),reggen(A));
        }
        const char *op=NULL;
        switch(stuff[0]) {
        case '+': op="add"; break;
        case '-': op="sub"; break;
        case '*': op="imul"; break;
        };
        if (!op) return die("Can't generate arithmetic operator yet");
        printf("%s %s,%s\n",op,reggen(target),reggen(B));
        return 1+count;
    }
    
    virtual listing_t getval(regnum target) {
        regnum lhs=left -> getreg();
        regnum rhs=right-> getreg();
        if (lhs>RETREG && rhs>RETREG && rhs!=target) 
        { // faster special case for register-to-register operation
            return opgen(target,lhs,rhs);
        }
        else { // not just registers, do it the general way
            listing_t count=0;
            count += left -> getval(RETREG);
            count += right-> getval(RETREG+1);
            return count+opgen(target,RETREG,RETREG+1);
        }
    }
};

class assignment_operator : public binary_operator {
public:
    assignment_operator(
        syntax_ptr left_, 
        syntax_ptr right_)
        :binary_operator("=>",left_,right_)
    {
    }
    
    // left = target of assignment
    // right = source of assignment
    virtual listing_t codegen(void) {
        regnum lhs=left->getreg();
        if (lhs>=RETREG)
        {
            return right->getval(lhs);
        }
        else {
            return die("Error: left hand side of assignment is not a variable!");
        }
    }
    virtual listing_t getval(regnum target) {
        return right->getval(target);
    }
};

/* This is the datatype of the $ variables used in the parser,
   and yylval coming from the lexer. 
   It gets raw-bits copied by yacc's stack reallocation, so 
   using shared_ptr doesn't actually work correctly here. 
*/
#define YYSTYPE syntax_ptr


