import type { MealyMachine } from "../../types/mealy";

export function buildMealyForString(pattern: string): MealyMachine {
  if (pattern.length === 0) {
    throw new Error("The target string cannot be empty.");
  }

  const alphabet = Array.from(new Set(pattern.split(""))).sort();
  const n = pattern.length;
  const states = Array.from({ length: n }, (_, i) => `q${i}`);
  const start = "q0";

  const prefix = Array(n).fill(0);
  for (let i = 1, j = 0; i < n; i++) {
    while (j > 0 && pattern[i] !== pattern[j]) {
      j = prefix[j - 1];
    }
    if (pattern[i] === pattern[j]) j++;
    prefix[i] = j;
  }

  function fallbackLength(currentMatched: number, symbol: string): number {
    let matched = currentMatched;

    while (matched > 0 && pattern[matched] !== symbol) {
      matched = prefix[matched - 1];
    }

    if (pattern[matched] === symbol) {
      matched++;
    }

    return matched;
  }

  const transitions: MealyMachine["transitions"] = {};

  for (let i = 0; i < n; i++) {
    const from = `q${i}`;
    transitions[from] = {};

    for (const symbol of alphabet) {
      const matched = fallbackLength(i, symbol);
      const emitsMatch = matched === n;
      const nextMatched = emitsMatch ? prefix[n - 1] : matched;

      transitions[from][symbol] = {
        to: `q${nextMatched}`,
        output: emitsMatch ? 1 : 0,
      };
    }
  }

  return { alphabet, states, start, transitions };
}
