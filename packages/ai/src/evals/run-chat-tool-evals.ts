#!/usr/bin/env tsx
/**
 * UNMEASURED BY CONSTRUCTION. The hub chat-tool cases need tool calling, and
 * the only live model access this project has (`claude -p` behind the live
 * loader) runs with every tool disabled, so it cannot carry them. This runner
 * does not import the live loader: it reports every case as unmeasured with
 * that reason and exits 0. It never reaches the `EVAL_LIVE` opt-in and never
 * fails. The scorer and the fixtures are still checked on every commit by
 * their unit tests, which need no model.
 */
import benchmarks from "./chat-tool-benchmarks.json";
import type { ChatToolBenchmark } from "./chat-tool-types";

const REASON =
  "tool calling: the claude -p live lane runs with every tool disabled";

for (const bench of benchmarks as Array<ChatToolBenchmark>) {
  console.log(`[UNMEASURED] ${bench.id} - ${REASON}`);
}
console.log(`\n0 measured, ${benchmarks.length} unmeasured.`);
process.exit(0);
