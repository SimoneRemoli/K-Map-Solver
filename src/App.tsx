import FsmCalcolatoriPane from "./components/FsmCalcolatoriPane";
import type { FsmSolveFunction } from "./types/fsm";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { KmapGrid } from "./components/KmapGrid";
import { ToggleGroup, ToggleGroupItem } from "./components/ui/toggle-group";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, HelpCircle } from "lucide-react";
import { solveCustom } from "./lib/solver";
import CodeInput from "./components/CodeInput";
import { HelpModal } from "./components/HelpModal";
import { LogicCircuitDiagram } from "./components/LogicCircuitDiagram";
import { TruthTablePane } from "./components/TruthTablePane";
import { formatExpressionForMathJax } from "./lib/mathFormatting";
import { buildMooreForString } from "./lib/moore/buildMooreForString";
import { buildMealyForString } from "./lib/mealy/buildMealyForString";
import { mooreToBinaryTable } from "./lib/moore/mooreToBinaryTable";
import { mealyToBinaryTable } from "./lib/mealy/mealyToBinaryTable";
import MoorePane from "./components/MoorePane";
import MealyPane from "./components/MealyPane";
import type { MooreMachine } from "./types/moore";
import type { MealyMachine } from "./types/mealy";


// --- Types for local solver ---
export type SolveInput = {
  variables: number;
  minterms: number[];
  dontCares: number[];
  isSop: boolean;
};

export type SolveOutput = {
  expression: string;
  essentials: number[][];
  meta: {
    isSop: boolean;
    variables: number;
    timestamp: string;
  };
};

export type SolveFn = (input: SolveInput) => Promise<Omit<SolveOutput, "meta">> | Omit<SolveOutput, "meta">;

type StringMachineView =
  | { kind: "moore"; machine: MooreMachine }
  | { kind: "mealy"; machine: MealyMachine };

// --- Localization ---
const translations = {
  en: {
    title: "Karnaugh Map Solver",
    solve: "Solve",
    clear: "Clear",
    export: "Export JSON",
    expression: "Simplified Expression",
    one: "1",
    zero: "0",
    dontCare: "Don't Care (-)",
    mapX4_0: "Map (x₄ = 0)",
    mapX4_1: "Map (x₄ = 1)",
    kmapTab: "Karnaugh Map",
    truthTab: "Truth Table",
    solving: "Solving...",
    solveFailed: "Solve failed",
  },
  it: {
    title: "Karnaugh Map Solver",
    solve: "Solve",
    clear: "Clear",
    export: "Export JSON",
    expression: "Simplified Expression",
    one: "1",
    zero: "0",
    dontCare: "Don't Care (-)",
    mapX4_0: "Map (x₄ = 0)",
    mapX4_1: "Map (x₄ = 1)",
    kmapTab: "Karnaugh Map",
    truthTab: "Truth Table",
    solving: "Solving...",
    solveFailed: "Solve failed",
  },
} as const;

// --- MathJax Wrapper ---
const MathComponent = ({ tex }: { tex: string }) => {
  useEffect(() => {
    // expects MathJax loaded globally (optional)
    if (window.MathJax) {
      window.MathJax.typesetPromise?.();
    }
  }, [tex]);

  return <span className="math-jax">{"\\(" + tex + "\\)"}</span>;
};

function buildMintermsFromGrid(grid: Record<number, string>) {
  const minterms: number[] = [];
  const dontCares: number[] = [];

  for (const [idxStr, val] of Object.entries(grid)) {
    const idx = Number(idxStr);
    if (val === "1") minterms.push(idx);
    else if (val === "-") dontCares.push(idx);
  }
  minterms.sort((a, b) => a - b);
  dontCares.sort((a, b) => a - b);

  return { minterms, dontCares };
}

