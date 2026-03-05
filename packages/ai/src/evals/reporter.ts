import type { EvalReport, EvalResult } from "./types";

export const createReport = (
  results: Array<EvalResult>,
  provider: string,
  model: string
): EvalReport => {
  const passed = results.filter((r) => r.pass).length;
  const byCategory = groupBy(results, (r) => r.id.split("-")[0] ?? "other");
  const byLanguage = groupBy(results, (r) => r.id.split("-")[1] ?? "other");

  return {
    provider,
    model,
    timestamp: new Date().toISOString(),
    total: results.length,
    passed,
    failed: results.length - passed,
    passRate: Math.round((passed / results.length) * 100),
    results,
    byCategory,
    byLanguage,
  };
};

const groupBy = (
  results: Array<EvalResult>,
  keyExtractor: (r: EvalResult) => string
): Record<string, { total: number; passed: number }> => {
  const groups: Record<string, { total: number; passed: number }> = {};
  for (const r of results) {
    const category = keyExtractor(r);
    if (!groups[category]) groups[category] = { total: 0, passed: 0 };
    groups[category].total++;
    if (r.pass) groups[category].passed++;
  }
  return groups;
};

export const formatReport = (report: EvalReport): string => {
  const lines: Array<string> = [
    `# Eval Report: ${report.provider} / ${report.model}`,
    `Date: ${report.timestamp}`,
    `Pass rate: ${report.passRate}% (${report.passed}/${report.total})`,
    "",
    "## Results",
  ];

  for (const r of report.results) {
    const status = r.pass ? "PASS" : "FAIL";
    lines.push(`- [${status}] ${r.id} (${r.durationMs}ms)`);
    if (!r.pass) {
      for (const e of r.errors) lines.push(`    ${e}`);
    }
  }

  lines.push("", "## By Category");
  for (const [cat, stats] of Object.entries(report.byCategory)) {
    lines.push(`- ${cat}: ${stats.passed}/${stats.total}`);
  }

  return lines.join("\n");
};
