import type { MooreMachine } from "../../types/moore";

export type MooreBinaryRow = {
  xBits: number[]; // es: [0,1] se k=2
  y: number[]; // bits stato corrente
  yNext: number[]; // bits stato successivo
  z: 0 | 1; // ACCETTA nell’istante in cui entri: z=1 se yNext è accettante
  note?: string;
};

export type MooreBinaryTable = {
  inputBits: number; // k
  bits: number; // bits stato
  inputMap: Record<string, number>; // simbolo -> codice (0..)
  stateMap: Record<string, number[]>; // stato -> bits
  rows: MooreBinaryRow[];
};

function ceilLog2(n: number) {
  if (n <= 1) return 0;
  return Math.ceil(Math.log2(n));
}

function numToBits(n: number, width: number): number[] {
  const out: number[] = [];
  for (let i = width - 1; i >= 0; i--) out.push((n >> i) & 1);
  return out;
}

function indexToBits(i: number, width: number): number[] {
  return numToBits(i, width);
}

function bitsToIndex(bits: number[]): number {
  return bits.reduce((acc, b) => (acc << 1) | b, 0);
}

export function mooreToBinaryTable(
  machine: MooreMachine,
  opts?: {
    inputMap?: Record<string, number>; // se vuoi imporre tu la codifica
    includeUnusedStates?: boolean; // aggiunge righe per stati extra (dc)
    includeUnusedInputs?: boolean; // aggiunge righe per codici input non usati (dc)
  }
): MooreBinaryTable {
  const alphabet = machine.alphabet ?? [];
  if (alphabet.length === 0) {
    throw new Error("Alfabeto vuoto: impossibile costruire la tabella binaria.");
  }

  // --- input bits (k) ---
  const inputBits = Math.max(1, ceilLog2(alphabet.length)); // almeno 1
  const maxInputs = 1 << inputBits;

  // --- input map ---
  const inputMap: Record<string, number> = opts?.inputMap
    ? { ...opts.inputMap }
    : Object.fromEntries(alphabet.map((s, i) => [s, i]));

  // validazione inputMap
  for (const s of alphabet) {
    if (inputMap[s] == null) throw new Error(`Manca la codifica per il simbolo '${s}'.`);
    if (inputMap[s] < 0 || inputMap[s] >= maxInputs) {
      throw new Error(
        `Codifica input fuori range per '${s}': ${inputMap[s]} (max=${maxInputs - 1}).`
      );
    }
  }

  // --- state bits ---
  const statesCount = machine.states.length;
  const bits = Math.max(1, ceilLog2(statesCount)); // almeno 1
  const maxStates = 1 << bits;

  // --- state map ---
  const stateMap: Record<string, number[]> = {};
  for (let i = 0; i < machine.states.length; i++) {
    stateMap[machine.states[i]] = indexToBits(i, bits);
  }

  // --- accept set (supporta string o array) ---
  // Semantica richiesta: z=1 se ENTRO in uno stato accettante (cioè se to è accettante)
  const acceptSet = new Set(
    Array.isArray(machine.accept) ? machine.accept : [machine.accept]
  );

  // --- build rows ---
  const rows: MooreBinaryRow[] = [];

  // per ogni stato reale e per ogni simbolo dell'alfabeto
  for (const from of machine.states) {
    for (const sym of alphabet) {
      const to = machine.transitions?.[from]?.[sym];
      if (!to) continue;

      const xCode = inputMap[sym];
      const xBits = numToBits(xCode, inputBits);

      rows.push({
        xBits,
        y: stateMap[from],
        yNext: stateMap[to],
        z: (acceptSet.has(to) ? 1 : 0) as 0 | 1,
        note: `${from} --${sym}--> ${to}`,
      });
    }
  }

  // --- include unused input codes (optional) ---
  if (opts?.includeUnusedInputs) {
    const usedCodes = new Set(alphabet.map((s) => inputMap[s]));
    for (const from of machine.states) {
      for (let code = 0; code < maxInputs; code++) {
        if (usedCodes.has(code)) continue;

        // input code non usato: lo segniamo come riga "don't care"
        // Coerente con la semantica "entro": qui rimango nello stesso stato (to=from)
        rows.push({
          xBits: numToBits(code, inputBits),
          y: stateMap[from],
          yNext: stateMap[from],
          z: (acceptSet.has(from) ? 1 : 0) as 0 | 1,
          note: `input code ${code} non usato (DC)`,
        });
      }
    }
  }

  // --- include unused states (optional) ---
  if (opts?.includeUnusedStates) {
    for (let si = machine.states.length; si < maxStates; si++) {
      const yBits = indexToBits(si, bits);
      for (let code = 0; code < maxInputs; code++) {
        rows.push({
          xBits: numToBits(code, inputBits),
          y: yBits,
          yNext: yBits,
          z: 0,
          note: "stato non usato (DC)",
        });
      }
    }
  }

  // ordina: prima per input, poi per stato
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