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
import { createChatAgent } from "../index";
import { evaluateChatToolBenchmark } from "./chat-tool-assertions";
import { createHubChatToolFixtures } from "./chat-tool-fixtures";
import { loadEvalModel } from "./load-eval-model";
import { createReport, formatReport } from "./reporter";
import benchmarks from "./chat-tool-benchmarks.json";
import type { ChatToolBenchmark, ChatToolEvalResult } from "./chat-tool-types";

const SYSTEM_PROMPT = [
  "You are Kaiord's in-app fitness assistant, running the Data Hub chat",
  "tools. Answer ONLY from tool results — call get_data_routes for",
  "questions about where data comes from or goes to. Call set_data_route",
  "to change routing when the user asks; it always requires the user's",
  "confirmation before it runs, so just propose the call.",
].join("\n");

const runEvals = async () => {
  const { model, provider, modelName } = await loadEvalModel();
  const agent = createChatAgent({
    model,
    tools: createHubChatToolFixtures(),
    system: SYSTEM_PROMPT,
  });

  console.log(
    `Running ${benchmarks.length} hub chat-tool benchmarks with ${provider}/${modelName}...\n`
  );

  const results: Array<ChatToolEvalResult> = [];
  for (const bench of benchmarks as Array<ChatToolBenchmark>) {
    const start = Date.now();
    try {
      const turn = await agent.sendTurn([
        { role: "user", content: bench.userText },
      ]);
      const result = evaluateChatToolBenchmark(bench, turn, Date.now() - start);
      results.push(result);
      console.log(
        `[${result.pass ? "PASS" : "FAIL"}] ${bench.id} (${result.durationMs}ms)`
      );
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

  const faults = results.filter((r) => r.harnessFault !== undefined);
  if (faults.length > 0) {
    console.error(`\nHARNESS FAULT in ${faults.length} case(s):`);
    for (const f of faults) console.error(`  ${f.id}: ${f.harnessFault}`);
    console.error("Not failing scores — the instrument did not run.");
    process.exit(2);
  }

  const report = createReport(results, provider, modelName);
  console.log("\n" + formatReport(report));

  const fs = await import("fs");
  const path = await import("path");
  const packageDir = path.join(import.meta.dirname, "..", "..");
  const outPath = path.join(
    packageDir,
    `chat-tool-eval-report-${Date.now()}.json`
  );
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to ${outPath}`);
};

runEvals().catch((e) => {
  console.error(e);
  process.exit(1);
});
