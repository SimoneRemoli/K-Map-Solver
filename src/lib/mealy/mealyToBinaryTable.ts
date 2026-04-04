import type { MooreBinaryRow, MooreBinaryTable } from "../moore/mooreToBinaryTable";
import type { MealyMachine } from "../../types/mealy";

function ceilLog2(n: number) {
  if (n <= 1) return 0;
  return Math.ceil(Math.log2(n));
}

function numToBits(n: number, width: number): number[] {
  const out: number[] = [];
  for (let i = width - 1; i >= 0; i--) out.push((n >> i) & 1);
  return out;
}

function bitsToIndex(bits: number[]): number {
  return bits.reduce((acc, b) => (acc << 1) | b, 0);
}

export function mealyToBinaryTable(
  machine: MealyMachine,
  opts?: {
    inputMap?: Record<string, number>;
    includeUnusedStates?: boolean;
    includeUnusedInputs?: boolean;
  }
): MooreBinaryTable {
  const alphabet = machine.alphabet ?? [];
  if (alphabet.length === 0) {
    throw new Error("Empty alphabet: cannot build the binary table.");
  }

  const inputBits = Math.max(1, ceilLog2(alphabet.length));
  const maxInputs = 1 << inputBits;

  const inputMap: Record<string, number> = opts?.inputMap
    ? { ...opts.inputMap }
    : Object.fromEntries(alphabet.map((symbol, i) => [symbol, i]));

  for (const symbol of alphabet) {
    if (inputMap[symbol] == null) {
      throw new Error(`Missing encoding for symbol '${symbol}'.`);
    }
    if (inputMap[symbol] < 0 || inputMap[symbol] >= maxInputs) {
      throw new Error(
        `Input encoding out of range for '${symbol}': ${inputMap[symbol]} (max=${maxInputs - 1}).`
      );
    }
  }

  const bits = Math.max(1, ceilLog2(machine.states.length));
  const maxStates = 1 << bits;

  const stateMap: Record<string, number[]> = {};
  for (let i = 0; i < machine.states.length; i++) {
    stateMap[machine.states[i]] = numToBits(i, bits);
  }

  const rows: MooreBinaryRow[] = [];

  for (const from of machine.states) {
    for (const symbol of alphabet) {
      const transition = machine.transitions?.[from]?.[symbol];
      if (!transition) continue;

      rows.push({
        symbol,
        from,
        to: transition.to,
        xBits: numToBits(inputMap[symbol], inputBits),
        y: stateMap[from],
        yNext: stateMap[transition.to],
        z: transition.output,
        note: `${from} --${symbol}/${transition.output}--> ${transition.to}`,
      });
    }
  }

  if (opts?.includeUnusedInputs) {
    const usedCodes = new Set(alphabet.map((symbol) => inputMap[symbol]));
    for (const from of machine.states) {
      for (let code = 0; code < maxInputs; code++) {
        if (usedCodes.has(code)) continue;

        rows.push({
          from,
          to: from,
          xBits: numToBits(code, inputBits),
          y: stateMap[from],
          yNext: stateMap[from],
          z: 0,
          note: `unused input code ${code} (DC)`,
        });
      }
    }
  }

  if (opts?.includeUnusedStates) {
    for (let si = machine.states.length; si < maxStates; si++) {
      const yBits = numToBits(si, bits);
      for (let code = 0; code < maxInputs; code++) {
        rows.push({
          xBits: numToBits(code, inputBits),
          y: yBits,
          yNext: yBits,
          z: 0,
          note: "unused state (DC)",
        });
      }
    }
  }

  rows.sort((a, b) => {
    const ax = bitsToIndex(a.xBits);
    const bx = bitsToIndex(b.xBits);
    if (ax !== bx) return ax - bx;
    return bitsToIndex(a.y) - bitsToIndex(b.y);
  });

  return {
    inputBits,
    bits,
    inputMap,
    stateMap,
    rows,
  };
}
