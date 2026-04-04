import { useEffect, useMemo } from "react";
import type { MooreBinaryTable } from "../lib/moore/mooreToBinaryTable";
import { formatExpressionForMathJax } from "../lib/mathFormatting";
import {
  buildKmapSetsFromBinaryTable,
  describeOutputKey,
  formatOutputKey,
  getKmapLabelsForBinaryTable,
  getOrderedVariableNamesForBinaryTable,
  getOutputKeysForTable,
} from "../lib/moore/mooreToKmapSets";
import { solveCustom } from "../lib/solver";
import { KmapGrid } from "./KmapGrid";
import { LogicCircuitDiagram } from "./LogicCircuitDiagram";
import SequentialMachineDiagram from "./SequentialMachineDiagram";

type Lang = "it" | "en";

function MathText({ tex }: { tex: string }) {
  useEffect(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise?.();
    }
  }, [tex]);

  return <span className="math-jax">{"\\(" + tex + "\\)"}</span>;
}

export default function MooreKarnaughCircuitPane({
  table,
  lang = "en",
}: {
  table: MooreBinaryTable;
  lang?: Lang;
}) {
  const isSop = true;
  const variableLabels = useMemo(() => getKmapLabelsForBinaryTable(table), [table]);
  const variableNames = useMemo(() => getOrderedVariableNamesForBinaryTable(table), [table]);
  const inputVariableNames = useMemo(
    () => Array.from({ length: table.inputBits }, (_, i) => `x_${table.inputBits - i}`),
    [table.inputBits]
  );
  const stateVariableNames = useMemo(
    () => Array.from({ length: table.bits }, (_, i) => `y_${table.bits - i}`),
    [table.bits]
  );
  const outputs = useMemo(() => {
      return getOutputKeysForTable(table).map((out) => {
      const sets = buildKmapSetsFromBinaryTable(table, out);
      const solved = solveCustom(sets.variables, sets.minterms, sets.dontCares, isSop, variableNames);

      return {
        out,
        title: formatOutputKey(out),
        description: describeOutputKey(out, table),
        sets,
        solved,
      };
    });
  }, [table, isSop, variableNames]);

  return (
    <div className="mt-6">
      <div className="mb-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">
          {lang === "it" ? "Karnaugh maps and simplifications" : "Karnaugh maps and simplifications"}
        </div>
        <div className="text-sm text-muted-foreground">
          {lang === "it"
            ? "For each output, the corresponding K-map is built using input and state variables, then the simplified Boolean function is computed."
            : "For each output, the corresponding K-map is built using input and state variables, then the simplified Boolean function is computed."}
        </div>
      </div>

      <div className="space-y-8">
        {outputs.map(({ out, title, description, sets, solved }) => (
          <div
            key={out.kind === "z" ? "z" : `y${out.bitIndexFromLSB + 1}p`}
            className="rounded-2xl border border-border/60 bg-card/70 shadow-lg overflow-hidden"
          >
            <div className="border-b border-border/60 bg-muted/25 px-3 py-3 sm:px-4 sm:py-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold">
                  {title}
                </div>
                <div className="text-sm text-muted-foreground">
                  {lang === "it" ? "Simplified expression" : "Simplified expression"}:
                </div>
                <div className="text-sm font-semibold text-foreground overflow-x-auto">
                  <MathText tex={`${title} = ${formatExpressionForMathJax(solved.expression)}`} />
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {lang === "it" ? "Represented function" : "Represented function"}: {description}
                {" · "}
                {lang === "it" ? "Minterms" : "Minterms"}: Σ({sets.minterms.join(", ") || "∅"})
              </div>
            </div>

            <div className="p-2.5 sm:p-4 md:p-5">
              <div className="mb-5 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
                <div className="flex min-w-fit justify-center">
                <KmapGrid
                  variables={sets.variables}
                  minterms={sets.minterms}
                  dontCares={sets.dontCares}
                  groups={solved.essentials}
                  variableLabels={variableLabels}
                  onCellToggle={() => {
                    // NON editabile: deriva dalla tabella delle transizioni
                  }}
                />
                </div>
              </div>

              <LogicCircuitDiagram
                expression={solved.expression}
                variables={sets.variables}
                isSop={isSop}
                lang={lang}
                variableNames={variableNames}
              />
            </div>
          </div>
        ))}
      </div>

      <SequentialMachineDiagram
        inputVariableNames={inputVariableNames}
        stateVariableNames={stateVariableNames}
        outputs={outputs.map(({ title, solved }) => ({ name: title, expression: solved.expression }))}
        lang={lang}
      />
    </div>
  );
}
