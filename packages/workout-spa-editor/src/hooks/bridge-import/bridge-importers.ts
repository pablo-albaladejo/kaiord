/**
 * The bridges Kaiord can pull from on demand, keyed by bridgeId.
 *
 * Each entry is the same runner the calendar's once-per-mount effect uses, so
 * a manual pull and an automatic one cannot drift apart. Every runner is
 * idempotent (imports upsert by external id), which is what makes a button
 * safe to press twice.
 *
 * `train2go-bridge` is deliberately ABSENT. Its import is week-scoped —
 * `syncWeek(deps, profileId, weekStart)` — and driven by whichever week the
 * calendar is showing. A settings page has no week, so a "Sync now" here
 * would either invent one or pull nothing; the button is not offered rather
 * than offered with a meaning the product does not have.
 */
import type { PersistencePort } from "../../ports/persistence-port";
import { runGarminImport } from "./run-garmin-import";
import { runTanitaImport } from "./run-tanita-import";
import { runTrainingPeaksImport } from "./run-trainingpeaks-import";
import { runWhoopImport } from "./run-whoop-import";

export type BridgeImporter = (
  persistence: PersistencePort,
  extensionId: string,
  profileId: string
) => Promise<void>;

export const BRIDGE_IMPORTERS: Readonly<Record<string, BridgeImporter>> = {
  "garmin-bridge": runGarminImport,
  "whoop-bridge": runWhoopImport,
  "trainingpeaks-bridge": runTrainingPeaksImport,
  "tanita-bridge": runTanitaImport,
};

export const bridgeImporterFor = (
  bridgeId: string | null
): BridgeImporter | undefined =>
  bridgeId === null ? undefined : BRIDGE_IMPORTERS[bridgeId];
