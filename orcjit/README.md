# ORCJIT Demo
This is a tiny single-file demo of how to call LLVM ORC's just-in-time (JIT) compiler.


## Configure Packages
To set up LLVM ORC packages for clang 14 on Ubuntu 22.04:

    sudo apt-get install clang llvm-dev libstdc++-12-dev

To set up LLVM ORC packages for clang 10 on Ubuntu 20.04:

    sudo apt-get install clang llvm-dev libstdc++-9-dev

(Check the right libstdc++ header with   clang++ -v -E)

The llvm that comes with Ubuntu 18.04 is too old for this code.

## Compile and Run

Compile with:

    make

or

    clang++ main.cpp `llvm-config --cxxflags --ldflags --system-libs --libs core orcjit native` -o jit

Run with:

    ./jit

This reads from in.ll, an LLVM IR file.


