import type { MooreMachine } from "../../types/moore";

export function buildMooreForString(pattern: string): MooreMachine {
  // alfabeto = lettere presenti nel pattern (minimo). Se vuoi, puoi usare tutto a-z.
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

  // transizioni: per ora versione semplice “catena”:
  // q_i --pattern[i]--> q_{i+1}, altrimenti resta in q0
  // (Se vuoi “vera” macchina che riconosce anche con sovrapposizioni tipo KMP, la facciamo dopo)
  const transitions: MooreMachine["transitions"] = {};
  for (let i = 0; i <= n; i++) {
    const from = `q${i}`;
    transitions[from] = {};
    for (const a of alphabet) transitions[from][a] = "q0";
    if (i < n) transitions[from][pattern[i]] = `q${i + 1}`;
  }

  return { alphabet, states, start, accept, transitions, output };
}