
define i64 @jitentry() #0 {
start:
  br label %brazil

peru:
    %y = add i64 123, 0
    br label %done

argentina:
    %x = add i64 1, 2
    br label %done

brazil:
    br label %done

done:
  %z = phi i64 [%y, %peru], [%x, %argentina], [-99, %brazil]
  ret i64 %z
}

attributes #0 = { "frame-pointer"="none" }

