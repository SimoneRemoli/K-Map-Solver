import type { MooreMachine } from "../../types/moore";

export function buildMooreForString(pattern: string): MooreMachine {
  if (pattern.length === 0) {
    throw new Error("The target string cannot be empty.");
  }

  // alfabeto = lettere presenti nel pattern (minimo).
  const alphabet = Array.from(new Set(pattern.split(""))).sort();

  // stati: q0..qN dove N = pattern.length
  const n = pattern.length;
  const states = Array.from({ length: n + 1 }, (_, i) => `q${i}`);
  const start = "q0";
  const accept = `q${n}`;

  // output Moore: 1 solo nello stato di accettazione
  const output: Record<string, 0 | 1> = {};
  for (const s of states) output[s] = 0;
  output[accept] = 1;

  // Funzione prefisso stile KMP:
  // prefix[i] = lunghezza del massimo prefisso proprio di pattern[0..i]
  // che e anche suffisso di pattern[0..i].
  const prefix = Array(n).fill(0);
  for (let i = 1, j = 0; i < n; i++) {
    while (j > 0 && pattern[i] !== pattern[j]) {
      j = prefix[j - 1];
    }
    if (pattern[i] === pattern[j]) j++;
    prefix[i] = j;
  }

  function nextMatchedLength(currentMatched: number, symbol: string): number {
    let matched = currentMatched;

    while (matched > 0 && (matched === n || pattern[matched] !== symbol)) {
      matched = prefix[matched - 1];
    }

    if (matched < n && pattern[matched] === symbol) {
      matched++;
    }

    return matched;
  }

  // Transizioni complete con fallback KMP, cosi il riconoscimento
  // continua anche su occorrenze sovrapposte.
  const transitions: MooreMachine["transitions"] = {};
  for (let i = 0; i <= n; i++) {
    const from = `q${i}`;
    transitions[from] = {};

    for (const a of alphabet) {
      const next = nextMatchedLength(i, a);
      transitions[from][a] = `q${next}`;
    }
  }

  return { alphabet, states, start, accept, transitions, output };
}
