/*
 Integer factoring with KLEE
 */
#include <stdlib.h> // for exit
#include <assert.h> // for assert
#include "klee/klee.h"

int main() {
  int x;
  klee_make_symbolic(&x, sizeof(x), "x");
  int y;
  klee_make_symbolic(&y, sizeof(y), "y");
  
  int n = 15; // number we want to factor
  bool FOUND=false;

  int z = x*y;
  if (z==n) FOUND=true;
  
  if (x<=1 || y<=1) FOUND=false; // prevent 1*n or -1*-n
  if (x>=n || y>=n) FOUND=false; // prevent overflow
  
  
  if (FOUND) {
    assert(0); // flag this code path as a .err
  }
} 


