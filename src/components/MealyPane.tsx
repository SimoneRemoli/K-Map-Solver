import { useEffect, useMemo, useRef } from "react";
import mermaid from "mermaid";
import type { MealyMachine } from "../types/mealy";
import { mealyToMermaid } from "../lib/mealy/mealyToMermaid";
import { mealyToBinaryTable } from "../lib/mealy/mealyToBinaryTable";
import MooreKarnaughCircuitPane from "./MooreKarnaughCircuitPane";
import BinaryTransitionTable from "./BinaryTransitionTable";

export default function MealyPane({
  machine,
  onClear,
}: {
  machine: MealyMachine;
  onClear: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const diagram = useMemo(() => mealyToMermaid(machine), [machine]);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "default",
    });

    const el = ref.current;
    if (!el) return;

    const id = `mealy_${Date.now()}`;
    mermaid
      .render(id, diagram)
      .then(({ svg }) => {
        el.innerHTML = svg;
      })
      .catch((e) => {
        el.innerHTML = `<pre style="color:red; white-space:pre-wrap;">${String(e)}</pre>`;
      });
  }, [diagram]);

  const table = useMemo(
    () =>
      mealyToBinaryTable(machine, {
        includeUnusedStates: true,
      }),
    [machine]
  );

  return (
    <div className="space-y-6">
      <div className="section-shell">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="section-title">Automaton Graph</div>
            <h5 className="mt-2 text-xl font-display font-bold text-slate-900">Mealy recognizer</h5>
            <p className="mt-1 text-sm text-slate-600">
              Transition-based recognizer with graph rendering, binary transitions and derived sequential logic.
            </p>
          </div>
          <div className="technical-badge">Mealy Model</div>
        </div>

        <div
          ref={ref}
          className="rounded-[1.25rem] border border-sky-100 bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
          style={{ overflowX: "auto" }}
        />
      </div>

      <div className="section-shell">
        <div className="mb-4">
          <div className="section-title">Transition Encoding</div>
          <h5 className="mt-2 text-lg font-display font-bold text-slate-900">State/transition table</h5>
        </div>
        <BinaryTransitionTable table={table} outputLabel="z" />
      </div>

      <div className="section-shell">
        <div className="mb-4">
          <div className="section-title">Simplification Pipeline</div>
          <h5 className="mt-2 text-lg font-display font-bold text-slate-900">Karnaugh simplification and circuit</h5>
        </div>
        <MooreKarnaughCircuitPane table={table} lang="it" />
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onClear}
          className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
