import { dimensionRatePercent, tallyByDimension } from "./dimension-outcomes";
import type {
  DimensionOutcome,
  DimensionTally,
  EvalReport,
  ReportableResult,
} from "./types";

const outcomesOf = (results: ReadonlyArray<unknown>): Array<DimensionOutcome> =>
  results.flatMap((r) => {
    const carried = (r as { outcomes?: Array<DimensionOutcome> }).outcomes;
    return Array.isArray(carried) ? carried : [];
  });

export const createReport = <R extends ReportableResult>(
  results: Array<R>,
  provider: string,
  model: string
): EvalReport<R> => {
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
    passRatePercent: (passed / results.length) * 100,
    results,
    byCategory,
    byLanguage,
    ...dimensionSection(results),
  };
};

const dimensionSection = (
  results: ReadonlyArray<unknown>
): { byDimension?: Record<string, DimensionTally> } => {
  const outcomes = outcomesOf(results);
  return outcomes.length === 0
    ? {}
    : { byDimension: tallyByDimension(outcomes) };
};

const groupBy = <R extends ReportableResult>(
  results: Array<R>,
  keyExtractor: (r: R) => string
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
    // Rounded here, on the display side only.
    `Pass rate: ${Math.round(report.passRatePercent)}% (${report.passed}/${report.total})`,
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

  if (report.byDimension) {
    lines.push("", "## By Dimension");
    for (const [dim, tally] of Object.entries(report.byDimension)) {
      lines.push(`- ${dim}: ${formatTally(tally)}`);
    }
  }

  return lines.join("\n");
};

const formatTally = (tally: DimensionTally): string => {
  const rate = dimensionRatePercent(tally);
  const head =
    rate === null
      ? "not measured"
      : `${tally.passed}/${tally.measured} measured (${Math.round(rate)}%)`;
  if (tally.unmeasured === 0) return head;
  return `${head}; ${tally.unmeasured} unmeasured — ${tally.reasons.join("; ")}`;
};
