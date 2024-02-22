; LLVM IR file as a JIT input example.
; 
@.str = private unnamed_addr constant [15 x i8] c"Hello world!!\0A\00", align 1

; Function Attrs: noinline nounwind optnone uwtable
define dso_local void @jitentry() #0 {
  %1 = call i32 (i64) @print_long(i64 123)
  %2 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([15 x i8], [15 x i8]* @.str, i64 0, i64 0))
  ret void
}

declare dso_local i32 @print_long(i64) #1
declare dso_local i32 @printf(i8*, ...) #1


