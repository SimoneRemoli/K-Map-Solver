export type GateType = "AND" | "OR" | "NOT";

export type Literal = {
  variable: string;
  position: number;
  negated: boolean;
};

export type Clause = {
  literals: Literal[];
};

export type CircuitDefinition = {
  mode: "SOP" | "POS";
  clauses: Clause[];
  constant: "0" | "1" | null;
};

function parseLiteral(token: string, variablePositions: Map<string, number>): Literal | null {
  const match = token.trim().match(/^([a-zA-Z]+_\d+)('?)/);
  if (!match) return null;
  const variable = match[1];
  const fallback = variable.match(/_(\d+)$/);
  const position = variablePositions.get(variable) ?? (fallback ? Number(fallback[1]) : 0);

  return {
    variable,
    position,
    negated: match[2] === "'",
  };
}

function parseSopExpression(expression: string, variablePositions: Map<string, number>): Clause[] {
  return expression
    .split(" + ")
    .map((term) => {
      const tokens = term.match(/[a-zA-Z]+_\d+'?/g) ?? [];
      const literals = tokens
        .map((token) => parseLiteral(token, variablePositions))
        .filter((item): item is Literal => item !== null);

      return { literals };
    })
    .filter((clause) => clause.literals.length > 0);
}

function parsePosExpression(expression: string, variablePositions: Map<string, number>): Clause[] {
  const factors = Array.from(expression.matchAll(/\(([^()]*)\)/g));

  return factors
    .map((factor) => {
      const raw = factor[1]
        .split("+")
        .map((v) => v.trim())
        .filter(Boolean);

      const literals = raw
        .map((token) => parseLiteral(token, variablePositions))
        .filter((item): item is Literal => item !== null);

      return { literals };
    })
    .filter((clause) => clause.literals.length > 0);
}

export function buildCircuitDefinition(
  expression: string,
  isSop: boolean,
  variableNames?: string[]
): CircuitDefinition {
  const normalized = expression.trim();
  const variablePositions = new Map<string, number>(
    (variableNames ?? []).map((name, index) => [name, index])
  );

  if (normalized === "0" || normalized === "1") {
    return {
      mode: isSop ? "SOP" : "POS",
      clauses: [],
      constant: normalized,
    };
  }

  const clauses = isSop
    ? parseSopExpression(normalized, variablePositions)
    : parsePosExpression(normalized, variablePositions);

  return {
    mode: isSop ? "SOP" : "POS",
    clauses,
    constant: null,
  };
}
