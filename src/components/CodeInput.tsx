import { useState } from "react";

type Props = {
  onConfirm: (code: string, model: "moore" | "mealy") => void;
  externalError?: string | null;
};

export default function CodeInput({ onConfirm, externalError }: Props) {
  const [code, setCode] = useState("");
  const [model, setModel] = useState<"moore" | "mealy">("moore");
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const validate = (value: string) => {
    if (value.trim().length === 0) return "Enter the word to recognize.";
    if (!/^[a-z]+$/.test(value)) return "Use lowercase letters only (a-z).";
    return null;
  };

  const handleSubmit = () => {
    const err = validate(code);
    if (err) return setError(err);
    setError(null);
    onConfirm(code, model);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="hero-panel p-5 md:p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="technical-badge mb-3">Recognizer Workflow</div>
            <h2 className="text-2xl font-display font-extrabold text-slate-900">
              Automa Riconoscitore
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Insert a target string, choose the automaton model, and generate the full academic workflow:
              graph, transition table, Karnaugh maps, simplifications and sequential circuit.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowInfo((value) => !value)}
            className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-800 transition-colors hover:bg-sky-50"
          >
            {showInfo ? "Hide info" : "What does it do?"}
          </button>
        </div>

        {showInfo && (
          <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
            This section builds a string recognizer automaton from the target word you enter.
            You can choose a Moore or Mealy machine, generate the state and transition table,
            derive the next-state and output functions, build the related Karnaugh maps, and
            visualize both the simplified logic and the complete sequential circuit.
            <div className="mt-2">
              The basic algorithm originates from Marco Marulli, and this project builds on a
              later development based on his work.
            </div>
            <div className="mt-2 font-semibold text-slate-900">Dev: Simone Remoli</div>
          </div>
        )}
      </div>

      <div className="section-shell">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="section-title">Configuration</div>
          <div className="mt-1 text-sm text-slate-600">Set the target word and the automaton model.</div>
        </div>
        <button
          type="button"
          className="technical-badge cursor-default border-emerald-200 bg-emerald-50 text-emerald-800"
        >
          Logic preserved
        </button>
      </div>
      <label className="mt-5 block text-sm font-semibold text-slate-900">Enter target string</label>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="mt-2 rounded-2xl border border-sky-100 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
        placeholder="es: abba"
      />
      <div className="mt-4 flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-900">Automaton type</label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setModel("moore")}
            className={[
              "rounded-2xl border px-4 py-3 text-sm font-semibold transition-all",
              model === "moore"
                ? "border-sky-500 bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_16px_30px_-20px_rgba(37,99,235,0.8)]"
                : "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50/60",
            ].join(" ")}
          >
            <span className="block text-base">Moore</span>
            <span className="mt-1 block text-xs font-medium opacity-80">Output associated with states</span>
          </button>
          <button
            type="button"
            onClick={() => setModel("mealy")}
            className={[
              "rounded-2xl border px-4 py-3 text-sm font-semibold transition-all",
              model === "mealy"
                ? "border-sky-500 bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_16px_30px_-20px_rgba(37,99,235,0.8)]"
                : "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50/60",
            ].join(" ")}
          >
            <span className="block text-base">Mealy</span>
            <span className="mt-1 block text-xs font-medium opacity-80">Output associated with transitions</span>
          </button>
        </div>
      </div>

      {(error || externalError) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? externalError}
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="mt-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-[0_18px_30px_-18px_rgba(37,99,235,0.8)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_34px_-18px_rgba(37,99,235,0.9)]"
      >
        Confirm
      </button>
      </div>
    </div>
  );
}
