export type Bit = 0 | 1;
export type BitOrX = Bit | "X";

export type FFType = "D" | "T" | "JK";

export type RowKey = string; // es: "y=01 x=10"
export type Bits = Bit[];

export interface FSMRow {
  // stato corrente
  y: Bits;
  // ingresso
  x: Bits;

  // stato prossimo
  yNext: Bits;

  // uscita (solo 1 bit per ora)
  z: BitOrX; // permettiamo X (don't care)
}

export interface FsmSolveFunction {
  name: string;                 // es: "D0", "J1", "K0", "z"
  varsCount: number;            // #variabili della K-map = |y| + |x|
  minterms: number[];
  dontCares: number[];
}

export interface FsmSolveResult {
  functions: FsmSolveFunction[];
}