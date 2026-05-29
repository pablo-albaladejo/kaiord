/**
 * Analytics helpers and hash utility for record-export use case.
 */
import type { Analytics, ManagedDataType } from "@kaiord/core";
import { canonicalHash, MANAGED_DATA_REGISTRY } from "@kaiord/core";

import type { ExportLedgerRepository } from "./export-ledger-repository.port";

export type ExportAnalyticsOutcome =
  | "created"
  | "updated"
  | "skipped"
  | "lost-race"
  | "error";

export const computeExportHash = (
  dataType: ManagedDataType,
  payload: Record<string, unknown>
): string => {
  const entry = MANAGED_DATA_REGISTRY[dataType];
  const projected = entry?.hashProjection
    ? entry.hashProjection(payload)
    : payload;
  return canonicalHash(projected as Record<string, unknown>);
};

export const emitExportAnalytics = async (
  analytics: Analytics | undefined,
  ledgerRepo: ExportLedgerRepository,
  dataType: ManagedDataType,
  destinationBridgeId: string,
  outcome: ExportAnalyticsOutcome,
  durationMs: number
): Promise<void> => {
  const analyticsOutcome =
    outcome === "created"
      ? "posted"
      : outcome === "updated"
        ? "patched"
        : outcome === "error"
          ? "error"
          : "skipped";
  analytics?.event("export_completed", {
    dataType,
    destinationBridgeId,
    durationMs,
    outcome: analyticsOutcome,
  });
  if (outcome !== "error") {
    const count = await ledgerRepo.countByDataType(dataType);
    analytics?.event("kaiord.export.ledger.size", { dataType, count });
  }
};
