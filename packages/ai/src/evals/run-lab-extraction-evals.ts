#!/usr/bin/env tsx
import { labExtractorAgent, runGenerateAgent } from "../agents";
import type { LabCheck } from "./lab-extraction-assertions";
import { scoreLabExtraction } from "./lab-extraction-assertions";
import {
  EXPECTED_METADATA,
  EXPECTED_ROWS,
  SYNTHETIC_LAB_REPORT,
} from "./lab-extraction-fixture";
import { loadEvalModel } from "./load-eval-model";

/**
 * A liveness floor, not a quality floor: it asks whether the extractor
 * returned a usable structured reading of the report. Owner: repo maintainer,
 * 2026-09-07. Benchmark: the synthetic fixture in this directory, whose rows
 * are chosen to discriminate (GOT/GPT, decimal commas, three printed range
 * shapes, one uncatalogued parameter). Raise it only against a measured run.
 */
const PASS_THRESHOLD = 0.7;

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
  process.exit(rate >= PASS_THRESHOLD ? 0 : 1);
};

runEvals().catch((e) => {
  console.error(e);
  process.exit(1);
});
