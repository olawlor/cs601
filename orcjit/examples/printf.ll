; LLVM IR file as a JIT input example: calls printf and does a little other work

; Hello world string:
@.str = private unnamed_addr constant [19 x i8] c"Hello world: x=%d\0A\00", align 1

define dso_local i64 @jitentry() #0 {
  %sum1 = add i64 2, 3
  %sum2 = add i64 10, %sum1
  %v1 = call i32 (i64) @print_long( i64 %sum2 )
  %v2 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([19 x i8], [19 x i8]* @.str, i64 0, i64 0), i64 %sum2)
  ret i64 7
}

; Attribute to disable optimization:
;attributes #0 = { noinline nounwind optnone uwtable }
attributes #0 = { "frame-pointer"="none"  }

; Prototypes for called functions
declare dso_local i32 @print_long(i64) #1
declare dso_local i32 @printf(i8*, ...) #1