function buildDecimalFormTex(
  variables: number,
  minterms: number[],
  dontCares: number[],
  isSop: boolean
): string {
  const total = Math.pow(2, variables);

  const fmtList = (xs: number[]) => xs.join(", ");

  const hasDC = dontCares.length > 0;

  if (isSop) {
    // SOP canonical decimal form: Σ_1(minterms) + Σ_d(dont cares)
    if (minterms.length === 0) return "0";
    if (minterms.length + dontCares.length === total) return "1";

    const base = `\\Sigma_{1}\\left(${fmtList(minterms)}\\right)`;
    const dc = hasDC ? ` + \\Sigma_{d}\\left(${fmtList(dontCares)}\\right)` : "";
    return base + dc;
  }

  // POS canonical decimal form: Π_0(maxterms) · Π_d(dont cares)
  // zeros are all indices not in minterms and not in dontCares
  const mtSet = new Set(minterms);
  const dcSet = new Set(dontCares);
  const zeros: number[] = [];
  for (let i = 0; i < total; i++) {
    if (!mtSet.has(i) && !dcSet.has(i)) zeros.push(i);
  }

  if (zeros.length === 0) return "1";
  if (zeros.length + dontCares.length === total) return "0";

  const base = `\\Pi_{0}\\left(${fmtList(zeros)}\\right)`;
  const dc = hasDC ? `\\,\\cdot\\,\\Pi_{d}\\left(${fmtList(dontCares)}\\right)` : "";
  return base + dc;
}

