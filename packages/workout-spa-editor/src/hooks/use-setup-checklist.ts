/**
 * useSetupChecklist — the live "Getting set up" checklist.
 *
 * Composes the aggregate Dexie read (`use-setup-checklist-facts`) with the
 * existing profile and bridge-discovery hooks, and folds them into the four
 * onboarding items. Nothing here polls: bridge presence comes from the
 * discovery singleton that `use-store-hydration` already bootstraps, and
 * connection records come from the v24 `connections` store. Session liveness
 * is deliberately NOT consulted — the question is "has this user connected
 * anything at all", not "is a session valid right now".
 *
 * `complete` is what hides the card once every item ticks, so a finished
 * checklist needs no explicit dismissal.
 */

import { useCallback, useMemo } from "react";

import {
  buildSetupChecklistItems,
  hasAnyThreshold,
  type SetupChecklistItem,
} from "../lib/setup-checklist";
import { logger } from "../utils/logger";
import { useActiveProfileLive } from "./use-active-profile-live";
import { useDiscoveredBridges } from "./use-discovered-bridges";
import { useSetUserPreferenceFields } from "./use-set-user-preference-fields";
import { useSetupChecklistFacts } from "./use-setup-checklist-facts";

export type SetupChecklist = {
  readonly items: readonly SetupChecklistItem[];
  readonly doneCount: number;
  readonly total: number;
  readonly complete: boolean;
  readonly dismissed: boolean;
  readonly dismiss: () => void;
};

export function useSetupChecklist(): SetupChecklist {
  const active = useActiveProfileLive();
  const profile = active?.profile ?? null;
  const facts = useSetupChecklistFacts(active?.id ?? null);
  const bridges = useDiscoveredBridges();
  const setPrefs = useSetUserPreferenceFields(active?.id ?? null);

  const items = useMemo(
    () =>
      buildSetupChecklistItems({
        hasWorkout: facts.workoutCount > 0,
        hasThreshold: hasAnyThreshold(profile),
        hasSource: bridges.length > 0 || facts.connectedCount > 0,
        hasPush: facts.pushCount > 0,
      }),
    [facts, profile, bridges]
  );

  const dismiss = useCallback(() => {
    void setPrefs({ setupChecklistDismissed: true }).catch((error: unknown) => {
      logger.warn("Failed to persist setup-checklist dismissal", { error });
    });
  }, [setPrefs]);

  const doneCount = items.filter((item) => item.done).length;

  return {
    items,
    doneCount,
    total: items.length,
    complete: doneCount === items.length,
    dismissed: facts.dismissed,
    dismiss,
  };
}
