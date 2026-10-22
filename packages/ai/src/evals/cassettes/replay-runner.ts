import type { Cassette } from "./cassette-schema";
import { replayCassette } from "./replay-cassette";
import type { CaseVerdict, ReplaySuite } from "./replay-cassette";

export const UNBLOCK_PATHS =
  "re-record locally, or retire the id in the manifest";

export type ReplayResult = {
  /** Keyless, so it may gate: non-zero whenever `faults` is not empty. */
  exitCode: 0 | 1;
  measured: number;
  faults: Array<string>;
  verdicts: Array<CaseVerdict>;
};

const unmeasured = (cassette: Cassette, reason: string): CaseVerdict => ({
  cassetteId: cassette.id,
  caseId: cassette.caseId,
  status: "unmeasured",
  reason,
});

const verdictFor = async (
  suite: ReplaySuite,
  cassette: Cassette
): Promise<CaseVerdict> => {
  if (cassette.recorder === "synthetic") {
    return unmeasured(cassette, "synthetic cassette, never measured");
  }
  const replayCase = suite.cases.find((c) => c.id === cassette.caseId);
  if (!replayCase) {
    return unmeasured(cassette, `no case ${cassette.caseId} in the suite`);
  }
  return replayCassette(suite, cassette, replayCase);
};

const idsWhere = (
  verdicts: Array<CaseVerdict>,
  predicate: (v: CaseVerdict) => boolean
): Array<string> => verdicts.filter(predicate).map((v) => v.cassetteId);

/**
 * An empty green is a fault, not a pass: zero measured cases, any stale
 * cassette and any orphaned cassette each turn the exit code non-zero with a
 * fault naming the reason and the ids.
 */
const faultsOf = (verdicts: Array<CaseVerdict>, measured: number) => {
  const faults: Array<string> = [];
  const stale = idsWhere(verdicts, (v) => "stale" in v);
  if (stale.length > 0) {
    faults.push(`stale cassettes: ${stale.join(", ")} — ${UNBLOCK_PATHS}`);
  }
  const orphans = idsWhere(
    verdicts,
    (v) => v.status === "unmeasured" && v.reason.startsWith("no case")
  );
  if (orphans.length > 0) {
    faults.push(`cassettes without a case: ${orphans.join(", ")}`);
  }
  if (measured === 0) {
    faults.push("zero measured cases: a replay that measured nothing fails");
  }
  for (const v of verdicts)
    if (v.status === "failed") faults.push(...v.failures);
  return faults;
};

/** Replays cassettes one at a time through the suite's real runtime path. */
export const replayCassettes = async (
  suite: ReplaySuite,
  cassettes: ReadonlyArray<Cassette>
): Promise<ReplayResult> => {
  const verdicts: Array<CaseVerdict> = [];
  for (const cassette of cassettes) {
    verdicts.push(await verdictFor(suite, cassette));
  }
  const measured = verdicts.filter((v) => v.status !== "unmeasured").length;
  const faults = faultsOf(verdicts, measured);
  return { exitCode: faults.length === 0 ? 0 : 1, measured, faults, verdicts };
};
