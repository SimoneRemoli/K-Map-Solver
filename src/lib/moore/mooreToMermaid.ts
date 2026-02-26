import type { MooreMachine } from "../../types/moore";

function escLabel(s: string) {
  // evita problemi con virgolette
  return s.replace(/"/g, '\\"');
}

export function mooreToMermaid(m: MooreMachine): string {
  // stateDiagram-v2
  // Mostriamo lo stato come: q0/0, q1/0 ... qN/1
  const stateLabels = m.states
    .map((s) => `state "${escLabel(`${s}/${m.output[s]}`)}" as ${s}`)
    .join("\n");

  const startLine = `[*] --> ${m.start}`;

  // Transizioni: raggruppiamo le etichette che portano allo stesso target per pulizia
  const lines: string[] = [];

  for (const from of m.states) {
    const trans = m.transitions[from] || {};
    const byTo = new Map<string, string[]>();

    for (const a of m.alphabet) {
      const to = trans[a];
      if (!to) continue;
      if (!byTo.has(to)) byTo.set(to, []);
      byTo.get(to)!.push(a);
    }

    for (const [to, syms] of byTo.entries()) {
      lines.push(`${from} --> ${to} : ${syms.join(",")}`);
    }
  }

  // Accettazione: in Mermaid stateDiagram-v2 puoi fare:
  // state qN <<final>>
  const acceptLine = `state ${m.accept} <<final>>`;

  return `stateDiagram-v2
${stateLabels}

${startLine}
${lines.join("\n")}
${acceptLine}
`;
}