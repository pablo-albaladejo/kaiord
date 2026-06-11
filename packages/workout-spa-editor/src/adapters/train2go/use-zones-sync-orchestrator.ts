/**
 * Two-phase orchestrator for the Train2Go zones-sync flow.
 *
 * Phase 1 — `runSync(profileId)`: invokes the application's
 * `syncZones` use case. Silent fills land in the profile eagerly;
 * conflicts come back unwritten and are stashed in component state
 * to drive the dialog.
 *
 * Phase 2 — `confirmDecisions(decisions)`: invokes
 * `commitConflictResolution` with the user's per-row choices, then
 * clears the pending state. `cancel()` clears state without writing.
 *
 * Toast strings come from the constants exported by `sync-zones.ts`
 * — never template-literal interpolation in toast/console calls
 * (mechanical guard `check-no-pii-leakage.mjs` enforces this).
 */
import { useCallback, useState } from "react";

import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import { commitConflictResolution } from "../../application/coaching/commit-conflict-resolution";
import {
  syncZones,
  TOAST_ZONES_FETCH_FAILED,
  TOAST_ZONES_SHAPE_MISMATCH,
  TOAST_ZONES_UNSUPPORTED,
} from "../../application/coaching/sync-zones";
import type { useToast } from "../../hooks/use-toast";
import type { PersistencePort } from "../../ports/persistence-port";
import type {
  ConflictDecision,
  ConflictItem,
  FieldKey,
  ZonesPayload,
} from "../../types/coaching-zones";

type Pending = {
  profileId: string;
  conflicts: readonly ConflictItem[];
  payload: ZonesPayload;
};

export type ZonesSyncOrchestrator = {
  pending: Pending | null;
  runSync: (profileId: string) => Promise<void>;
  confirmDecisions: (
    decisions: Record<FieldKey, ConflictDecision>
  ) => Promise<void>;
  cancel: () => void;
};

const handleFailure = (
  reason: string,
  toasts: ReturnType<typeof useToast>
): void => {
  if (reason === "transport-error") toasts.error(TOAST_ZONES_FETCH_FAILED);
  else if (reason === "shape-mismatch")
    toasts.warning(TOAST_ZONES_SHAPE_MISMATCH);
  else if (reason === "unsupported") toasts.info(TOAST_ZONES_UNSUPPORTED);
};

export const useZonesSyncOrchestrator = (
  persistence: PersistencePort,
  transport: CoachingTransport,
  toasts: ReturnType<typeof useToast>
): ZonesSyncOrchestrator => {
  const [pending, setPending] = useState<Pending | null>(null);

  const runSync = useCallback(
    async (profileId: string) => {
      const r = await syncZones(profileId, transport, persistence.profiles);
      if (!r.ok) {
        handleFailure(r.reason, toasts);
        return;
      }
      if (r.conflicts.length > 0) {
        setPending({ profileId, conflicts: r.conflicts, payload: r.payload });
      }
    },
    [transport, persistence, toasts]
  );

  const confirmDecisions = useCallback(
    async (decisions: Record<FieldKey, ConflictDecision>) => {
      if (!pending) return;
      await commitConflictResolution(
        pending.profileId,
        decisions,
        persistence.profiles,
        pending.payload
      );
      setPending(null);
    },
    [pending, persistence]
  );

  const cancel = useCallback(() => setPending(null), []);

  return { pending, runSync, confirmDecisions, cancel };
};
