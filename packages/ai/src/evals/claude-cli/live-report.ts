import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { serialize } from "./cassette-writer";

export const COST_LABEL = "API-equivalent cost (notional, not money spent)";

const count = z.number().int().nonnegative();

/**
 * The allowlist rule of a cassette applies to a report on disk: every level
 * is a `strictObject`, so no CLI field (a uuid, a session id, an email) can be
 * written by being passed through.
 */
export const liveReportSchema = z.strictObject({
  schemaVersion: z.literal(1),
  suite: z.string().min(1),
  provider: z.literal("anthropic"),
  modelId: z.string().min(1),
  cliVersion: z.string().min(1).nullable(),
  startedAt: z.iso.datetime(),
  repetitions: z.number().int().positive(),
  callsMade: count,
  calibrationInputTokens: count.nullable(),
  cost: z.strictObject({
    label: z.literal(COST_LABEL),
    apiEquivalentUsd: z.number().nonnegative(),
  }),
  stop: z
    .strictObject({
      kind: z.enum(["rate-limit", "harness-fault", "budget", "context-leak"]),
      reason: z.string(),
    })
    .nullable(),
  cases: z.array(
    z.strictObject({
      id: z.string().min(1),
      runs: count,
      passed: count,
      failed: count,
      unmeasured: count,
      reasons: z.array(z.string()),
    })
  ),
});

export type LiveReport = z.infer<typeof liveReportSchema>;

/** Validated before writing: a report that would not load is never written. */
export const writeLiveReport = (
  report: unknown,
  dir: string,
  now: () => number = Date.now
): string => {
  const parsed = liveReportSchema.parse(report);
  const path = join(dir, `eval-report-${now()}.json`);
  writeFileSync(path, serialize(parsed));
  return path;
};
