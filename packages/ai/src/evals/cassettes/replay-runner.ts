import type { Cassette } from "./cassette-schema";
import { replayCassette, unmeasured } from "./replay-cassette";
import type {
  CaseVerdict,
  ReplaySuite,
  UnmeasuredCause,
} from "./replay-cassette";

export const UNBLOCK_PATHS =
  "re-record locally, or retire the id in the manifest";

export type ReplayResult = {
  /** Keyless, so it may gate: non-zero whenever `faults` is not empty. */
  exitCode: 0 | 1;
  measured: number;
  faults: Array<string>;
  verdicts: Array<CaseVerdict>;
};

const verdictFor = async (
  suite: ReplaySuite,
  cassette: Cassette
): Promise<CaseVerdict> => {
  if (cassette.recorder === "synthetic") {
    return unmeasured(cassette, "synthetic", "synthetic, never measured");
  }
  const replayCase = suite.cases.find((c) => c.id === cassette.caseId);
  if (!replayCase) {
    return unmeasured(cassette, "orphan", `no case ${cassette.caseId}`);
  }
  if (cassette.requestedModelId !== suite.modelId) {
    const reason = `requested ${cassette.requestedModelId}, suite replays ${suite.modelId}`;
    return unmeasured(cassette, "model-mismatch", reason);
  }
  return replayCassette(suite, cassette, replayCase);
};

/** Every unmeasured cause except `synthetic` is a fault, with its message. */
const CAUSE_FAULTS: Record<Exclude<UnmeasuredCause, "synthetic">, string> = {
  stale: `stale cassettes: {ids} — ${UNBLOCK_PATHS}`,
  orphan: `cassettes without a case: {ids} — ${UNBLOCK_PATHS}`,
  "model-mismatch": `cassettes recorded for another model than the suite's: {ids} — ${UNBLOCK_PATHS}`,
  "not-consumed":
    "cassettes not consumed (expected exactly one model call): {ids}",
  "nothing-scored": "cassettes whose case no scorer measured: {ids}",
};

/**
 * An empty green is a fault, not a pass: zero measured cases, and any
 * cassette left unmeasured for a reason other than being synthetic, turn the
 * exit code non-zero with a fault naming the reason and the ids.
 */
const faultsOf = (verdicts: Array<CaseVerdict>, measured: number) => {
  const faults: Array<string> = [];
  for (const [cause, template] of Object.entries(CAUSE_FAULTS)) {
    const ids = verdicts
      .filter((v) => v.status === "unmeasured" && v.cause === cause)
      .map((v) => v.cassetteId);
    if (ids.length > 0) faults.push(template.replace("{ids}", ids.join(", ")));
  }
  if (measured === 0) {
    faults.push("zero measured cases: a replay that measured nothing fails");
  }
  for (const v of verdicts) {
    if (v.status === "failed") faults.push(...v.failures);
  }
  return faults;
};

/** Replays cassettes one at a time through the suite's real runtime path. */
export const replayCassettes = async (
  suite: ReplaySuite,
  cassettes: ReadonlyArray<Cassette>,
  loadFaults: ReadonlyArray<string> = []
): Promise<ReplayResult> => {
  const verdicts: Array<CaseVerdict> = [];
  for (const cassette of cassettes) {
    verdicts.push(await verdictFor(suite, cassette));
  }
  const measured = verdicts.filter((v) => v.status !== "unmeasured").length;
  const faults = [...loadFaults, ...faultsOf(verdicts, measured)];
  return { exitCode: faults.length === 0 ? 0 : 1, measured, faults, verdicts };
};
