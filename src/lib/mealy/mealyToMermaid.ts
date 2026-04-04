import type { MealyMachine } from "../../types/mealy";

function escLabel(s: string) {
  return s.replace(/"/g, '\\"');
}

export function mealyToMermaid(machine: MealyMachine): string {
  const stateLabels = machine.states
    .map((state) => `state "${escLabel(state)}" as ${state}`)
    .join("\n");

  const startLine = `[*] --> ${machine.start}`;
  const lines: string[] = [];

  for (const from of machine.states) {
    const trans = machine.transitions[from] || {};

    for (const symbol of machine.alphabet) {
      const edge = trans[symbol];
      if (!edge) continue;
      lines.push(`${from} --> ${edge.to} : ${symbol}/${edge.output}`);
    }
  }

  return `stateDiagram-v2
${stateLabels}

${startLine}
${lines.join("\n")}
`;
}
