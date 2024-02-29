define i32 @jitentry() {
  %zero = add i32 0,0
  %r1addr = alloca i32, align 4
  store i32 %zero, i32 *%r1addr, align 4
  %r2addr = alloca i32, align 4
  store i32 %zero, i32 *%r2addr, align 4
  %r3addr = alloca i32, align 4
  store i32 %zero, i32 *%r3addr, align 4
  %r4addr = alloca i32, align 4
  store i32 %zero, i32 *%r4addr, align 4
  %r5addr = alloca i32, align 4
  store i32 %zero, i32 *%r5addr, align 4
  %r6addr = alloca i32, align 4
  store i32 %zero, i32 *%r6addr, align 4
  %r7addr = alloca i32, align 4
  store i32 %zero, i32 *%r7addr, align 4
  %r8addr = alloca i32, align 4
  store i32 %zero, i32 *%r8addr, align 4
  %r9addr = alloca i32, align 4
  store i32 %zero, i32 *%r9addr, align 4
  %rAaddr = alloca i32, align 4
  store i32 %zero, i32 *%rAaddr, align 4
  %rBaddr = alloca i32, align 4
  store i32 %zero, i32 *%rBaddr, align 4
  %rCaddr = alloca i32, align 4
  store i32 %zero, i32 *%rCaddr, align 4
  %rDaddr = alloca i32, align 4
  store i32 %zero, i32 *%rDaddr, align 4
  %rEaddr = alloca i32, align 4
  store i32 %zero, i32 *%rEaddr, align 4
  %rFaddr = alloca i32, align 4
  store i32 %zero, i32 *%rFaddr, align 4
  br label %j00; initial startup
;                     TRACE 000: a0100006
j00:
  %X00 = add i32 0, 0
  %Y00 = add i32 0, 0
  %C00 = add i32 %Y00, 6
  %D00 = add i32 %X00, %C00
  store i32 %D00, i32 * %r1addr, align 4
  br label %j01
;                     TRACE 001: a0200000
j01:
  %X01 = add i32 0, 0
  %Y01 = add i32 0, 0
  %C01 = add i32 %Y01, 0
  %D01 = add i32 %X01, %C01
  store i32 %D01, i32 * %r2addr, align 4
  br label %j02
;                     TRACE 002: a0300001
j02:
  %X02 = add i32 0, 0
  %Y02 = add i32 0, 0
  %C02 = add i32 %Y02, 1
  %D02 = add i32 %X02, %C02
  store i32 %D02, i32 * %r3addr, align 4
  br label %j03
;                     TRACE 003: a0400001
j03:
  %X03 = add i32 0, 0
  %Y03 = add i32 0, 0
  %C03 = add i32 %Y03, 1
  %D03 = add i32 %X03, %C03
  store i32 %D03, i32 * %r4addr, align 4
  br label %j04
;                     TRACE 004: a0500000
j04:
  %X04 = add i32 0, 0
  %Y04 = add i32 0, 0
  %C04 = add i32 %Y04, 0
  %D04 = add i32 %X04, %C04
  store i32 %D04, i32 * %r5addr, align 4
  br label %j05
;                     TRACE 005: a0f0000a
j05:
  br label %j0A
;                     TRACE 006: a0230000
j06:
  %X06 = load i32, i32 * %r3addr, align 4
  %Y06 = add i32 0, 0
  %C06 = add i32 %Y06, 0
  %D06 = add i32 %X06, %C06
  store i32 %D06, i32 * %r2addr, align 4
  br label %j07
;                     TRACE 007: a0340000
j07:
  %X07 = load i32, i32 * %r4addr, align 4
  %Y07 = add i32 0, 0
  %C07 = add i32 %Y07, 0
  %D07 = add i32 %X07, %C07
  store i32 %D07, i32 * %r3addr, align 4
  br label %j08
;                     TRACE 008: a0423000
j08:
  %X08 = load i32, i32 * %r2addr, align 4
  %Y08 = load i32, i32 * %r3addr, align 4
  %C08 = add i32 %Y08, 0
  %D08 = add i32 %X08, %C08
  store i32 %D08, i32 * %r4addr, align 4
  br label %j09
;                     TRACE 009: a0550001
j09:
  %X09 = load i32, i32 * %r5addr, align 4
  %Y09 = add i32 0, 0
  %C09 = add i32 %Y09, 1
  %D09 = add i32 %X09, %C09
  store i32 %D09, i32 * %r5addr, align 4
  br label %j0A
;                     TRACE 00a: a0e00006
j0A:
  %X0A = add i32 0, 0
  %Y0A = add i32 0, 0
  %C0A = add i32 %Y0A, 6
  %D0A = add i32 %X0A, %C0A
  store i32 %D0A, i32 * %rEaddr, align 4
  br label %j0B
;                     TRACE 00b: c0f51000
j0B:
  %X0B = load i32, i32 * %r5addr, align 4
  %Y0B = load i32, i32 * %r1addr, align 4
  %C0B = add i32 %Y0B, 0
  %S0B = icmp slt i32 %X0B, %C0B
  br i1 %S0B, label %swap0B, label %j0C
 swap0B:
  %D0B = add i32 0, 12
  %E0B = load i32, i32 * %rEaddr, align 4
  store i32 %D0B, i32 * %rEaddr, align 4
  store i32 %E0B, i32 * %rFaddr, align 4
  br label %rFjump
;                     TRACE 00c: ff200000
j0C:
  %D0C = load i32, i32 * %r2addr, align 4
  ret i32 %D0C
j0D:
  br label %exit

exit: ; fail and exit
  %minus = add i32 0, -999
  ret i32 %minus

rFjump: ; indirect jump table
  %target = load i32, i32 *%rFaddr, align 4
  switch i32 %target, label %exit [   i32 0, label %j00    i32 1, label %j01    i32 2, label %j02    i32 3, label %j03    i32 4, label %j04    i32 5, label %j05    i32 6, label %j06    i32 7, label %j07    i32 8, label %j08    i32 9, label %j09    i32 10, label %j0A    i32 11, label %j0B    i32 12, label %j0C   ]

}
