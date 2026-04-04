import type { MooreBinaryTable } from "../lib/moore/mooreToBinaryTable";

function bitLabel(prefix: string, total: number, index: number, prime = false) {
  const n = total - index;
  return prime ? `${prefix}${n}'` : `${prefix}${n}`;
}

function isDontCareRow(note?: string) {
  return (note ?? "").toLowerCase().includes("dc");
}

export default function BinaryTransitionTable({
  table,
  outputLabel = "z",
}: {
  table: MooreBinaryTable;
  outputLabel?: string;
}) {
  const inputCols = table.inputBits + table.bits;
  const outputCols = table.bits + 1;
  const hasNotes = table.rows.some((row) => row.note);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse">
          <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
            <tr className="border-b border-border/60">
              <th
                colSpan={inputCols}
                className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-[0.28em] text-muted-foreground bg-muted/25"
              >
                Input
              </th>
              <th className="w-6 border-x border-border/60 bg-background/60" />
              <th
                colSpan={outputCols}
                className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-[0.28em] text-muted-foreground bg-primary/5"
              >
                Output
              </th>
              {hasNotes && (
                <th
                  className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-[0.28em] text-muted-foreground bg-amber-500/10"
                >
                  Note
                </th>
              )}
            </tr>

            <tr className="border-b border-border/60">
              {Array.from({ length: table.inputBits }, (_, i) => (
                <th
                  key={`x-${i}`}
                  className="px-3 py-3 text-center text-xs font-bold tracking-[0.18em] text-foreground"
                >
                  {bitLabel("x", table.inputBits, i)}
                </th>
              ))}

              {Array.from({ length: table.bits }, (_, i) => (
                <th
                  key={`y-${i}`}
                  className="px-3 py-3 text-center text-xs font-bold tracking-[0.18em] text-foreground"
                >
                  {bitLabel("y", table.bits, i)}
                </th>
              ))}

              <th className="w-6 border-x border-border/60 bg-background/60" />

              {Array.from({ length: table.bits }, (_, i) => (
                <th
                  key={`yn-${i}`}
                  className="px-3 py-3 text-center text-xs font-bold tracking-[0.18em] text-foreground"
                >
                  {bitLabel("y", table.bits, i, true)}
                </th>
              ))}

              <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-foreground">
                {outputLabel}
              </th>

              {hasNotes && (
                <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-foreground">
                  DC
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {table.rows.map((row, idx) => {
              const dc = isDontCareRow(row.note);
              const activeOutput = row.z === 1 && !dc;

              return (
                <tr
                  key={`binary-row-${idx}`}
                  className={[
                    "border-b border-border/40 font-mono text-sm transition-colors",
                    activeOutput ? "bg-emerald-500/5" : idx % 2 === 0 ? "bg-background/40" : "bg-muted/10",
                    !dc ? "hover:bg-primary/5" : "",
                  ].join(" ")}
                >
                  {row.xBits.map((bit, i) => (
                    <td key={`xb-${idx}-${i}`} className="px-3 py-3 text-center align-middle">
                      <span className="inline-flex min-w-8 items-center justify-center rounded-md border border-border/60 bg-background/80 px-2 py-1">
                        {bit}
                      </span>
                    </td>
                  ))}

                  {row.y.map((bit, i) => (
                    <td key={`yb-${idx}-${i}`} className="px-3 py-3 text-center align-middle">
                      <span className="inline-flex min-w-8 items-center justify-center rounded-md border border-border/60 bg-background/80 px-2 py-1">
                        {bit}
                      </span>
                    </td>
                  ))}

                  <td className="w-6 border-x border-border/60 bg-background/60" />

                  {row.yNext.map((bit, i) => (
                    <td key={`ynb-${idx}-${i}`} className="px-3 py-3 text-center align-middle">
                      <span
                        className={[
                          "inline-flex min-w-8 items-center justify-center rounded-md border px-2 py-1 font-semibold",
                          dc
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
                            : "border-border/60 bg-background/80",
                        ].join(" ")}
                      >
                        {dc ? "X" : bit}
                      </span>
                    </td>
                  ))}

                  <td className="px-3 py-3 text-center align-middle">
                    <span
                      className={[
                        "inline-flex min-w-8 items-center justify-center rounded-md border px-2 py-1 font-semibold",
                        activeOutput
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                          : dc
                            ? "border-border/60 bg-muted/30 text-muted-foreground"
                            : "border-border/60 bg-background/80 text-foreground",
                      ].join(" ")}
                    >
                      {dc ? "X" : row.z}
                    </span>
                  </td>

                  {hasNotes && (
                    <td className="px-3 py-3 align-middle">
                      {row.note ? (
                        <span
                          className={[
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                            dc
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-800"
                              : "border-border/60 bg-background/80 text-muted-foreground",
                          ].join(" ")}
                        >
                          {dc ? `DC: ${row.note}` : row.note}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