export default function KMapApp() 
{
  const [lang] = useState<"it" | "en">("en");

  const [numVars, setNumVars] = useState(4);
  const [isSop, setIsSop] = useState(true);
  const [grid, setGrid] = useState<Record<number, string>>({});
  const [result, setResult] = useState<SolveOutput | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [messageKey, setMessageKey] = useState<null | "solveFailed" | "modeChanged">(null);
  const [activePane, setActivePane] = useState<"kmap" | "truth" | "fsm" | "code" | "automaton">("kmap");
  const [stringMachineView, setStringMachineView] = useState<StringMachineView | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [examError, setExamError] = useState<string | null>(null);
  const isExamSection = activePane === "code" || activePane === "automaton";

  function handleConfirmCode(code: string, model: "moore" | "mealy") {
    const view: StringMachineView =
      model === "moore"
        ? { kind: "moore", machine: buildMooreForString(code) }
        : { kind: "mealy", machine: buildMealyForString(code) };

    const table =
      view.kind === "moore"
        ? mooreToBinaryTable(view.machine, { includeUnusedStates: true })
        : mealyToBinaryTable(view.machine, { includeUnusedStates: true });
    const totalVariables = table.inputBits + table.bits;

    if (totalVariables > 5) {
      setStringMachineView(null);
      setExamError(
        `This machine requires ${totalVariables} Karnaugh variables (input + state). The maximum supported size is 5. Enter a shorter string or use a smaller alphabet.`
      );
      setActivePane("code");
      return;
    }

    setExamError(null);
    setStringMachineView(view);
    setActivePane("automaton");
  }

  function handleClearAutomaton() {
    setStringMachineView(null);
    setExamError(null);
    setActivePane("code");
  }

  function loadFunctionIntoKMap(fn: FsmSolveFunction) 
  {
  // 1) imposta numero variabili (stato+ingresso)
  setNumVars(fn.varsCount);

  // 2) costruisci la grid nel formato che usa questo progetto: Record<number, string>
  //    con valori "0" | "1" | "-" (dont care)
  const size = 1 << fn.varsCount;
  const newGrid: Record<number, string> = {};

  for (let i = 0; i < size; i++) newGrid[i] = "0";
  for (const m of fn.minterms) if (m >= 0 && m < size) newGrid[m] = "1";
  for (const d of fn.dontCares) if (d >= 0 && d < size) newGrid[d] = "-";

  setGrid(newGrid);

  // 3) vai sulla K-map
  setActivePane("kmap");
  

  // 4) invalida eventuale risultato precedente
  setResult(null);
  setMessageKey(null);
}

  const t = translations[lang];
  const messageText = messageKey
    ? messageKey === "solveFailed"
      ? t.solveFailed
      : "Mode changed: the previous result is no longer valid. Press ‘Solve’ to recompute."
    : null;

  const solvedIsSop = result?.meta.isSop ?? isSop;
  const resultLabel = solvedIsSop
    ? "Minimal form in SOP"
    : "Minimal form in POS";
  const solveLocal: SolveFn = ({ variables, minterms, dontCares, isSop }) =>
    solveCustom(variables, minterms, dontCares, isSop);

  const gridSets = useMemo(() => buildMintermsFromGrid(grid), [grid]);
  const decimalTex = useMemo(
    () => buildDecimalFormTex(numVars, gridSets.minterms, gridSets.dontCares, solvedIsSop),
    [numVars, gridSets.minterms, gridSets.dontCares, solvedIsSop]
  );

  // toggle 0 -> 1 -> - -> 0
  const toggleCell = (idx: number) => {
    setGrid((prev) => {
      const current = prev[idx] || "0";
      const next = current === "0" ? "1" : current === "1" ? "-" : "0";
      return { ...prev, [idx]: next };
    });
  };

  const clearGrid = () => {
    setGrid({});
    setResult(null);
    setMessageKey(null);
  };

  const solve = async () => {
    setIsSolving(true);
    setMessageKey(null);

    try {
      const { minterms, dontCares } = buildMintermsFromGrid(grid);

      const out = await solveLocal({
        variables: numVars,
        minterms,
        dontCares,
        isSop,
      });

      setResult({
        ...out,
        meta: {
          isSop,
          variables: numVars,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (e) {
      setResult(null);
      setMessageKey("solveFailed");
      console.error(e);
    } finally {
      setIsSolving(false);
    }
  };

  return (
    <div className="app-shell min-h-screen bg-background relative overflow-hidden select-none">
      <div className="absolute inset-0 pointer-events-none blueprint-grid opacity-60" />
      <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-sky-200/30 to-transparent pointer-events-none" />

      <div className="relative z-10 p-4 md:p-8 flex flex-col items-center">
        <Card className="w-full max-w-6xl glass-panel overflow-hidden border border-sky-100/80">
          <div className="h-1.5 bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-400" />
          <CardContent className="p-5 md:p-8">
          {/* Header (mobile) */}
          <div className="hero-panel md:hidden mb-6 p-5">
            {/* Title row */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="technical-badge mb-2">Digital Logic Toolkit</div>
                <h1 className="text-2xl font-display font-extrabold tracking-tight text-foreground">
                  <span className="bg-gradient-to-r from-sky-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent drop-shadow-sm">
                  {t.title}
                  </span>
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  {isExamSection
                    ? "Recognizer automata, state encoding, Karnaugh maps and sequential circuits."
                    : "Interactive minimization for Karnaugh maps, truth tables and derived logic circuits."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setHelpOpen(true)}
                  className="rounded-full hover:bg-accent"
                  aria-label="Help"
                >
                  <HelpCircle className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Controls */}
            {!isExamSection && (
            <div className="mt-4 grid grid-cols-1 gap-4">
              <div className="flex flex-col items-start gap-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  Variables
                </span>
                <ToggleGroup
                  type="single"
                  value={numVars.toString()}
                  onValueChange={(v: string) => v && setNumVars(parseInt(v, 10))}
                  className="flex flex-wrap"
                >
                  {[2, 3, 4, 5].map((v) => (
                    <ToggleGroupItem key={v} value={v.toString()} className="w-10">
                      {v}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div className="flex flex-col items-start gap-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  Form
                </span>
                <ToggleGroup
                  type="single"
                  value={isSop ? "sop" : "pos"}
                  onValueChange={(v: string) => {
                    if (!v) return;
                    const nextIsSop = v === "sop";
                    if (result) {
                      setResult(null);
                      setMessageKey("modeChanged");
                    } else {
                      setMessageKey(null);
                    }
                    setIsSop(nextIsSop);
                  }}
                  className="flex"
                >
                  <ToggleGroupItem value="sop" className="px-3">
                    {lang === "it" ? "FND" : "SOP"}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="pos" className="px-3">
                    {lang === "it" ? "FNC" : "POS"}
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            )}
          </div>
          {/* Header (desktop) */}
          <div className="hero-panel hidden md:flex justify-between items-center mb-8 p-6">
            <div>
              <div className="technical-badge mb-3">Digital Logic Toolkit</div>
              <h1 className="text-4xl font-display font-extrabold tracking-tight text-foreground">
              <span className="bg-gradient-to-r from-sky-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent drop-shadow-sm">
                {t.title}
              </span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                {isExamSection
                  ? "Build recognizer automata, inspect binary state transitions, simplify each output with Karnaugh maps, and visualize the full sequential machine."
                  : "Design, simplify and inspect Boolean functions through Karnaugh maps, truth tables and equivalent logic circuits."}
              </p>
            </div>

            {!isExamSection ? (
            <div className="flex items-end gap-4">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold opacity-0 select-none">
                  Language
                </span>
                <div className="flex h-10 items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setHelpOpen(true)}
                    className="rounded-full hover:bg-accent"
                    aria-label="Help"
                  >
                    <HelpCircle className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  Variables
                </span>
                <ToggleGroup
                  type="single"
                  value={numVars.toString()}
                  onValueChange={(v: string) => v && setNumVars(parseInt(v, 10))}
                  className="h-10"
                >
                  {[2, 3, 4, 5].map((v) => (
                    <ToggleGroupItem key={v} value={v.toString()} className="w-10">
                      {v}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  Form
                </span>
                <ToggleGroup
                  type="single"
                  value={isSop ? "sop" : "pos"}
                  onValueChange={(v: string) => {
                    if (!v) return;
                    const nextIsSop = v === "sop";
                    // If a result is currently shown, invalidate it to avoid mismatched labeling.
                    if (result) {
                      setResult(null);
                      setMessageKey("modeChanged");
                    } else {
                      setMessageKey(null);
                    }
                    setIsSop(nextIsSop);
                  }}
                  className="h-10"
                >
                  <ToggleGroupItem value="sop" className="px-3">
                    {lang === "it" ? "FND" : "SOP"}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="pos" className="px-3">
                    {lang === "it" ? "FNC" : "POS"}
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            ) : (
            <div className="flex h-10 items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHelpOpen(true)}
                className="rounded-full hover:bg-accent"
                aria-label="Help"
              >
                <HelpCircle className="w-5 h-5" />
              </Button>
            </div>
            )}
          </div>

          {/* Work Area */}
<div className="flex flex-col items-center justify-center min-h-[400px] mb-8">
  <div className="w-full max-w-5xl">
    <div className="mx-auto mb-8 w-full max-w-3xl">
      <div className="relative grid grid-cols-3 rounded-[1.35rem] border border-sky-100 bg-white/75 p-1.5 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className={[
            "absolute top-1.5 bottom-1.5 rounded-xl",
            "bg-gradient-to-r from-sky-500 to-blue-600 shadow-[0_10px_24px_-12px_rgba(37,99,235,0.6)]",
            "w-[calc(33.333%_-_0.5rem)]",
            activePane === "kmap"
              ? "left-1.5"
              : activePane === "truth"
                ? "left-[calc(33.333%_+_0.25rem)]"
                : "left-[calc(66.666%_+_0.25rem)]",
          ].join(" ")}
        />

        <button
          type="button"
          onClick={() => setActivePane("kmap")}
          className={[
            "relative z-10 h-10 rounded-xl text-sm font-semibold transition-colors",
            activePane === "kmap"
              ? "text-primary-foreground"
              : "text-slate-500 hover:text-slate-900",
          ].join(" ")}
        >
          {t.kmapTab}
        </button>

        <button
          type="button"
          onClick={() => setActivePane("truth")}
          className={[
            "relative z-10 h-10 rounded-xl text-sm font-semibold transition-colors",
            activePane === "truth"
              ? "text-primary-foreground"
              : "text-slate-500 hover:text-slate-900",
          ].join(" ")}
        >
          {t.truthTab}
        </button>

        <button
          type="button"
          onClick={() => setActivePane("code")}
          className={[
            "relative z-10 h-10 rounded-xl text-sm font-semibold transition-colors",
            activePane === "code"
              ? "text-primary-foreground"
              : "text-slate-500 hover:text-slate-900",
          ].join(" ")}
        >
          Automa Riconoscitore
        </button>
      </div>
    </div>

    <AnimatePresence mode="wait">
      {activePane === "kmap" && (
        <motion.div
          key="kmap-pane"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="w-full overflow-x-auto"
        >
          <div className="min-w-max flex justify-center">
            <KmapGrid
              variables={numVars}
              minterms={gridSets.minterms}
              dontCares={gridSets.dontCares}
              groups={result?.essentials}
              onCellToggle={(index) => toggleCell(index)}
            />
          </div>
        </motion.div>
      )}

      {activePane === "truth" && (
        <motion.div
          key="truth-pane"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="flex justify-center"
        >
          <TruthTablePane
            variables={numVars}
            minterms={gridSets.minterms}
            dontCares={gridSets.dontCares}
            onToggle={(index) => toggleCell(index)}
            lang={lang}
          />
        </motion.div>
      )}

      {activePane === "code" && (
  <motion.div
    key="code-pane"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.18 }}
    className="w-full"
  >
    <CodeInput onConfirm={handleConfirmCode} externalError={examError} />
  </motion.div>
)}
    {activePane === "automaton" && stringMachineView && (
  <motion.div
    key={`${stringMachineView.kind}-pane`}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.18 }}
    className="w-full"
  >
    {stringMachineView.kind === "moore" ? (
      <MoorePane machine={stringMachineView.machine} onClear={handleClearAutomaton} />
    ) : (
      <MealyPane machine={stringMachineView.machine} onClear={handleClearAutomaton} />
    )}
  </motion.div>
)}
    </AnimatePresence>
  </div>
</div>

          {!isExamSection && (
          <div className="technical-note mb-6 flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-sky-400/30" /> {t.one}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-slate-200" /> {t.zero}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-cyan-300/40" /> {t.dontCare}
            </div>
          </div>
          )}

          {/* Action Area */}
          {!isExamSection && (
            <div className="flex flex-col items-center gap-6 border-t pt-8">
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  size="lg"
                  onClick={solve}
                  disabled={isSolving}
                  className="min-w-[140px] rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 font-bold shadow-md transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
                >
                  {isSolving ? t.solving : t.solve}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={clearGrid}
                  className="min-w-[140px] rounded-xl transition-all duration-200 hover:bg-muted/60 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t.clear}
                </Button>
              </div>

              {messageText && (
                <div className="text-sm text-red-400">{messageText}</div>
              )}

              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="section-shell w-full overflow-x-auto"
                  >
                    <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                      Decimal form (Σ/Π)
                    </p>
                    <div className="text-sm md:text-lg font-mono text-foreground flex items-start justify-start gap-3 mb-4 min-w-max">
                      <MathComponent tex={`f(\\mathbf{x}) = ${decimalTex}`} />
                    </div>

                    <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                      {resultLabel}
                    </p>
                    <div className="text-sm md:text-lg font-mono text-foreground flex items-start justify-start gap-3 min-w-max">
                      <MathComponent
                        tex={`f(\\mathbf{x}) = ${formatExpressionForMathJax(result.expression)}`}
                      />
                    </div>

                    <LogicCircuitDiagram
                      expression={result.expression}
                      variables={result.meta.variables}
                      isSop={result.meta.isSop}
                      lang={lang}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
        </Card>
      </div>
      <HelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        lang={lang}
      />

      <footer className="relative z-10 w-full mt-8 px-4 md:px-8 pb-6">
        <div className="max-w-6xl mx-auto rounded-[1.35rem] border border-sky-100/80 bg-white/70 px-5 py-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-muted-foreground">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-medium text-foreground/80">K-Map Solver</span>
              <span className="opacity-60">•</span>
              <span>
                © {new Date().getFullYear()} All rights reserved
              </span>
              <span className="opacity-60">•</span>
              <a
                href="https://github.com/SimoneRemoli"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 hover:text-foreground transition-colors"
              >
                SimoneRemoli on GitHub
              </a>
              <span className="opacity-60">•</span>
              <a
                href="https://inginformatica.uniroma2.it/"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 hover:text-foreground transition-colors"
              >
                Tor Vergata University, Faculty of Engineering
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
