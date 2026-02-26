export type MooreMachine = {
  alphabet: string[];           // es: ["a","b","c"]
  states: string[];             // es: ["q0","q1",...]
  start: string;                // "q0"
  accept: string;               // stato finale (match completo)
  transitions: Record<string, Record<string, string>>; // δ(q, a) = q'
  output: Record<string, 0 | 1>; // λ(q) = 0/1 (Moore output)
};