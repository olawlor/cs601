# BRISC

**BRISC** (Bootstrapped RISC) is a minimal instruction set designed for simplicity, extensibility, and long-term hardware compatibility. It is intentionally small enough for a CS student to simulate from scratch, while remaining a credible foundation for diverse modern hardware, including SIMD, codec, and neural-network accelerators. It "bootstraps" from just five types of "level 0" instructions to simulate higher level instructions on simple hardware, while allowing more complex hardware to execute new instructions directly, with full forward and backward software compatibility.

---

## Registers

All registers hold word values (currently 32-bit) and are identified by a 4-bit field (hex digit) in the machine code, giving 16 registers total: `r0`–`rF`.

| Register | Name | Role / Convention |
|----------|------|-------------------|
| `r0` | Zero | **Hardware:** always reads as `0`; writes are ignored |
| `r1` | Return / Arg 1 | Function return value; first argument |
| `r2`–`r7` | Args 2–7 | Function argument registers |
| `r1`–`r9` | Scratch | Caller-saved scratch registers (includes `r1`–`r7`) |
| `rA` | Stack Pointer | Stack pointer (built with Level 1 instructions) |
| `rB`–`rC` | Preserved | Callee-saved registers |
| `rD` | Reserved | Instruction decode frame pointer |
| `rE` | Link Register | Holds return address (old program counter) |
| `rF` | Program Counter | **Hardware:** hardwired as the PC |

---

## Instruction Encoding

BRISC instructions use this 32-bit instruction encoding:

```
  0xop d a b xxx
     │ │ │ │  └── minor field (12 bits, meaning varies per opcode)
     │ │ │ └──── source register b (4 bits)
     │ │ └────── source register a (4 bits)
     │ └──────── destination register d (4 bits)
     └────────── major opcode (8 bits)
```

These are all the level 0 instructions:

| Encoding | Mnemonic | Summary |
|----------|----------|---------|
| `0x0A d ab ccc` | **ADD** | Add with signed 12-bit immediate |
| `0x0B d ab ccc` | **ROT** | Bitwise right rotation |
| `0x0C d ab ccc` | **CSWAP** | Conditional register swap |
| `0x0D d ab MIN` | **NAND** | Generalized NAND with optional inversions |
| `0x0E d ab MIN` | **MEM** | Memory read, write, or atomic swap |

### ADD — `0x0A d ab ccc`
Does `r[d] = r[a] + r[b] + sign_extend(ccc)`

Adds `r[a]`, `r[b]`, and `ccc` as a signed 12-bit immediate. Common idioms:

| Encoding | Idiom |
|----------|-------|
| `b=0, ccc=0` | Register copy: `r[d] = r[a]` (destination = sourceA + 0) |
| `d=a, b=0, ccc=1` | Increment: `r[d] = r[a] + 1` |
| `d=a, b=0, ccc=FFF` | Decrement: `r[d] = r[a] - 1` |
| `a=F, b=0` | Compute a PC-relative address (relative to the next instruction) |

### ROT — `0x0B d ab ccc`
Does `r[d] = rotate_right(r[a], r[b] + sign_extend(ccc))`

Bit rotates `r[a]` right by `r[b] + sign_extend(ccc)` bits. The signed 12-bit `ccc` allows a constant shift amount without consuming a register.

### CSWAP — `0x0C d ab ccc`
Does `if (r[b] >= sign_extend(ccc)) swap(r[d], r[a])`

Swaps `r[d]` and `r[a]` if `r[b] >= sign_extend(ccc)`. Because the swap is symmetric, the same encoding serves for both function call and return — the convention is which register holds the PC.

| Encoding | Idiom |
|----------|-------|
| `b=0, ccc=0` | Unconditional swap: `swap(r[d], r[a])` |
| `d=F, a=E` | Function call: swaps PC (`rF`) with link register (`rE`) |
| `d=E, a=F` | Function return: swaps link register back into PC |

### NAND — `0x0D d ab MIN`
Does `r[d] = cnot(NAND(cnot(r[a], I), cnot(r[b], N)), M)`

Bitwise NAND with inversion flags.

The `MIN` field provides three independent inversion flags — **M** inverts the output, **I** inverts input `r[a]`, **N** inverts input `r[b]`.  This makes NAND a universal gate capable of expressing many common bitwise operations in a single instruction.

| `MIN` | Operation | Idiom |
|-------|-----------|----------------------|
| `000` | NAND | `nand(r[a], r[b])` |
| `100` | AND | `r[a] & r[b]` (AND — invert output of NAND) |
| `011` | OR | `r[a] \| r[b]` (OR — De Morgan's: invert both inputs before NAND) |
| `001` with `b=0` | NOT | `~r[a]` (NOT — NAND(`r[a]`,`~r[0]` == all ones)) |

### MEM — `0x0E d ab MIN` 
Does `memory_op(M, r[d], addr(r[a], sign_extend(IN)))`

`M` selects the memory operation type; `IN` is a signed 8-bit word offset from `r[a]`. `b` must be `0` and is reserved for future use (e.g. segment identifier or scaled offset). Addresses are machine words (currently 32 bits).

| `M` | Operation |
|-----|-----------|
| `0` | Read: `r[d] = mem[r[a] + IN]` |
| `1` | Write: `mem[r[a] + IN] = r[d]` |
| `2` | Atomic swap: `swap(r[d], mem[r[a] + IN])` |

---

## BRISC Design Goals

- **Minimal simulator** — complexity only slightly above a Turing Machine; implementable by a CS grad student in a weekend.
- **Real hardware path** — encoding is clean enough to serve as a foundation for actual chip design.
- **ASIC compatibility** — old hardware runs new code; new hardware runs old code faster. Designed to accommodate SIMD vectors of varying width, video/audio codecs, and matrix-multiply / neural-network accelerators as Level 1+ extensions.
- **LLM-friendly** — regular encoding and small opcode table make it easy for language models to generate correct code.

---

## Instruction Levels

| Level | Description |
|-------|-------------|
| **0** | Core instructions defined above — the minimal complete set |
| **1+** | Higher-level and hardware-accelerated extensions (stack ops, SIMD, codec, matmul, etc.) built atop Level 0 with full backward compatibility |




(Claude Sonnet 4.5 was used to help prepare this README.  The entire design and implementation are by Dr. Orion Lawlor and the CS 601 class in 2026.)


