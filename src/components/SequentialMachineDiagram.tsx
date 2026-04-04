import { useEffect, useMemo, useState } from "react";
import {
  buildCircuitDefinition,
  type CircuitDefinition,
  type GateType,
  type Literal,
} from "../lib/logic-circuit";
import { formatVariableTokenToMathJax } from "../lib/mathFormatting";

type Lang = "it" | "en";

type OutputFunction = {
  name: string;
  expression: string;
};

type GateBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  type: GateType;
  inputYs: number[];
  outputY: number;
};

type ClauseNode = {
  literals: Literal[];
  gate: GateBox | null;
  centerY: number;
};

type OutputNode = {
  name: string;
  expression: string;
  definition: CircuitDefinition;
  top: number;
  height: number;
  clauseNodes: ClauseNode[];
  finalGate: GateBox | null;
  outputY: number;
};

type DffNode = {
  name: string;
  sourceName: string;
  laneX: number;
  centerY: number;
  y: number;
  width: number;
  height: number;
};

function MathText({ tex, className }: { tex: string; className?: string }) {
  useEffect(() => {
    window.MathJax?.typesetPromise?.();
  }, [tex]);

  return <span className={className}>{"\\(" + tex + "\\)"}</span>;
}

const STROKE = "hsl(var(--foreground))";
const WIRE = "hsl(var(--primary))";
const PANEL = "hsl(var(--background))";
const GATE_FILL = "hsl(var(--muted))";
const BUBBLE_R = 5;

function andPath(width: number, height: number): string {
  const r = height / 2;
  const body = width - r;
  return [
    "M 0 0",
    `L ${body} 0`,
    `A ${r} ${r} 0 0 1 ${body} ${height}`,
    `L 0 ${height}`,
    "Z",
  ].join(" ");
}

function orPath(width: number, height: number): string {
  const m = height / 2;
  const right = width;
  return [
    `M ${width * 0.08} 0`,
    `C ${width * 0.43} 0 ${width * 0.68} ${height * 0.16} ${right} ${m}`,
    `C ${width * 0.68} ${height * 0.84} ${width * 0.43} ${height} ${width * 0.08} ${height}`,
    `C ${width * 0.26} ${height * 0.74} ${width * 0.26} ${height * 0.26} ${width * 0.08} 0`,
    "Z",
  ].join(" ");
}

function buildGateBox(
  x: number,
  centerY: number,
  inputs: number,
  type: GateType,
  isMobile: boolean
): GateBox {
  const width = type === "OR" ? (isMobile ? 74 : 96) : (isMobile ? 62 : 84);
  const height = Math.max(isMobile ? 34 : 42, inputs * (isMobile ? 14 : 16));
  const y = centerY - height / 2;
  const inputCount = Math.max(inputs, 2);
  const inputYs = Array.from({ length: inputCount }, (_, idx) => {
    const step = height / (inputCount + 1);
    return y + step * (idx + 1);
  });

  return {
    x,
    y,
    width,
    height,
    type,
    inputYs,
    outputY: centerY,
  };
}

function inputXForGate(gate: GateBox): number {
  return gate.type === "OR" ? gate.x + gate.width * 0.12 : gate.x;
}

function gateOutputX(gate: GateBox): number {
  return gate.x + gate.width;
}

function GateShape({ gate }: { gate: GateBox }) {
  const path = gate.type === "AND" ? andPath(gate.width, gate.height) : orPath(gate.width, gate.height);

  return (
    <g transform={`translate(${gate.x}, ${gate.y})`}>
      <path
        d={path}
        fill={GATE_FILL}
        stroke={STROKE}
        strokeWidth={2}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <text
        x={gate.width * 0.48}
        y={gate.height * 0.56}
        textAnchor="middle"
        fontSize={Math.max(10, Math.round(gate.height * 0.22))}
        fill={STROKE}
        fontWeight="700"
      >
        {gate.type}
      </text>
    </g>
  );
}

