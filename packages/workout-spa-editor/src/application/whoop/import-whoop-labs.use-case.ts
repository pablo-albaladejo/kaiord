/**
 * importWhoopLabs — user-initiated (design D6) import of WHOOP biomarker
 * tests into KAIORD lab reports. Unlike the auto `useWhoopSync` pull, this
 * runs only on an explicit user action and is never policy-gated. Fetches
 * the test list, then imports each test not already on record (dedup by
 * `sourceBridgeId`+`externalId`, see `whoop-lab-provenance.ts`) through
 * `importOneWhoopLabTest`.
 */
import { whoopBiomarkerTestsResponseSchema } from "@kaiord/whoop";

import { importOneWhoopLabTest, TESTS_PATH } from "./import-one-whoop-lab-test";
import type { WhoopFetchResult } from "./whoop-fetch-result";
import type {
  ImportWhoopLabsDeps,
  ImportWhoopLabsResult,
} from "./whoop-lab-import-types";
import { existingWhoopExternalIds } from "./whoop-lab-provenance";

export type { ImportWhoopLabsDeps, ImportWhoopLabsResult };

const transportError = (error?: string): ImportWhoopLabsResult => ({
  ok: false,
  reason: "transport-error",
  error,
});

export const importWhoopLabs = async (
  deps: ImportWhoopLabsDeps
): Promise<ImportWhoopLabsResult> => {
  let listed: WhoopFetchResult;
  try {
    listed = await deps.fetchLabs(TESTS_PATH);
  } catch (err) {
    return transportError(err instanceof Error ? err.message : String(err));
  }
  if (!listed.ok) return transportError(listed.error);
  const parsedList = whoopBiomarkerTestsResponseSchema.safeParse(listed.data);
  if (!parsedList.success) {
    return transportError("Malformed WHOOP biomarker tests list");
  }

  let existingIds: Set<string>;
  try {
    existingIds = await existingWhoopExternalIds(
      deps.persistence,
      deps.profileId
    );
  } catch (err) {
    return transportError(err instanceof Error ? err.message : String(err));
  }
  let imported = 0;
  let skipped = 0;
  for (const test of parsedList.data) {
    const outcome = await importOneWhoopLabTest(deps, test, existingIds);
    if (outcome.kind === "imported") {
      imported += 1;
      existingIds.add(String(test.id));
    } else {
      // A per-test error (summary fetch/parse) is tallied as skipped and the
      // batch continues rather than aborting — one bad test must not discard
      // the reports already committed nor report the whole import as failed.
      // Re-import is idempotent, so a skipped test self-heals on the next run.
      skipped += 1;
    }
  }
  return { ok: true, imported, skipped };
};
