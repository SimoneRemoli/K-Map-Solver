export function formatVariableTokenToMathJax(tok: string): string {
  const m = tok.match(/^([a-zA-Z]+)_(\d+)(')?$/);
  if (!m) return tok;
  const prefix = m[1];
  const idx = m[2];
  const neg = !!m[3];
  const base = `${prefix}_{${idx}}`;
  return neg ? `\\overline{${base}}` : base;
}

export function formatExpressionForMathJax(expr: string): string {
  const s = (expr || "").trim();
  if (s === "" || s === "0" || s === "1") return s;

  const factors = Array.from(s.matchAll(/\(([^()]*)\)/g));
  if (factors.length > 0) {
    const texFactors = factors.map((f) => {
      const lits = f[1]
        .split("+")
        .map((v) => v.trim())
        .filter(Boolean)
        .map(formatVariableTokenToMathJax);
      return `\\left(${lits.join(" \\; + \\; ")}\\right)`;
    });
    return texFactors.join("\\,");
  }

  const terms = s.split(" + ");
  const texTerms = terms.map((term) => {
    const lits = term.match(/[a-zA-Z]+_\d+'?/g) || [];
    if (lits.length === 0) return term;
    return lits.map(formatVariableTokenToMathJax).join("\\, ");
  });

  return texTerms.join(" \\; + \\; ");
}
