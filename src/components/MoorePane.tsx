import { useEffect, useMemo, useRef } from "react";
import mermaid from "mermaid";
import type { MooreMachine } from "../types/moore";
import { mooreToMermaid } from "../lib/moore/mooreToMermaid";
import { mooreToBinaryTable } from "../lib/moore/mooreToBinaryTable";
import MooreKarnaughCircuitPane from "./MooreKarnaughCircuitPane"; // path giusto

function bitsToStr(bits: number[]) {
  return bits.join("");
}

export default function MoorePane({ machine }: { machine: MooreMachine }) {
  /* =======================
     MERMAID (grafico)
     ======================= */
  const ref = useRef<HTMLDivElement | null>(null);
  const diagram = useMemo(() => mooreToMermaid(machine), [machine]);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "default",
    });

    const el = ref.current;
    if (!el) return;

    const id = `moore_${Date.now()}`;
    mermaid
      .render(id, diagram)
      .then(({ svg }) => {
        el.innerHTML = svg;
      })
      .catch((e) => {
        el.innerHTML = `<pre style="color:red; white-space:pre-wrap;">${String(e)}</pre>`;
      });
  }, [diagram]);

  /* =======================
     Tabella binaria (multi-simbolo)
     ======================= */
  const table = useMemo(
    () =>
      mooreToBinaryTable(machine, {
        includeUnusedStates: true,
        // includeUnusedInputs: true, // se vuoi anche codici input non usati
      }),
    [machine]
  );

  // stringa leggibile per la codifica input
  const inputEncodingText = useMemo(() => {
    const entries = Object.entries(table.inputMap)
      .sort((a, b) => a[1] - b[1])
      .map(([sym, code]) => `${sym}=${code.toString(2).padStart(table.inputBits, "0")}`);
    return entries.join(" · ");
  }, [table.inputMap, table.inputBits]);

  return (
    <div className="card-base">
      <h4 className="fw-semibold mb-2">Automa di Moore</h4>

      <div className="text-muted mb-3">
        start: <b>{machine.start}</b> · accept: <b>{machine.accept}</b> · alphabet:{" "}
        <b>{machine.alphabet.join(", ")}</b>
        <br />
        Input bits: <b>{table.inputBits}</b> · Stato bits: <b>{table.bits}</b>
        <br />
        Input encoding: <code>{inputEncodingText}</code>
      </div>

      {/* =======================
          GRAFICO
          ======================= */}
      <h5 className="fw-semibold mb-2">Grafico (Mermaid)</h5>

      <div
        ref={ref}
        style={{
          overflowX: "auto",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 12,
          padding: 12,
          background: "white",
        }}
      />

      <details className="mt-3">
        <summary className="text-muted">Mostra sorgente Mermaid</summary>
        <pre style={{ fontSize: 12, overflowX: "auto" }}>{diagram}</pre>
      </details>

      <hr className="my-4" />

      {/* =======================
          TABELLA BINARIA
          ======================= */}
      <h5 className="fw-semibold mb-2">Tabella stati/transizioni (binario)</h5>

      <div className="table-responsive">
        <table className="table table-sm align-middle">
          <thead>
            {/* riga "INPUT / OUTPUT" */}
            <tr>
              <th
                colSpan={table.inputBits + table.bits}
                className="text-uppercase text-muted"
                style={{ fontSize: 11 }}
              >
                INPUT
              </th>
              <th style={{ width: 20 }} />
              <th
                colSpan={table.bits + 1}
                className="text-uppercase text-muted"
                style={{ fontSize: 11 }}
              >
                OUTPUT
              </th>
              <th style={{ width: 180 }} />
            </tr>

            {/* intestazioni colonne */}
            <tr>
              {/* input bits x_k..x_1 */}
              {Array.from({ length: table.inputBits }, (_, i) => (
                <th key={`x${i}`}>x{table.inputBits - i}</th>
              ))}

              {/* state bits y_n..y_1 */}
              {Array.from({ length: table.bits }, (_, i) => (
                <th key={`y${i}`}>y{table.bits - i}</th>
              ))}

              <th style={{ width: 20 }} />

              {/* next state bits y'_n..y'_1 */}
              {Array.from({ length: table.bits }, (_, i) => (
                <th key={`yn${i}`}>y{table.bits - i}&apos;</th>
              ))}

              <th>Z</th>
              <th className="text-muted" style={{ fontSize: 12 }}>
                note
              </th>
            </tr>
          </thead>

          <tbody>
            {table.rows.map((r, idx) => (
              <tr key={idx}>
                {/* x bits */}
                {r.xBits.map((b, i) => (
                  <td key={`xb${idx}_${i}`}>
                    <code>{b}</code>
                  </td>
                ))}

                {/* y bits */}
                {r.y.map((b, i) => (
                  <td key={`yb${idx}_${i}`}>
                    <code>{b}</code>
                  </td>
                ))}

                <td />

                {/* yNext bits */}
                {r.yNext.map((b, i) => (
                  <td key={`ynb${idx}_${i}`}>
                    <code>{b}</code>
                  </td>
                ))}

                <td>
                  <code>{r.z}</code>
                </td>

                <td className="text-muted" style={{ fontSize: 12 }}>
                  {r.note ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="mt-3">
        <summary className="text-muted">Mostra codifica stati</summary>
        <pre style={{ fontSize: 13, overflowX: "auto" }}>
          {machine.states
            .map((s) => `${s} = ${bitsToStr(table.stateMap[s] ?? [])}`)
            .join("\n")}
        </pre>
      </details>

      <details className="mt-3">
        <summary className="text-muted">Mostra JSON</summary>
        <pre style={{ fontSize: 13, overflowX: "auto" }}>
          {JSON.stringify(machine, null, 2)}
        </pre>
      </details>
      <hr className="my-4" />

<h5 className="fw-semibold mb-2">Semplificazione (Karnaugh) e circuito</h5>
<MooreKarnaughCircuitPane table={table} lang="it" />
    </div>
  );
}