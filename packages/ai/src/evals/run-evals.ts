#!/usr/bin/env tsx
import { createTextToWorkout } from "../index";
import { evaluateBenchmark } from "./assertions";
import { loadAnthropicModel } from "./load-anthropic-model";
import { createReport, formatReport } from "./reporter";
import benchmarks from "./benchmarks.json";
import type { Benchmark, EvalResult } from "./types";

const runEvals = async () => {
  const { model, provider, modelName } = await loadAnthropicModel();
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

  process.exit(report.passRate >= 90 ? 0 : 1);
};

runEvals().catch((e) => {
  console.error(e);
  process.exit(1);
});
