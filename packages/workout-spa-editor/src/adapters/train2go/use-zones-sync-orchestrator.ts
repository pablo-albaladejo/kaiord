/**
 * The Train2Go zones sync. `syncZones` writes what fills an empty number
 * and returns, unwritten, the numbers where Train2Go differs from what the
 * athlete set: the athlete's own numbers always win, so nothing is asked.
 * Once per set of different numbers the App offers to take Train2Go's
 * instead (`offerTheirs`, a toast with one action: decide and offer undo,
 * ADR 0003); using it commits every one of them as accepted.
 *
 * Both use cases load on first call, outside the initial JS. Failure toasts
 * (`zones-sync-failure.ts`) are worded from the `coaching` dictionary by
 * reason, never from a failure's own text.
 */
import { useCallback } from "react";

import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import type { useToast } from "../../hooks/use-toast";
import { useActiveLocale } from "../../i18n/LocaleProvider";
import { useTranslate } from "../../i18n/use-translate";
import { lazyImport } from "../../lib/lazy-import";
import type { PersistencePort } from "../../ports/persistence-port";
import type {
  ConflictDecision,
  ConflictItem,
  FieldKey,
} from "../../types/coaching-zones";
import { firstOffer } from "./zones-offer-memo";
import { handleFailure } from "./zones-sync-failure";

export type OfferTheirs = (takeTheirs: () => Promise<void>) => void;

export type ZonesSyncOrchestrator = {
  runSync: (profileId: string) => Promise<void>;
};

const acceptAll = (conflicts: readonly ConflictItem[]) =>
  Object.fromEntries(conflicts.map((c) => [c.field, "accept"])) as Record<
    FieldKey,
    ConflictDecision
  >;

export const useZonesSyncOrchestrator = (
  persistence: PersistencePort,
  transport: CoachingTransport,
  toasts: ReturnType<typeof useToast>,
  offerTheirs: OfferTheirs
): ZonesSyncOrchestrator => {
  const t = useTranslate("coaching");
  const locale = useActiveLocale();

  const runSync = useCallback(
    async (profileId: string) => {
      const fail = (reason: string) => handleFailure(reason, toasts, t, locale);
      const loaded = await lazyImport(
        () => import("../../application/coaching/sync-zones")
      ).catch(() => null);
      if (!loaded) return fail("transport-error");
      const r = await loaded.syncZones(profileId, transport, persistence);
      if (!r.ok) return fail(r.reason);
      if (r.conflicts.length === 0 || !firstOffer(profileId, r.conflicts)) {
        return;
      }
      offerTheirs(async () => {
        const commit = await lazyImport(
          () => import("../../application/coaching/commit-conflict-resolution")
        ).catch(() => null);
        if (!commit) return fail("transport-error");
        await commit.commitConflictResolution(
          profileId,
          acceptAll(r.conflicts),
          persistence,
          r.payload
        );
      });
    },
    [transport, persistence, toasts, t, locale, offerTheirs]
  );

  return { runSync };
};
