import type { Bit, Bits } from "../../types/fsm";
export function bitsToIndex(bits: Bits): number {
  // bits = [b_msb, ..., b_lsb]
  let n = 0;
  for (const b of bits) n = (n << 1) | b;
  return n;
}

export function concatBits(a: Bits, b: Bits): Bits {
  return [...a, ...b];
}

export function parseBits(token: string, expectedLen: number): Bits {
  const t = token.trim();
  if (t.length !== expectedLen) {
    throw new Error(`Bitstring "${token}" length != ${expectedLen}`);
  }
  const out: Bits = [];
  for (const ch of t) {
    if (ch !== "0" && ch !== "1") throw new Error(`Invalid bit '${ch}' in "${token}"`);
    out.push(ch === "1" ? 1 : 0);
  }
  return out;
}

export function parseBitOrX(token: string): Bit | "X" {
  const t = token.trim().toUpperCase();
  if (t === "0") return 0;
  if (t === "1") return 1;
  if (t === "X") return "X";
  throw new Error(`Invalid bit/X: "${token}"`);
}