import { useMemo, useState } from "react";
import type { MooreBinaryTable } from "../lib/moore/mooreToBinaryTable";
import { buildKmapSetsFromBinaryTable, type OutputKey } from "../lib/moore/mooreToKmapSets";
import { solveCustom } from "../lib/solver";
import { KmapGrid } from "./KmapGrid";
import { LogicCircuitDiagram } from "./LogicCircuitDiagram";

type Lang = "it" | "en";

export default function MooreKarnaughCircuitPane({
  table,
  lang = "it",
}: {
  table: MooreBinaryTable;
  lang?: Lang;
}) {
  const [out, setOut] = useState<OutputKey>("y1p");

  const sets = useMemo(() => buildKmapSetsFromBinaryTable(table, out), [table, out]);

  // qui puoi mettere anche un toggle SOP/POS se vuoi, ma per l’esame di calcolatori di solito SOP
  const isSop = true;

  const solved = useMemo(
    () => solveCustom(sets.variables, sets.minterms, sets.dontCares, isSop),
    [sets.variables, sets.minterms, sets.dontCares, isSop]
  );

  const title =
    out === "z" ? "Z" : out === "y1p" ? "y1'" : out === "y2p" ? "y2'" : "y3'";

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
          {lang === "it" ? "Uscita" : "Output"}
        </div>

        <select
          value={out}
          onChange={(e) => setOut(e.target.value as OutputKey)}
          className="h-10 px-3 rounded-lg border border-border bg-background/50"
        >
          <option value="y1p">y1'</option>
          <option value="y2p">y2'</option>
          <option value="y3p">y3'</option>
          <option value="z">Z</option>
        </select>

        <div className="ml-auto font-mono text-sm">
          {title} = <span className="font-semibold">{solved.expression}</span>
        </div>
      </div>

      <div className="flex justify-center overflow-x-auto">
        <KmapGrid
          variables={sets.variables}
          minterms={sets.minterms}
          dontCares={sets.dontCares}
          groups={solved.essentials}
          onCellToggle={() => {
            // NON editabile: deriva dalla tabella delle transizioni
          }}
        />
      </div>

      <LogicCircuitDiagram
        expression={solved.expression}
        variables={sets.variables}
        isSop={isSop}
        lang={lang}
      />
    </div>
  );
}