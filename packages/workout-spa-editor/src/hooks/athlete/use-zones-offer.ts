import { useCallback, useMemo, useSyncExternalStore } from "react";

import { takeTrain2GoZones } from "../../adapters/train2go/take-train2go-zones";
import {
  type ZonesOfferKind,
  zonesOfferKind,
} from "../../adapters/train2go/zones-offer-kind";
import {
  openZonesOffer,
  settleZonesOffer,
  subscribeZonesOffers,
} from "../../adapters/train2go/zones-offer-memo";
import { readField } from "../../application/coaching/sync-zones-profile-fields";
import { usePersistence } from "../../contexts/persistence-context";
import type { ConflictItem } from "../../types/coaching-zones";
import type { Profile } from "../../types/profile";

export type ZonesOffer = {
  /** What still differs, `undefined` when nothing is offered. */
  kind: ZonesOfferKind | undefined;
  /** Writes Train2Go's numbers; `false` when they could not be loaded. */
  take: () => Promise<boolean>;
  keep: () => void;
};

const stillDiffers = (profile: Profile, conflict: ConflictItem): boolean => {
  try {
    return readField(profile, conflict.field) !== conflict.incoming;
  } catch {
    return false;
  }
};

/**
 * The Train2Go offer that stays open on this device after its notice is
 * gone: only the numbers that still differ from the athlete's are offered.
 */
export function useZonesOffer(profile: Profile): ZonesOffer {
  const persistence = usePersistence();
  const open = useSyncExternalStore(subscribeZonesOffers, () =>
    openZonesOffer(profile.id)
  );
  const differing = useMemo(
    () => open.filter((c) => stillDiffers(profile, c)),
    [open, profile]
  );
  const take = useCallback(
    () => takeTrain2GoZones(profile.id, differing, persistence),
    [profile.id, differing, persistence]
  );
  const keep = useCallback(() => settleZonesOffer(profile.id), [profile.id]);
  return {
    kind: differing.length > 0 ? zonesOfferKind(differing) : undefined,
    take,
    keep,
  };
}
