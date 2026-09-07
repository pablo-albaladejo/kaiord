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
import { createTextToWorkout } from "../index";
import { evaluateBenchmark } from "./assertions";
import { loadEvalModel } from "./load-eval-model";
import { createReport, formatReport } from "./reporter";
import benchmarks from "./benchmarks.json";
import type { Benchmark, EvalResult } from "./types";

const runEvals = async () => {
  const { model, provider, modelName } = await loadEvalModel();
  const textToWorkout = createTextToWorkout({ model });

  console.log(
    `Running ${benchmarks.length} benchmarks with ${provider}/${modelName}...\n`
  );

  const results: Array<EvalResult> = [];

  for (const bench of benchmarks as Array<Benchmark>) {
    const start = Date.now();
    try {
      const workout = await textToWorkout(bench.text, {
        sport: bench.expectedSport as never,
      });
      const result = evaluateBenchmark(bench, workout, Date.now() - start);
      results.push(result);
      const icon = result.pass ? "PASS" : "FAIL";
      console.log(`[${icon}] ${bench.id} (${Date.now() - start}ms)`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      results.push({
        id: bench.id,
        pass: false,
        errors: [`Exception: ${msg}`],
        failures: [{ dimension: "run", message: `Exception: ${msg}` }],
        durationMs: Date.now() - start,
      });
      console.log(`[FAIL] ${bench.id} - Exception: ${msg}`);
    }
  }

  const report = createReport(results, provider, modelName);
  console.log("\n" + formatReport(report));

  const fs = await import("fs");
  const path = await import("path");
  const packageDir = path.join(import.meta.dirname, "..", "..");
  const outPath = path.join(packageDir, `eval-report-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to ${outPath}`);
};

runEvals().catch((e) => {
  console.error(e);
  process.exit(1);
});
