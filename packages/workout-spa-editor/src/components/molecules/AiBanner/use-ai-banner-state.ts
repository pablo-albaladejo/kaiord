/**
 * useAiBannerState — owns the open/armed/auto-collapse FSM for
 * `AiBanner` and persists transitions to `userPreferences.aiBannerExpanded`
 * for the active profile.
 *
 * Auto-collapse rule (per plan A4): the panel auto-collapses ONLY on
 * the first AI-generation success after the user expanded it. Manual
 * step adds never collapse it; subsequent successes don't auto-collapse
 * either — the user owns the state after the first auto-collapse.
 *
 * Seed runs once when the live prefs query resolves; manual toggles
 * and the auto-collapse both write the new value back.
 */

import { useEffect, useRef, useState } from "react";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useSetUserPreferenceFields } from "../../../hooks/use-set-user-preference-fields";
import { useUserPreferences } from "../../../hooks/use-user-preferences";
import { useAiRuntimeStore } from "../../../store/ai-runtime-store";

export type AiBannerState = {
  open: boolean;
  toggle: () => void;
};

export function useAiBannerState(): AiBannerState {
  const [open, setOpen] = useState(false);
  const seededRef = useRef(false);
  const userTouchedRef = useRef(false);
  const [armed, setArmed] = useState(false);
  const [hasAutoCollapsed, setHasAutoCollapsed] = useState(false);
  const generation = useAiRuntimeStore((s) => s.generation);
  const profileId = useActiveProfileLive()?.id ?? null;
  const prefs = useUserPreferences({ profileId, defaultView: "grid" });
  const setPrefs = useSetUserPreferenceFields(profileId);

  useEffect(() => {
    if (seededRef.current) return;
    if (prefs === undefined) return;
    seededRef.current = true;
    // A user toggle that races ahead of the live-prefs resolution must
    // win — only seed when the user has NOT yet interacted.
    if (userTouchedRef.current) return;
    setOpen(prefs.aiBannerExpanded ?? false);
  }, [prefs]);

  useEffect(() => {
    if (!open) return;
    if (generation.status === "success" && armed) {
      setOpen(false);
      setArmed(false);
      setHasAutoCollapsed(true);
      void setPrefs({ aiBannerExpanded: false });
    }
  }, [generation.status, open, armed, setPrefs]);

  const toggle = () => {
    userTouchedRef.current = true;
    const next = !open;
    setOpen(next);
    if (next && !hasAutoCollapsed) setArmed(true);
    void setPrefs({ aiBannerExpanded: next });
  };

  return { open, toggle };
}
