import type { MooreBinaryTable } from "./mooreToBinaryTable";

export type OutputKey =
  | { kind: "yPrime"; bitIndexFromLSB: number }
  | { kind: "z" };

type KmapLayout = {
  cols: number[];
  rows: number[];
  map: number[];
};

type KmapLabels = {
  cols: string;
  rows: string;
  map: string;
};

function getSlotCounts(vars: number) {
  if (vars === 2) return { cols: 1, rows: 1, map: 0 };
  if (vars === 3) return { cols: 2, rows: 1, map: 0 };
  if (vars === 4) return { cols: 2, rows: 2, map: 0 };
  return { cols: 2, rows: 2, map: 1 };
}

function take(source: number[], count: number): number[] {
  return source.splice(0, count);
}

function getKmapLayout(table: MooreBinaryTable): KmapLayout {
  const total = table.inputBits + table.bits;
  const { cols: colSlots, rows: rowSlots, map: mapSlots } = getSlotCounts(total);

  const inputIndices = Array.from({ length: table.inputBits }, (_, i) => i);
  const stateIndices = Array.from({ length: table.bits }, (_, i) => table.inputBits + i);

  const remainingInputs = [...inputIndices];
  const remainingStates = [...stateIndices];

  const cols = take(remainingInputs, colSlots);
  while (cols.length < colSlots && remainingStates.length > 0) cols.push(remainingStates.shift()!);
  while (cols.length < colSlots && remainingInputs.length > 0) cols.push(remainingInputs.shift()!);

  const rows = take(remainingStates, rowSlots);
  while (rows.length < rowSlots && remainingInputs.length > 0) rows.push(remainingInputs.shift()!);
  while (rows.length < rowSlots && remainingStates.length > 0) rows.push(remainingStates.shift()!);

  const map: number[] = [];
  while (map.length < mapSlots && remainingStates.length > 0) map.push(remainingStates.shift()!);
  while (map.length < mapSlots && remainingInputs.length > 0) map.push(remainingInputs.shift()!);

  return { cols, rows, map };
}

function arrangeBitsForKmap(bits: number[], layout: KmapLayout): number[] {
  return [...layout.cols, ...layout.rows, ...layout.map].map((index) => bits[index] ?? 0);
}

function kmapIndexFromVars(bits: number[]): number {
  let idx = 0;
  for (const bit of bits) {
    idx = (idx << 1) | (bit & 1);
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
  return s.includes("(dc)") || s.includes("unused state") || s.includes("input code") || s.includes("stato non usato");
}

/**
 * Variabili della K-map = [xBits..., yBits...] (MSB -> LSB)
 * cioè: prima input (x), poi stato corrente (y).
 *
 * Output:
 * - { kind: "yPrime", bitIndexFromLSB: 0 } => y1' (LSB di yNext)
 * - { kind: "yPrime", bitIndexFromLSB: 1 } => y2'
 * - ...
 * - { kind: "z" } => z
 */
export function buildKmapSetsFromBinaryTable(
  table: MooreBinaryTable,
  out: OutputKey
): { variables: number; minterms: number[]; dontCares: number[] } {
  const variables = table.inputBits + table.bits;
  const size = pow2(variables);
  const layout = getKmapLayout(table);

  // default DC, poi sovrascrivo dove ho righe definite
  const truth: (0 | 1 | 2)[] = Array(size).fill(2);

  for (const r of table.rows) {
    const rawBits = [...r.xBits, ...r.y];
    const idx = kmapIndexFromVars(arrangeBitsForKmap(rawBits, layout));

    if (isDontCareRow(r.note)) {
      truth[idx] = 2;
      continue;
    }

    let value: 0 | 1 = 0;

    if (out.kind === "z") {
      value = r.z;
    } else {
      const bitIndexFromLSB = out.bitIndexFromLSB;
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

export function getOutputKeysForTable(table: MooreBinaryTable): OutputKey[] {
  const outputs: OutputKey[] = [];

  for (let bit = table.bits - 1; bit >= 0; bit--) {
    outputs.push({ kind: "yPrime", bitIndexFromLSB: bit });
  }

  outputs.push({ kind: "z" });
  return outputs;
}

export function formatOutputKey(out: OutputKey): string {
  if (out.kind === "z") return "z";
  return `y${out.bitIndexFromLSB + 1}'`;
}

export function describeOutputKey(out: OutputKey, table: MooreBinaryTable): string {
  if (out.kind === "z") {
    return "z output";
  }

  const msbPosition = table.bits - out.bitIndexFromLSB;
  return `bit ${msbPosition} of y'`;
}

export function getKmapLabelsForBinaryTable(table: MooreBinaryTable): KmapLabels {
  const layout = getKmapLayout(table);
  const variableNames = getOrderedVariableNamesForBinaryTable(table);

  const toLabel = (indices: number[]) => indices.map((_, pos) => {
    if (indices === layout.cols) return variableNames[pos];
    if (indices === layout.rows) return variableNames[layout.cols.length + pos];
    return variableNames[layout.cols.length + layout.rows.length + pos];
  }).join(", ");

  return {
    cols: toLabel(layout.cols),
    rows: toLabel(layout.rows),
    map: toLabel(layout.map),
  };
}

export function getOrderedVariableNamesForBinaryTable(table: MooreBinaryTable): string[] {
  const layout = getKmapLayout(table);
  const variableNames = [
    ...Array.from({ length: table.inputBits }, (_, i) => `x_${table.inputBits - i}`),
    ...Array.from({ length: table.bits }, (_, i) => `y_${table.bits - i}`),
  ];

  return [...layout.cols, ...layout.rows, ...layout.map].map((index) => variableNames[index]);
}
