import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { CALIBRATION_REQUEST } from "./calibration-call";
import { serialize } from "./cassette-writer";
import type { LiveSession } from "./live-session";
import { totalInputTokens } from "./stream-messages";

/** A key naming who or where, dropped whatever its value. */
const DENIED_KEY = /email|org|uuid|session|cwd|user|account|path|name|id$/i;
/** A string kept only when it is a short token: an enum, never free text. */
const TOKEN = /^[a-z0-9_.-]{1,40}$/i;
const MAX_DEPTH = 3;

type Projected = { [key: string]: number | boolean | string | Projected };

/** Numbers, booleans and token strings, nested to a fixed depth. */
export const project = (node: unknown, depth = 0): Projected => {
  const out: Projected = {};
  if (typeof node !== "object" || node === null || Array.isArray(node)) {
    return out;
  }
  for (const [key, value] of Object.entries(node)) {
    if (DENIED_KEY.test(key)) continue;
    if (typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
    } else if (typeof value === "string" && TOKEN.test(value)) {
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
    z.string().regex(/^[A-Za-z0-9_]+$/),
    z.union([z.number(), z.boolean(), z.string().regex(TOKEN), projectedSchema])
  )
);

export const calibrationCaptureSchema = z.strictObject({
  kind: z.literal("calibration-capture"),
  cliVersion: z.string().regex(TOKEN),
  requestedModelId: z.string().regex(TOKEN),
  inputTokens: z.number().int().nonnegative(),
  rateLimitInfos: z.array(projectedSchema),
  modelUsage: z.record(
    z.string().regex(TOKEN),
    z.record(z.string(), z.number())
  ),
});

export type CalibrationCapture = z.infer<typeof calibrationCaptureSchema>;

/**
 * The calibration step: one call, whatever the guard then decides, captured
 * so the maintainer can pin `SEVEN_DAY_FIELD` (3.4) and the served-model form
 * (3.5). No email, organization, uuid, session id or cwd survives the
 * projection, and the strict schema rejects anything that did.
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
