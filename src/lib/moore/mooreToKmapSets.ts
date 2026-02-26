import type { MooreBinaryTable } from "./mooreToBinaryTable";

export type OutputKey = "y1p" | "y2p" | "y3p" | "z";

function kmapIndexFromVars(bits: number[]): number {
  const vars = bits.length;
  let order: number[] = [];

  if (vars === 2) order = [1, 0];
  else if (vars === 3) order = [2, 0, 1];
  else if (vars === 4) order = [2, 3, 0, 1];
  else if (vars === 5) order = [4, 2, 3, 0, 1];
  else order = Array.from({ length: vars }, (_, i) => i);

  let idx = 0;
  for (const i of order) {
    idx = (idx << 1) | (bits[i] & 1);
  }
  return idx;
}

function pow2(n: number) {
  return 1 << n;
}

function bitsToIndex(bits: number[]): number {
  let v = 0;
  for (let i = 0; i < bits.length; i++) v = (v << 1) | (bits[i] & 1);
  return v;
}

function isDontCareRow(note?: string): boolean {
  if (!note) return false;
  const s = note.toLowerCase();
  return s.includes("(dc)") || s.includes("stato non usato") || s.includes("input code");
}

/**
 * Variabili della K-map = [xBits..., yBits...] (MSB -> LSB)
 * cioè: prima input (x), poi stato corrente (y).
 *
 * Output:
 * - y1p => y1' (LSB di yNext)
 * - y2p => y2'
 * - y3p => y3'
 * - z   => z
 */
export function buildKmapSetsFromBinaryTable(
  table: MooreBinaryTable,
  out: OutputKey
): { variables: number; minterms: number[]; dontCares: number[] } {
  const variables = table.inputBits + table.bits;
  const size = pow2(variables);

  // default DC, poi sovrascrivo dove ho righe definite
  const truth: (0 | 1 | 2)[] = Array(size).fill(2);

  for (const r of table.rows) {
    const rawBits = [...r.xBits, ...r.y];
    const idx = kmapIndexFromVars(rawBits);

    if (isDontCareRow(r.note)) {
      truth[idx] = 2;
      continue;
    }

    let value: 0 | 1 = 0;

    if (out === "z") {
      value = r.z;
    } else {
      const bitIndexFromLSB = out === "y1p" ? 0 : out === "y2p" ? 1 : 2;
      const pos = table.bits - 1 - bitIndexFromLSB; // 0 => ultimo bit (y1')
      value = (r.yNext[pos] ?? 0) as 0 | 1;
    }

    truth[idx] = value;
  }

  const minterms: number[] = [];
  const dontCares: number[] = [];

  for (let i = 0; i < size; i++) {
    const v = truth[i] ?? 2;
    if (v === 1) minterms.push(i);
    else if (v === 2) dontCares.push(i);
  }

  return { variables, minterms, dontCares };
}