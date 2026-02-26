import type { MooreBinaryTable } from "./mooreToBinaryTable";

export type TTValue = 0 | 1 | 2; // 2 = don't care (X)

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

export type OutputSelector =
  | { kind: "yPrime"; bitIndexFromLSB: number } // 0=y1', 1=y2', 2=y3' ...
  | { kind: "z" };

export function buildSetsFromBinaryTable(
  table: MooreBinaryTable,
  sel: OutputSelector
): {
  variables: number;
  minterms: number[];
  dontCares: number[];
  truth: TTValue[];
} {
  const variables = table.inputBits + table.bits;
  const size = pow2(variables);

  // Inizializza a X (DC) e poi “scriviamo” le righe definite
  const truth: TTValue[] = Array(size).fill(2);

  for (const r of table.rows) {
    const idx = bitsToIndex([...r.xBits, ...r.y]); // ordine: input poi stato corrente
    if (isDontCareRow(r.note)) {
      truth[idx] = 2;
      continue;
    }

    let value: 0 | 1 = 0;
    if (sel.kind === "z") {
      value = r.z;
    } else {
      // yNext è MSB->LSB: [yN', ..., y1']
      const pos = table.bits - 1 - sel.bitIndexFromLSB; // 0 => ultimo bit (y1')
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

  return { variables, minterms, dontCares, truth };
}