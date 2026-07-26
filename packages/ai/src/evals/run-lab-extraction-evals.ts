#!/usr/bin/env tsx
import { labExtractorAgent, runGenerateAgent } from "../agents";
import { loadEvalModel } from "./load-eval-model";
import { EXPECTED_KEYS, SYNTHETIC_LAB_REPORT } from "./lab-extraction-fixture";

const PASS_THRESHOLD = 0.7;

const runEvals = async () => {
  const { model, provider, modelName } = await loadEvalModel();
  console.log(`Extracting synthetic report with ${provider}/${modelName}...\n`);

  const data = new TextEncoder().encode(SYNTHETIC_LAB_REPORT);
  const { output } = await runGenerateAgent(
    labExtractorAgent,
    { files: [{ data, mediaType: "text/plain", filename: "report.txt" }] },
    { model }
  );

  const found = new Set(
    output.values
      .map((v) => v.parameterKey)
      .filter((k): k is string => typeof k === "string")
  );
  const hits = EXPECTED_KEYS.filter((k) => found.has(k));
  for (const key of EXPECTED_KEYS) {
    console.log(`[${found.has(key) ? "PASS" : "MISS"}] ${key}`);
  }

  const rate = hits.length / EXPECTED_KEYS.length;
  console.log(
    `\nRecovered ${hits.length}/${EXPECTED_KEYS.length} keys (${Math.round(rate * 100)}%)`
  );
  process.exit(rate >= PASS_THRESHOLD ? 0 : 1);
};

runEvals().catch((e) => {
  console.error(e);
  process.exit(1);
});
