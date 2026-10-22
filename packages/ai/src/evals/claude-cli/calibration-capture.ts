import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { CALIBRATION_REQUEST } from "./calibration-call";
import { serialize } from "./cassette-writer";
import type { LiveSession } from "./live-session";
import { totalInputTokens } from "./stream-messages";

/** A key naming who or where, dropped whatever its value. */
const DENIED_KEY = /email|org|uuid|session|cwd|user|account|path|name|id$/i;
/**
 * The only strings kept: enum-shaped words such as `allowed_warning` or
 * `seven_day`. No digit, dot, hyphen or capital, so a uuid, an account or
 * entity key, a `user.name` handle or a `host.local` name never survives,
 * whatever key it sits under.
 */
const ENUM_WORD = /^[a-z][a-z_]{0,31}$/;
const CLI_VERSION = /^\d+\.\d+\.\d+$/;
const MODEL_ID = /^claude-[a-z0-9.-]+$/;
/**
 * The only keys kept, at every level: letters and underscores, no digit, so
 * a map keyed by ids (`3f2b8c1e`, `ref2`) is dropped with whatever it holds,
 * a number included. A number survives only under a word key.
 */
const FIELD_KEY = /^[A-Za-z][A-Za-z_]{0,39}$/;
const MAX_DEPTH = 3;

type Projected = { [key: string]: number | boolean | string | Projected };

/**
 * Numbers, booleans and enum words under word keys, nested to a fixed depth;
 * no arrays.
 */
export const project = (node: unknown, depth = 0): Projected => {
  const out: Projected = {};
  if (typeof node !== "object" || node === null || Array.isArray(node)) {
    return out;
  }
  for (const [key, value] of Object.entries(node)) {
    if (!FIELD_KEY.test(key) || DENIED_KEY.test(key)) continue;
    if (typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
    } else if (typeof value === "string" && ENUM_WORD.test(value)) {
      out[key] = value;
    } else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      depth < MAX_DEPTH
    ) {
      out[key] = project(value, depth + 1);
    }
  }
  return out;
};

const projectedSchema: z.ZodType<Projected> = z.lazy(() =>
  z.record(
    z.string().regex(FIELD_KEY),
    z.union([
      z.number(),
      z.boolean(),
      z.string().regex(ENUM_WORD),
      projectedSchema,
    ])
  )
);

export const calibrationCaptureSchema = z.strictObject({
  kind: z.literal("calibration-capture"),
  cliVersion: z.string().regex(CLI_VERSION),
  requestedModelId: z.string().regex(MODEL_ID),
  inputTokens: z.number().int().nonnegative(),
  rateLimitInfos: z.array(projectedSchema),
  modelUsage: z.record(
    z.string().regex(MODEL_ID),
    z.record(z.string().regex(FIELD_KEY), z.number())
  ),
});

export type CalibrationCapture = z.infer<typeof calibrationCaptureSchema>;

/**
 * The calibration step: one call, whatever the guard then decides, captured
 * so the maintainer can pin `SEVEN_DAY_FIELD` (3.4) and the served-model form
 * (3.5). The projection is an allowlist of shapes: numbers, booleans and
 * enum words. Free text, ids, handles and host names are dropped, and the
 * strict schema rejects any string of another shape that got through. It is
 * a narrowing, not a proof: the maintainer reviews the printed capture before
 * committing any of it as a fixture.
 */
export const captureCalibration = async (
  session: LiveSession,
  modelId: string
): Promise<CalibrationCapture> => {
  const run = await session.call({ modelId, ...CALIBRATION_REQUEST });
  return calibrationCaptureSchema.parse({
    kind: "calibration-capture",
    cliVersion: run.init.cliVersion,
    requestedModelId: modelId,
    inputTokens: totalInputTokens(run.result),
    rateLimitInfos: run.rateLimitInfos.map((info) => project(info)),
    modelUsage: run.result.modelUsage,
  });
};

export const writeCalibration = (
  capture: CalibrationCapture,
  dir: string,
  now: () => number = Date.now
): string => {
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `calibration-${now()}.json`);
  writeFileSync(path, serialize(calibrationCaptureSchema.parse(capture)));
  return path;
};
