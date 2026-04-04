// Utility functions for Karnaugh Map logic
// Generate Gray codes for n bits
export function generateGrayCodes(n: number): string[] {
  if (n <= 0) return [""];
  if (n === 1) return ["0", "1"];
  
  const prev = generateGrayCodes(n - 1);
  const result: string[] = [];
  
  // Mirror construction
  for (let i = 0; i < prev.length; i++) {
    result.push("0" + prev[i]);
  }
  for (let i = prev.length - 1; i >= 0; i--) {
    result.push("1" + prev[i]);
  }
  
  return result;
}

// Get row and column bit counts based on total variables
export function getGridDimensions(vars: number) {
  // 2 vars: 1 row bit (A), 1 col bit (B) -> 2x2
  // 3 vars: 1 row bit (A), 2 col bits (BC) -> 2x4
  // 4 vars: 2 row bits (AB), 2 col bits (CD) -> 4x4
  // 5 vars: 2 row bits (AB), 2 col bits (CD) -> 4x4 (Two grids)
  
  if (vars === 2) return { rowBits: 1, colBits: 1 };
  if (vars === 3) return { rowBits: 1, colBits: 2 };
  if (vars === 4) return { rowBits: 2, colBits: 2 };
  if (vars === 5) return { rowBits: 2, colBits: 2 }; // Handled specially as 2 maps
  return { rowBits: 2, colBits: 2 };
}

function bitsToMintermIndex(bits: string): number {
  return parseInt(bits, 2);
}

// Calculate the minterm index from grid coordinates
export function getMintermIndex(
  rowGray: string, 
  colGray: string, 
  mapIndex: number = 0, // For 5 vars, mapIndex 0 = x_4' (0), mapIndex 1 = x_4 (1)
  variables?: number
): number {
  // UI convention:
  // - columns carry the lowest-index variables shown at the top
  // - rows carry the remaining variables shown on the left
  // - for 5 vars the extra map selector is x_4
  //
  // The truth table and solver interpret x_0 as the most-significant bit,
  // so the minterm index must be assembled in variable order:
  // x_0 x_1 x_2 x_3 x_4.

  const mapBit = mapIndex === 1 ? "1" : "0";

  if ((variables ?? rowGray.length + colGray.length) === 2) {
    // 2 vars: columns = x_0, rows = x_1
    return bitsToMintermIndex(colGray + rowGray);
  }

  if ((variables ?? rowGray.length + colGray.length) === 3) {
    // 3 vars: columns = x_0 x_1, rows = x_2
    return bitsToMintermIndex(colGray + rowGray);
  }

  if ((variables ?? rowGray.length + colGray.length) === 4) {
    // 4 vars: columns = x_0 x_1, rows = x_2 x_3
    return bitsToMintermIndex(colGray + rowGray);
  }

  // 5 vars: columns = x_0 x_1, rows = x_2 x_3, map = x_4
  return bitsToMintermIndex(colGray + rowGray + mapBit);
}

// Convert minterm index back to coordinates (reverse lookup)
// Useful for checking group membership
export function getCoordinates(minterm: number, vars: number) {
  const bin = minterm.toString(2).padStart(vars, "0");
  
  if (vars === 2) { // x_0 | x_1
    return { rowBin: bin[1], colBin: bin[0], map: 0 };
  }
  if (vars === 3) { // x_0 x_1 | x_2
    return { rowBin: bin[2], colBin: bin.slice(0, 2), map: 0 };
  }
  if (vars === 4) { // x_0 x_1 | x_2 x_3
    return { rowBin: bin.slice(2), colBin: bin.slice(0, 2), map: 0 };
  }
  if (vars === 5) { // x_0 x_1 | x_2 x_3 | x_4
    return { map: parseInt(bin[4], 10), rowBin: bin.slice(2, 4), colBin: bin.slice(0, 2) };
  }
  return { rowBin: "0", colBin: "0", map: 0 };
}

export function getVariableLabels(vars: number) {
  // UI convention (fixed):
  // - Columns (top): x_0, x_1
  // - Rows (left):   x_2, x_3
  // - Map selector (5 vars): x_4
  // For 2/3 variables we keep the convention as much as possible.

  if (vars === 2) return { rows: "x_1", cols: "x_0", map: "" };
  if (vars === 3) return { rows: "x_2", cols: "x_0, x_1", map: "" };
  if (vars === 4) return { rows: "x_2, x_3", cols: "x_0, x_1", map: "" };
  if (vars === 5) return { rows: "x_2, x_3", cols: "x_0, x_1", map: "x_4" };
  return { rows: "", cols: "", map: "" };
}

// Colors for grouping
export const GROUP_COLORS = [
  { border: "border-red-500", bg: "bg-red-500/20", text: "text-red-700" },
  { border: "border-blue-500", bg: "bg-blue-500/20", text: "text-blue-700" },
  { border: "border-green-500", bg: "bg-green-500/20", text: "text-green-700" },
  { border: "border-purple-500", bg: "bg-purple-500/20", text: "text-purple-700" },
  { border: "border-orange-500", bg: "bg-orange-500/20", text: "text-orange-700" },
  { border: "border-pink-500", bg: "bg-pink-500/20", text: "text-pink-700" },
  { border: "border-cyan-500", bg: "bg-cyan-500/20", text: "text-cyan-700" },
  { border: "border-yellow-500", bg: "bg-yellow-500/20", text: "text-yellow-700" },
];
