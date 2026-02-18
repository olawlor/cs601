
; Two LLVM IR approaches to implement this C++ code:
;   int compare(int arg) {
;      if (arg==5) { x=1 } else { x=2 }
;   }


; alloca version of comparison
; (easier to understand, slower before optimization)
define i32 @compare_alloca(i32 %arg) {
      %x_addr = alloca i32
      %c = icmp eq i32 %arg, 5
      br i1 %c, label %then, label %else

    then: ; write a 1 to x
      store i32 1, ptr %x_addr
      br label %merge

    else: ; write a 2 to x
      store i32 2, ptr %x_addr
      br label %merge

    merge:
      %x = load i32, ptr %x_addr
      
      ; Now you can use %x as a normal i32
      ret i32 %x
}


; phi version of comparison
; (harder to understand, but faster)
define i32 @compare_phi(i32 %arg) {
      %c = icmp eq i32 %arg, 5
      br i1 %c, label %then, label %else

    then: ; we need separate "come from" labels below
      br label %merge

    else: ; (note these do the same thing with different labels!)
      br label %merge

    merge:
      ; The magic happens here:
      ; "If I came from %then, %x is 1. If I came from %else, %x is 2."
      %x = phi i32 [ 1, %then ], [ 2, %else ]
      
      ; Now you can use %x as a normal i32
      ret i32 %x
}




