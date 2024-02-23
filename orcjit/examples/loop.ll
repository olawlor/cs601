; Simple for (i=0;i<10;i++) loop, implemented with load/store

define i64 @jitentry() #0 {
  %i = alloca i64, align 8  ; allocate i
  store i64 0, i64* %i, align 8 ; i = 0
  br label %again  ; seems to be necessary, otherwise the label breaks?
 
 again:
  %iold = load i64, i64* %i, align 8
  %inew = add i64 %iold, 1
  store i64 %inew, i64* %i, align 8 ; store new i
  
  %more = icmp slt i64 %inew, 10 ; is i<10?
  br i1 %more, label %again, label %done
  
 done:
  ret i64 %inew
}

attributes #0 = { "frame-pointer"="none" }

