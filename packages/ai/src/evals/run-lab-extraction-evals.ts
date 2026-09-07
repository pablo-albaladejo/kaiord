#!/usr/bin/env tsx
/**
 * INERT IN THIS PROJECT. This runner obtains its model through
 * `loadEvalModel`, which throws without a provider API key, and this project
 * has none — so it cannot execute and never has.
 *
 * It is kept as the executable form of the fixture-to-assertion wiring: which
 * fixture feeds which scorer, in what shape. That contract would otherwise be
 * implicit, recoverable only by reading the tests backwards. What is checked
 * on every commit is the assertion logic and the fixtures' own invariants,
 * which need no credential.
 *
 * It carries no pass threshold. A comparison that cannot run is not a gate,
 * and one dressed as a gate is the failure this suite exists to remove. If a
 * key ever exists, the floor is a decision to take then, with a measurement
 * behind it.
 */
import { labExtractorAgent, runGenerateAgent } from "../agents";
import type { LabCheck } from "./lab-extraction-assertions";
import { scoreLabExtraction } from "./lab-extraction-assertions";
import {
  EXPECTED_METADATA,
  EXPECTED_ROWS,
  SYNTHETIC_LAB_REPORT,
} from "./lab-extraction-fixture";
import { loadEvalModel } from "./load-eval-model";

const byDimension = (checks: LabCheck[]): Map<string, LabCheck[]> => {
  const map = new Map<string, LabCheck[]>();
  for (const c of checks)
    map.set(c.dimension, [...(map.get(c.dimension) ?? []), c]);
  return map;
};

const report = (checks: LabCheck[]): void => {
  for (const [dimension, group] of byDimension(checks)) {
    const passed = group.filter((c) => c.pass).length;
    console.log(`\n${dimension}: ${passed}/${group.length}`);
    for (const c of group.filter((x) => !x.pass)) {
      console.log(`  [MISS] ${c.subject}${c.detail ? ` — ${c.detail}` : ""}`);
    }
  }
};

const runEvals = async () => {
  const { model, provider, modelName } = await loadEvalModel();
  console.log(`Extracting synthetic report with ${provider}/${modelName}...`);

  const data = new TextEncoder().encode(SYNTHETIC_LAB_REPORT);
  const { output } = await runGenerateAgent(
    labExtractorAgent,
    { files: [{ data, mediaType: "text/plain", filename: "report.txt" }] },
    { model }
  );

  const score = scoreLabExtraction(output, EXPECTED_ROWS, EXPECTED_METADATA);
  if (!score.ok) {
    console.error(`\nHARNESS FAULT: ${score.harnessFault}`);
    console.error("Not a failing score — the instrument did not run.");
    process.exit(2);
  }

  report(score.checks);
  const passed = score.checks.filter((c) => c.pass).length;
  const rate = passed / score.checks.length;
  console.log(
    `\n${passed}/${score.checks.length} checks (${Math.round(rate * 100)}%)`
  );
};

runEvals().catch((e) => {
  console.error(e);
  process.exit(1);
});
