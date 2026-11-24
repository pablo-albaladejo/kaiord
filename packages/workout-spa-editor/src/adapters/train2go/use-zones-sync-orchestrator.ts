/**
 * The Train2Go zones sync. `syncZones` writes what fills an empty number,
 * records Train2Go's weight as its own weigh-in, and returns, unwritten, the
 * zones and thresholds where Train2Go differs from what the athlete set: the
 * athlete's own numbers always win, so nothing is asked. Once per set of
 * differing numbers the App offers to take Train2Go's instead (`offerTheirs`,
 * a toast with one action: decide and offer undo, ADR 0003); the offer stays
 * open on this device for the Athlete page until it is used or declined.
 *
 * The use cases and the offer memo load on first call, outside the initial
 * JS. Failure toasts (`zones-sync-failure.ts`) are worded from the `coaching`
 * dictionary by reason, never from a failure's own text.
 */
import { useCallback } from "react";

import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import type { useToast } from "../../hooks/use-toast";
import { useActiveLocale } from "../../i18n/LocaleProvider";
import { useTranslate } from "../../i18n/use-translate";
import { lazyImport } from "../../lib/lazy-import";
import type { PersistencePort } from "../../ports/persistence-port";
import type { ConflictItem } from "../../types/coaching-zones";
import { takeTrain2GoZones } from "./take-train2go-zones";
import { TAKEN_COPY } from "./zones-offer-copy";
import { type ZonesOfferKind, zonesOfferKind } from "./zones-offer-kind";
import { handleFailure, type ShowNotLoaded } from "./zones-sync-failure";

export type OfferTheirs = (
  kind: ZonesOfferKind,
  takeTheirs: () => Promise<void>
) => void;

export type ZonesSyncOrchestrator = {
  runSync: (profileId: string) => Promise<void>;
};

/* Whether to offer these numbers; with no memo to remember them, offer. */
const isNewOffer = async (
  profileId: string,
  conflicts: readonly ConflictItem[]
): Promise<boolean> => {
  const memo = await lazyImport(() => import("./zones-offer-memo")).catch(
    () => null
  );
  if (!memo) return conflicts.length > 0;
  return memo.rememberZonesOffer(profileId, conflicts);
};

export const useZonesSyncOrchestrator = (
  persistence: PersistencePort,
  transport: CoachingTransport,
  toasts: ReturnType<typeof useToast>,
  offerTheirs: OfferTheirs,
  showNotLoaded: ShowNotLoaded
): ZonesSyncOrchestrator => {
  const t = useTranslate("coaching");
  const locale = useActiveLocale();

  const runSync = useCallback(
    async (profileId: string) => {
      const fail = (reason: string) =>
        handleFailure(reason, toasts, t, locale, showNotLoaded);
      const loaded = await lazyImport(
        () => import("../../application/coaching/sync-zones")
      ).catch(() => null);
      if (!loaded) return fail("app-part-not-loaded");
      const r = await loaded.syncZones(profileId, transport, persistence);
      if (!r.ok) return fail(r.reason);
      if (!(await isNewOffer(profileId, r.conflicts))) return;
      const kind = zonesOfferKind(r.conflicts);
      offerTheirs(kind, async () => {
        const taken = await takeTrain2GoZones(
          profileId,
          r.conflicts,
          persistence
        );
        if (!taken) return fail("app-part-not-loaded");
        toasts.success(t(TAKEN_COPY[kind]));
      });
    },
    [transport, persistence, toasts, t, locale, offerTheirs, showNotLoaded]
  );

  return { runSync };
};
