/*
 Defines abstract syntax tree used for parsing.
*/

#include <iostream>
#include <stdio.h>
#include <iostream>
#include <ctype.h>
#include <memory>


class syntax_tree_node {
public:
    const char *stuff;
    std::shared_ptr<syntax_tree_node> left, right;
    
    syntax_tree_node(const char *stuff_,
        std::shared_ptr<syntax_tree_node> left_=NULL, 
        std::shared_ptr<syntax_tree_node> right_=NULL)
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

class var_ref : public value_type {
    std::string var;
public:
    var_ref(std::string var_) :var(var_) {}
    
protected:
    virtual void print_me() {
        printf("%s",var.c_str());
    }
};

class const_val : public value_type {
    double val;
public:
    const_val(double val_) :val(val_) {}
    
protected:
    virtual void print_me() {
        printf("%f",val);
    }
};


/* This is the datatype of the $ variables used in the parser,
   and yylval coming from the lexer. */
#define YYSTYPE std::shared_ptr<syntax_tree_node> 