function drawWire(points: Array<{ x: number; y: number }>, key: string) {
  return (
    <polyline
      key={key}
      points={points.map((point) => `${point.x},${point.y}`).join(" ")}
      fill="none"
      stroke={WIRE}
      strokeWidth={2}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

export default function SequentialMachineDiagram({
  inputVariableNames,
  stateVariableNames,
  outputs,
  lang = "it",
}: {
  inputVariableNames: string[];
  stateVariableNames: string[];
  outputs: OutputFunction[];
  lang?: Lang;
}) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 920 : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsMobile(window.innerWidth <= 920);
    onResize();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  const variableNames = useMemo(
    () => [...inputVariableNames, ...stateVariableNames],
    [inputVariableNames, stateVariableNames]
  );

  const definitionByOutput = useMemo(
    () =>
      outputs.map((output) => ({
        ...output,
        definition: buildCircuitDefinition(output.expression, true, variableNames),
      })),
    [outputs, variableNames]
  );

  const layout = useMemo(() => {
    const leftMargin = isMobile ? 34 : 48;
    const busGap = isMobile ? 38 : 50;
    const busLabelY = 12;
    const busStartY = isMobile ? 54 : 64;
    const clauseGateX = isMobile ? 236 : 300;
    const finalGateX = isMobile ? 372 : 468;
    const dffX = isMobile ? 500 : 660;
    const outputPadX = isMobile ? 78 : 110;
    const rowGap = isMobile ? 44 : 56;
    const outputPadding = isMobile ? 26 : 34;

    const buses = variableNames.map((name, index) => ({
      name,
      x: leftMargin + index * busGap,
    }));

    let cursorY = isMobile ? 98 : 118;
    const outputNodes: OutputNode[] = definitionByOutput.map((item) => {
      const clauseCount = Math.max(item.definition.clauses.length, 1);
      const rowHeight = outputPadding * 2 + Math.max(1, clauseCount - 1) * rowGap + (isMobile ? 22 : 28);
      const centerY = cursorY + rowHeight / 2;
      const clauseCenters = Array.from({ length: clauseCount }, (_, idx) => {
        if (clauseCount === 1) return centerY;
        const start = cursorY + outputPadding;
        return start + idx * rowGap;
      });

      const clauseNodes = (item.definition.clauses.length > 0 ? item.definition.clauses : [{ literals: [] }]).map((clause, idx) => {
        const gateType = item.definition.mode === "SOP" ? "AND" : "OR";
        const needsGate = clause.literals.length !== 1;
        return {
          literals: clause.literals,
          gate: needsGate ? buildGateBox(clauseGateX, clauseCenters[idx], Math.max(clause.literals.length, 2), gateType, isMobile) : null,
          centerY: clauseCenters[idx],
        };
      });

      const finalGateType = item.definition.mode === "SOP" ? "OR" : "AND";
      const finalGate = clauseNodes.length > 1
        ? buildGateBox(finalGateX, centerY, clauseNodes.length, finalGateType, isMobile)
        : null;

      const outputY = finalGate ? finalGate.outputY : clauseNodes[0]?.centerY ?? centerY;

      const node: OutputNode = {
        name: item.name,
        expression: item.expression,
        definition: item.definition,
        top: cursorY,
        height: rowHeight,
        clauseNodes,
        finalGate,
        outputY,
      };

      cursorY += rowHeight + (isMobile ? 34 : 42);
      return node;
    });

    const dffWidth = isMobile ? 58 : 70;
    const dffHeight = isMobile ? 66 : 80;
    const yOutputNodes = outputNodes.filter((node) => node.name.startsWith("y"));
    const feedbackLaneBaseX = dffX + dffWidth + (isMobile ? 38 : 52);
    const feedbackLaneGap = isMobile ? 18 : 24;
    const dffRows: DffNode[] = stateVariableNames.map((stateName, index) => {
      const source = yOutputNodes[index];
      const centerY = source?.outputY ?? ((isMobile ? 110 : 130) + index * 94);
      const laneX = feedbackLaneBaseX + index * feedbackLaneGap;
      return {
        name: stateName,
        sourceName: source?.name ?? `${stateName}'`,
        laneX,
        centerY,
        y: centerY - dffHeight / 2,
        width: dffWidth,
        height: dffHeight,
      };
    });

    const combinationalTop = (outputNodes[0]?.top ?? busStartY) - 24;
    const combinationalBottom = (outputNodes[outputNodes.length - 1]?.top ?? busStartY) + (outputNodes[outputNodes.length - 1]?.height ?? 120) + 24;
    const feedbackSpineX = feedbackLaneBaseX + Math.max(0, stateVariableNames.length - 1) * feedbackLaneGap;
    const width = feedbackSpineX + outputPadX + (isMobile ? 54 : 76);
    const height = combinationalBottom + (isMobile ? 110 : 126);

    return {
      buses,
      busLabelY,
      busStartY,
      outputNodes,
      clauseGateX,
      finalGateX,
      dffX,
      dffRows,
      dffWidth,
      dffHeight,
      feedbackSpineX,
      combinationalTop,
      combinationalBottom,
      width,
      height,
    };
  }, [definitionByOutput, isMobile, stateVariableNames, variableNames]);

  const busBottom = layout.height - (isMobile ? 28 : 36);

  return (
    <div className="mt-8 border rounded-2xl bg-background/70 p-4 overflow-x-auto">
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3">
        {lang === "it" ? "Macchina sequenziale completa" : "Complete sequential machine"}
      </p>

      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="block h-auto mx-auto"
        style={{ width: isMobile ? `${layout.width}px` : `${Math.round(layout.width * 0.9)}px` }}
      >
        <rect
          x={layout.clauseGateX - (isMobile ? 46 : 56)}
          y={layout.combinationalTop}
          width={layout.finalGateX - layout.clauseGateX + (isMobile ? 170 : 220)}
          height={layout.combinationalBottom - layout.combinationalTop}
          rx={18}
          fill="rgba(236,72,153,0.10)"
          stroke="rgba(236,72,153,0.45)"
          strokeWidth={2}
        />

        <text
          x={layout.clauseGateX - (isMobile ? 30 : 38)}
          y={layout.combinationalTop + 22}
          fill={STROKE}
          fontSize={isMobile ? 11 : 13}
          fontWeight="700"
          letterSpacing="0.12em"
        >
          {lang === "it" ? "RETE COMBINATORIA" : "COMBINATIONAL LOGIC"}
        </text>

        {layout.buses.map((bus, index) => (
          <g key={`bus-${bus.name}`}>
            <foreignObject
              x={bus.x - (isMobile ? 18 : 24)}
              y={layout.busLabelY}
              width={isMobile ? 40 : 56}
              height={28}
            >
              <div className="text-center text-sm font-semibold">
                <MathText tex={formatVariableTokenToMathJax(bus.name)} />
              </div>
            </foreignObject>
            <line
              x1={bus.x}
              y1={layout.busStartY + index * 2}
              x2={bus.x}
              y2={busBottom}
              stroke={WIRE}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
          </g>
        ))}

        {layout.outputNodes.map((node) => {
          const isStateOutput = node.name.startsWith("y");
          const dff = layout.dffRows.find((row) => row.sourceName === node.name);

          return (
            <g key={`node-${node.name}`}>
              <foreignObject
                x={layout.clauseGateX - (isMobile ? 36 : 44)}
                y={node.top - 6}
                width={170}
                height={26}
              >
                <div className="text-sm font-semibold">
                  <MathText tex={node.name === "z" ? "z" : node.name} />
                </div>
              </foreignObject>

              {node.clauseNodes.map((clauseNode, clauseIndex) => {
                const clauseInputX = clauseNode.gate ? inputXForGate(clauseNode.gate) : layout.finalGateX;
                const clauseWireEndX = clauseNode.gate ? clauseInputX : (node.finalGate ? inputXForGate(node.finalGate) : (isStateOutput && dff ? layout.dffX : layout.finalGateX + 120));
                const clauseOutputX = clauseNode.gate ? gateOutputX(clauseNode.gate) : layout.clauseGateX - (isMobile ? 8 : 12);
                const clauseOutputY = clauseNode.gate ? clauseNode.gate.outputY : clauseNode.centerY;

                return (
                  <g key={`clause-${node.name}-${clauseIndex}`}>
                    {clauseNode.gate && <GateShape gate={clauseNode.gate} />}

                    {clauseNode.literals.map((literal, literalIndex) => {
                      const bus = layout.buses.find((candidate) => candidate.name === literal.variable);
                      if (!bus) return null;

                      const targetY = clauseNode.gate
                        ? clauseNode.gate.inputYs[literalIndex]
                        : clauseOutputY;
                      const bubbleCx = clauseWireEndX - BUBBLE_R - 2;
                      const actualEndX = literal.negated ? bubbleCx - BUBBLE_R : clauseWireEndX;
                      const laneX = clauseWireEndX - (isMobile ? 18 : 24) - literalIndex * (isMobile ? 7 : 8);

                      return (
                        <g key={`lit-${node.name}-${clauseIndex}-${literal.variable}-${literalIndex}`}>
                          {drawWire(
                            [
                              { x: bus.x, y: targetY },
                              { x: laneX, y: targetY },
                              { x: actualEndX, y: targetY },
                            ],
                            `wire-${node.name}-${clauseIndex}-${literal.variable}-${literalIndex}`
                          )}

                          {literal.negated && (
                            <circle
                              cx={bubbleCx}
                              cy={targetY}
                              r={BUBBLE_R}
                              fill={PANEL}
                              stroke={STROKE}
                              strokeWidth={1.8}
                            />
                          )}
                        </g>
                      );
                    })}

                    {node.finalGate && (
                      drawWire(
                        [
                          { x: clauseOutputX, y: clauseOutputY },
                          { x: layout.finalGateX - (isMobile ? 12 : 16), y: clauseOutputY },
                          { x: layout.finalGateX - (isMobile ? 12 : 16), y: node.finalGate.inputYs[clauseIndex] ?? node.finalGate.outputY },
                          { x: inputXForGate(node.finalGate), y: node.finalGate.inputYs[clauseIndex] ?? node.finalGate.outputY },
                        ],
                        `final-join-${node.name}-${clauseIndex}`
                      )
                    )}
                  </g>
                );
              })}

              {node.finalGate && <GateShape gate={node.finalGate} />}

              {(() => {
                const sourceX = node.finalGate
                  ? gateOutputX(node.finalGate)
                  : node.clauseNodes[0]?.gate
                    ? gateOutputX(node.clauseNodes[0].gate!)
                    : layout.clauseGateX + (isMobile ? 16 : 22);
                const sourceY = node.outputY;

                if (isStateOutput && dff) {
                  return drawWire(
                    [
                      { x: sourceX, y: sourceY },
                      { x: layout.dffX, y: sourceY },
                    ],
                    `to-d-${node.name}`
                  );
                }

                return drawWire(
                  [
                    { x: sourceX, y: sourceY },
                    { x: layout.finalGateX + (isMobile ? 170 : 230), y: sourceY },
                  ],
                  `to-z-${node.name}`
                );
              })()}

              {!isStateOutput && (
                <foreignObject
                  x={layout.finalGateX + (isMobile ? 176 : 238)}
                  y={node.outputY - 14}
                  width={52}
                  height={28}
                >
                  <div className="text-sm font-semibold">
                    <MathText tex={"z"} />
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}

        {layout.dffRows.map((dff) => {
          const bus = layout.buses.find((candidate) => candidate.name === dff.name);
          const qOutX = layout.dffX + dff.width;
          const feedbackY = layout.combinationalBottom + 18 + layout.dffRows.findIndex((row) => row.name === dff.name) * (isMobile ? 14 : 18);
          const joinStub = isMobile ? 8 : 10;

          return (
            <g key={`dff-${dff.name}`}>
              <rect
                x={layout.dffX}
                y={dff.y}
                width={dff.width}
                height={dff.height}
                rx={8}
                fill={PANEL}
                stroke={STROKE}
                strokeWidth={2}
              />

              <text x={layout.dffX + 8} y={dff.y + 18} fontSize={12} fill={STROKE} fontWeight="700">
                D
              </text>
              <text x={layout.dffX + dff.width - 16} y={dff.y + 18} fontSize={12} fill={STROKE} fontWeight="700">
                Q
              </text>
              <path
                d={`M ${layout.dffX} ${dff.centerY + 8} L ${layout.dffX + 10} ${dff.centerY} L ${layout.dffX} ${dff.centerY - 8}`}
                fill="none"
                stroke={STROKE}
                strokeWidth={1.7}
                strokeLinejoin="round"
              />

              <foreignObject
                x={qOutX + 8}
                y={dff.centerY - 14}
                width={56}
                height={28}
              >
                <div className="text-sm font-semibold">
                  <MathText tex={formatVariableTokenToMathJax(dff.name)} />
                </div>
              </foreignObject>

              {drawWire(
                [
                  { x: qOutX, y: dff.centerY },
                  { x: dff.laneX, y: dff.centerY },
                ],
                `feedback-tap-${dff.name}`
              )}

              <circle
                cx={dff.laneX}
                cy={dff.centerY}
                r={isMobile ? 2.2 : 2.8}
                fill={WIRE}
              />

              <line
                x1={dff.laneX}
                y1={dff.centerY}
                x2={dff.laneX}
                y2={feedbackY}
                stroke={WIRE}
                strokeWidth={2.2}
                strokeLinecap="round"
              />

              {drawWire(
                [
                  { x: dff.laneX, y: feedbackY },
                  { x: bus?.x ?? qOutX, y: feedbackY },
                ],
                `feedback-return-${dff.name}`
              )}

              {bus && (
                <>
                  <line
                    x1={bus.x}
                    y1={feedbackY - joinStub}
                    x2={bus.x}
                    y2={feedbackY + joinStub}
                    stroke={WIRE}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                  />
                  <circle
                    cx={bus.x}
                    cy={feedbackY}
                    r={isMobile ? 2.2 : 2.8}
                    fill={WIRE}
                  />
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
