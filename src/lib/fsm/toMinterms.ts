import type { FSMRow, FsmSolveFunction, FFType } from "../../types/fsm";
import { bitsToIndex, concatBits } from "./bitUtils";
import { computeExcitation } from "./excitation";


function pushTerm(
  fn: FsmSolveFunction,
  idx: number,
  value: 0 | 1 | "X"
) {
  if (value === 1) fn.minterms.push(idx);
  else if (value === "X") fn.dontCares.push(idx);
  // value 0 => niente (rimane implicito)
}

export function buildFunctionsFromRows(
  rows: FSMRow[],
  ff: FFType
): FsmSolveFunction[] {
  if (rows.length === 0) return [];

  const yBits = rows[0].y.length;
  const xBits = rows[0].x.length;
  const varsCount = yBits + xBits;

  // crea funzioni target
  const out: FsmSolveFunction[] = [];

  if (ff === "D") {
    for (let i = 0; i < yBits; i++) out.push({ name: `D${i}`, varsCount, minterms: [], dontCares: [] });
  } else if (ff === "T") {
    for (let i = 0; i < yBits; i++) out.push({ name: `T${i}`, varsCount, minterms: [], dontCares: [] });
  } else {
    for (let i = 0; i < yBits; i++) out.push({ name: `J${i}`, varsCount, minterms: [], dontCares: [] });
    for (let i = 0; i < yBits; i++) out.push({ name: `K${i}`, varsCount, minterms: [], dontCares: [] });
  }

  // z
  out.push({ name: "z", varsCount, minterms: [], dontCares: [] });

  // popola minterms/dc
  for (const r of rows) {
    if (r.y.length !== yBits || r.yNext.length !== yBits || r.x.length !== xBits) {
      throw new Error("Inconsistent bit-widths across rows");
    }

    const idx = bitsToIndex(concatBits(r.y, r.x));
    const ex = computeExcitation(ff, r.y, r.yNext);

    if (ff === "D" && ex.D) {
      for (let i = 0; i < yBits; i++) pushTerm(out.find(f => f.name === `D${i}`)!, idx, ex.D[i]);
    }
    if (ff === "T" && ex.T) {
      for (let i = 0; i < yBits; i++) pushTerm(out.find(f => f.name === `T${i}`)!, idx, ex.T[i]);
    }
    if (ff === "JK" && ex.J && ex.K) {
      for (let i = 0; i < yBits; i++) pushTerm(out.find(f => f.name === `J${i}`)!, idx, ex.J[i]);
      for (let i = 0; i < yBits; i++) pushTerm(out.find(f => f.name === `K${i}`)!, idx, ex.K[i]);
    }

    // z
    pushTerm(out.find(f => f.name === "z")!, idx, r.z);
  }

  // ordina e dedup
  for (const f of out) {
    f.minterms = Array.from(new Set(f.minterms)).sort((a,b)=>a-b);
    f.dontCares = Array.from(new Set(f.dontCares)).sort((a,b)=>a-b);
  }

  return out;
}
console.log("LOADED toMinterms.ts", { buildFunctionsFromRows });


