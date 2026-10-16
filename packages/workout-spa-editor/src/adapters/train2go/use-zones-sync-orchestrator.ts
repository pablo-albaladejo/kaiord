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
 * Both use cases load on first call, outside the initial JS: the provider
 * mounting this hook is app-wide, but a zones sync only runs on a user
 * action or an opted-in auto-import. A failed load toasts like a failed
 * fetch; a failed commit load keeps the decisions pending for a retry.
 *
 * Failure toasts (`zones-sync-failure.ts`) come from the constants in
 * `sync-zones-toasts.ts` — never template-literal interpolation in toast/console calls
 * (mechanical guard `check-no-pii-leakage.mjs` enforces this).
 */
import { useCallback, useState } from "react";

import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import type { useToast } from "../../hooks/use-toast";
import { lazyImport } from "../../lib/lazy-import";
import type { PersistencePort } from "../../ports/persistence-port";
import type {
  ConflictDecision,
  ConflictItem,
  FieldKey,
  ZonesPayload,
} from "../../types/coaching-zones";
import { handleFailure } from "./zones-sync-failure";

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

export const useZonesSyncOrchestrator = (
  persistence: PersistencePort,
  transport: CoachingTransport,
  toasts: ReturnType<typeof useToast>
): ZonesSyncOrchestrator => {
  const [pending, setPending] = useState<Pending | null>(null);

  const runSync = useCallback(
    async (profileId: string) => {
      const loaded = await lazyImport(
        () => import("../../application/coaching/sync-zones")
      ).catch(() => null);
      if (!loaded) {
        handleFailure("transport-error", toasts);
        return;
      }
      const r = await loaded.syncZones(profileId, transport, persistence);
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
      const loaded = await lazyImport(
        () => import("../../application/coaching/commit-conflict-resolution")
      ).catch(() => null);
      if (!loaded) {
        handleFailure("transport-error", toasts);
        return;
      }
      await loaded.commitConflictResolution(
        pending.profileId,
        decisions,
        persistence,
        pending.payload
      );
      setPending(null);
    },
    [pending, persistence, toasts]
  );

  const cancel = useCallback(() => setPending(null), []);

  return { pending, runSync, confirmDecisions, cancel };
};
