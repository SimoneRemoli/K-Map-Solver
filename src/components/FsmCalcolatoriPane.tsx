import { useMemo, useState } from "react";
import type { FFType, FSMRow, FsmSolveFunction } from "../types/fsm";
import { parseBits, parseBitOrX } from "../lib/fsm/bitUtils";
import { buildFunctionsFromRows } from "../lib/fsm/toMinterms";

type Props = {
  onLoadIntoKMap: (fn: FsmSolveFunction) => void;
};

function parseRows(text: string, yBits: number, xBits: number): FSMRow[] {
  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith("#"));

  const rows: FSMRow[] = [];

  for (const line of lines) {
    // expected: "YY XX | YY Z"
    const parts = line.split("|").map(p => p.trim());
    if (parts.length !== 2) throw new Error(`Invalid row (missing '|'): ${line}`);

    const left = parts[0].split(/\s+/);
    const right = parts[1].split(/\s+/);

    if (left.length !== 2) throw new Error(`Invalid left side. Use: y x  (line: ${line})`);
    if (right.length !== 2) throw new Error(`Invalid right side. Use: y' z (line: ${line})`);

    const y = parseBits(left[0], yBits);
    const x = parseBits(left[1], xBits);
    const yNext = parseBits(right[0], yBits);
    const z = parseBitOrX(right[1]);

    rows.push({ y, x, yNext, z });
  }

  return rows;
}

export default function FsmCalcolatoriPane({ onLoadIntoKMap }: Props) {
  const [ff, setFf] = useState<FFType>("D");
  const [yBits, setYBits] = useState(2);
  const [xBits, setXBits] = useState(2);

  const [raw, setRaw] = useState(
`# formato: y x | y' z
# esempio (y=2, x=2)
00 00 | 00 0
00 01 | 00 0
00 10 | 00 0
00 11 | 01 0
01 00 | 10 0
01 01 | 00 0
01 10 | 00 0
01 11 | 01 0
10 00 | 00 0
10 01 | 11 0
10 10 | 00 0
10 11 | 01 0
11 00 | 00 0
11 01 | 00 0
11 10 | 00 1
11 11 | 01 0
`
  );

  const [error, setError] = useState<string | null>(null);

  const functions = useMemo(() => {
    try {
      setError(null);
      const rows = parseRows(raw, yBits, xBits);
      return buildFunctionsFromRows(rows, ff);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      return [];
    }
  }, [raw, yBits, xBits, ff]);

  return (
    <div className="card-base">
      <h4 className="fw-semibold mb-2">Computer Architecture Mode: FSM → FF excitations → K-Map</h4>
      <p className="text-muted mb-3">
        Paste the state/transition table in bits. Minterms and don’t cares for D/T/J/K and z are generated automatically.
      </p>

      <div className="d-flex gap-3 flex-wrap mb-3">
        <div>
          <label className="form-label">Flip-Flop</label>
          <select className="form-select" value={ff} onChange={(e) => setFf(e.target.value as FFType)}>
            <option value="D">D</option>
            <option value="T">T</option>
            <option value="JK">JK</option>
          </select>
        </div>

        <div>
          <label className="form-label">State bits (y)</label>
          <input
            className="form-control"
            type="number"
            min={1}
            max={5}
            value={yBits}
            onChange={(e) => setYBits(parseInt(e.target.value || "1", 10))}
          />
        </div>

        <div>
          <label className="form-label">Input bits (x)</label>
          <input
            className="form-control"
            type="number"
            min={1}
            max={5}
            value={xBits}
            onChange={(e) => setXBits(parseInt(e.target.value || "1", 10))}
          />
        </div>
      </div>

      <label className="form-label">Table (one row per combination)</label>
      <textarea
        className="form-control"
        style={{ minHeight: 220, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
      />

      {error && (
        <div className="alert alert-danger mt-3 mb-0">
          <b>Parsing error:</b> {error}
        </div>
      )}

      <hr className="my-4" />

      <h5 className="fw-semibold mb-2">Generated functions</h5>
      {functions.length === 0 ? (
        <p className="text-muted">No functions available (check the input).</p>
      ) : (
        <div className="d-flex flex-column gap-2">
          {functions.map((f) => (
            <div key={f.name} className="d-flex align-items-center justify-content-between gap-3 p-2 rounded border">
              <div>
                <div className="fw-semibold">{f.name}</div>
                <div className="text-muted" style={{ fontSize: 13 }}>
                  vars={f.varsCount} · 1s={f.minterms.join(", ") || "-"} · X={f.dontCares.join(", ") || "-"}
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => onLoadIntoKMap(f)}>
                Load into K-Map
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
