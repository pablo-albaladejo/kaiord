import { z } from "zod";

/**
 * Known gaps between a `claude -p` recording and the production call. A real
 * recording declares every one: the response is a real decision of the model
 * under a noisier regime, not a bit-exact replica of an app call.
 */
export const PARITY_WARNINGS = [
  "temperature-not-honoured",
  "hidden-system-overhead",
  "max-output-tokens-not-honoured",
] as const;

const sha256 = z.string().regex(/^[0-9a-f]{64}$/, "expected a SHA-256 hex");
const tokens = z.number().int().nonnegative();

/**
 * Every provenance and envelope level is allowlisted: `strictObject` rejects
 * any key it does not name, so CLI output such as `cwd`, `uuid`,
 * `session_id`, `rate_limit_info`, an email or a field a future CLI adds
 * cannot be committed by being passed through.
 *
 * The one exception is `response.structuredOutput`, which is the model's
 * answer, not CLI metadata: it is any JSON value here. It is not checked
 * against the agent's wire schema at load time, because an answer that does
 * not fit it is a real model failure that replay must report as a measured
 * failure, not hide as an unloadable file. On replay the runtime validates
 * it exactly as it validates a live answer.
 */
export const cassetteSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    id: z.string().min(1),
    caseId: z.string().min(1),
    recorder: z.enum(["claude-cli", "synthetic"]),
    cliVersion: z.string().min(1).nullable(),
    provider: z.literal("anthropic"),
    requestedModelId: z.string().min(1),
    servedModelId: z.string().min(1),
    recordedAt: z.iso.datetime(),
    prompt: z.strictObject({
      id: z.string().min(1),
      version: z.string().min(1),
      hash: sha256,
    }),
    toolsHash: sha256,
    fixtureHash: sha256,
    requestHash: sha256,
    sampling: z.strictObject({
      temperature: z.number().nullable(),
      maxOutputTokens: z.number().int().positive().nullable(),
    }),
    parityWarnings: z.array(z.enum(PARITY_WARNINGS)),
    response: z.strictObject({
      structuredOutput: z.json(),
      finishReason: z.enum(["stop", "length", "content-filter", "other"]),
      usage: z.strictObject({ inputTokens: tokens, outputTokens: tokens }),
    }),
  })
  .superRefine((cassette, ctx) => {
    if (cassette.recorder !== "claude-cli") return;
    if (cassette.cliVersion === null) {
      ctx.addIssue({
        code: "custom",
        message: "a real recording names its CLI version",
        path: ["cliVersion"],
      });
    }
    for (const warning of PARITY_WARNINGS) {
      if (cassette.parityWarnings.includes(warning)) continue;
      ctx.addIssue({
        code: "custom",
        message: `missing parity warning "${warning}"`,
        path: ["parityWarnings"],
      });
    }
  });

export type Cassette = z.infer<typeof cassetteSchema>;
