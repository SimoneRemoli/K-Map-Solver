import type { Bit, Bits, FFType } from "../../types/fsm";

export type ExcitationValue = Bit | "X";

export interface Excitation {
  // per bit di stato i-esimo:
  // D[i] oppure T[i] oppure J[i],K[i]
  D?: ExcitationValue[];
  T?: ExcitationValue[];
  J?: ExcitationValue[];
  K?: ExcitationValue[];
}

export function computeExcitation(ff: FFType, y: Bits, yNext: Bits): Excitation {
  if (y.length !== yNext.length) throw new Error("y and yNext length mismatch");

  if (ff === "D") {
    return { D: yNext.map(v => v as Bit) };
  }

  if (ff === "T") {
    // T = y XOR y'
    return {
      T: y.map((v, i) => ((v ^ yNext[i]) as Bit)),
    };
  }

  // JK
  const J: ExcitationValue[] = [];
  const K: ExcitationValue[] = [];
  for (let i = 0; i < y.length; i++) {
    const cur = y[i];
    const nxt = yNext[i];

    // excitation table:
    // 0->0 : J=0 K=X
    // 0->1 : J=1 K=X
    // 1->0 : J=X K=1
    // 1->1 : J=X K=0
    if (cur === 0 && nxt === 0) { J.push(0); K.push("X"); }
    else if (cur === 0 && nxt === 1) { J.push(1); K.push("X"); }
    else if (cur === 1 && nxt === 0) { J.push("X"); K.push(1); }
    else { J.push("X"); K.push(0); }
  }
  return { J, K };
}