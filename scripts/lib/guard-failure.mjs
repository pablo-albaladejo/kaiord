// The failing tail every guard shares: a one-line summary with the count,
// the first SHOWN problems, how many were left out, and an optional hint.

export const SHOWN = 3;

export function failureReport(summary, problems, remediation) {
  const hidden = problems.length - SHOWN;
  return [
    `❌ ${problems.length} ${summary}:`,
    ...problems.slice(0, SHOWN).map((problem) => `  ${problem}`),
    ...(hidden > 0 ? [`  …and ${hidden} more`] : []),
    ...(remediation ? [`  ${remediation}`] : []),
  ].join("\n");
}

/** Prints the report to stderr and exits 1; returns when there is nothing to report. */
export function failIfAny(summary, problems, remediation) {
  if (problems.length === 0) return;
  console.error(failureReport(summary, problems, remediation));
  process.exit(1);
}
