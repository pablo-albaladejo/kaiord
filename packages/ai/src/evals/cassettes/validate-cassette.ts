import type { z } from "zod";
import { cassetteSchema } from "./cassette-schema";
import type { Cassette } from "./cassette-schema";

/** The pinned official recording model (D1c), never `getDefaultModel`. */
export const OFFICIAL_CASSETTE_MODEL = "claude-sonnet-5";

const DATED_SNAPSHOT = new RegExp(`^${OFFICIAL_CASSETTE_MODEL}-\\d{8}$`);

export type CassetteValidation =
  { ok: true; cassette: Cassette } | { ok: false; errors: Array<string> };

const at = (path: ReadonlyArray<PropertyKey>): string =>
  path.length === 0 ? "the cassette root" : path.map(String).join(".");

const describeIssue = (issue: z.core.$ZodIssue): string =>
  issue.code === "unrecognized_keys"
    ? `unknown key(s) ${issue.keys.map((k) => `"${k}"`).join(", ")} at ${at(issue.path)}`
    : `${at(issue.path)}: ${issue.message}`;

/** The strict schema alone: what any cassette, in memory or on disk, obeys. */
export const validateCassette = (raw: unknown): CassetteValidation => {
  const parsed = cassetteSchema.safeParse(raw);
  return parsed.success
    ? { ok: true, cassette: parsed.data }
    : { ok: false, errors: parsed.error.issues.map(describeIssue) };
};

export const isOfficialServedModel = (servedModelId: string): boolean =>
  servedModelId === OFFICIAL_CASSETTE_MODEL ||
  DATED_SNAPSHOT.test(servedModelId);

const officialModelErrors = (cassette: Cassette): Array<string> => {
  if (cassette.recorder !== "claude-cli") {
    return [
      `${cassette.id}: recorder "${cassette.recorder}" is not allowed in the committed directory; synthetic fixtures live in fixtures/`,
    ];
  }
  const errors: Array<string> = [];
  if (cassette.requestedModelId !== OFFICIAL_CASSETTE_MODEL) {
    errors.push(
      `${cassette.id}: requested ${cassette.requestedModelId}, not recorded with ${OFFICIAL_CASSETTE_MODEL}`
    );
  }
  if (!isOfficialServedModel(cassette.servedModelId)) {
    errors.push(
      `${cassette.id}: served ${cassette.servedModelId}, not recorded with ${OFFICIAL_CASSETTE_MODEL}`
    );
  }
  return errors;
};

/**
 * A file in the committed cassette directory: the schema, a real recorder and
 * the official model rule. In-memory cassettes built by tests are never
 * checked here.
 */
export const validateCommittedCassette = (raw: unknown): CassetteValidation => {
  const result = validateCassette(raw);
  if (!result.ok) return result;
  const errors = officialModelErrors(result.cassette);
  return errors.length === 0 ? result : { ok: false, errors };
};
