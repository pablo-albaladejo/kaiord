#!/usr/bin/env tsx
import { createChatAgent } from "../index";
import { evaluateChatToolBenchmark } from "./chat-tool-assertions";
import { createHubChatToolFixtures } from "./chat-tool-fixtures";
import { loadAnthropicModel } from "./load-anthropic-model";
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
  const { model, provider, modelName } = await loadAnthropicModel();
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

  process.exit(report.passRate >= 90 ? 0 : 1);
};

runEvals().catch((e) => {
  console.error(e);
  process.exit(1);
});
