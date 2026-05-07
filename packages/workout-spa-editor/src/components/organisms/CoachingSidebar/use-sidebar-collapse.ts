/**
 * Persisted collapse state for `CoachingSidebar`. Default is expanded
 * for ≥768px viewports and collapsed for narrower screens (the
 * `matchMedia` check at first mount). Subsequent toggles persist via
 * `localStorage` under the canonical key.
 */
import { useCallback, useEffect, useState } from "react";

export const COLLAPSE_STORAGE_KEY = "kaiord.editor.coachSidebar.collapsed";
const DESKTOP_BREAKPOINT_PX = 768;

const readPersistedCollapsed = (): boolean | undefined => {
  try {
    const raw = localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (raw === "true") return true;
    if (raw === "false") return false;
    return undefined;
  } catch {
    return undefined;
  }
};

const detectDefaultCollapsed = (): boolean => {
  if (typeof window === "undefined") return false;
  return !window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT_PX}px)`).matches;
};

export type UseSidebarCollapse = {
  collapsed: boolean;
  toggle: () => void;
};

export const useSidebarCollapse = (): UseSidebarCollapse => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    const persisted = readPersistedCollapsed();
    return persisted ?? detectDefaultCollapsed();
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_STORAGE_KEY, String(collapsed));
    } catch {
      // localStorage may be unavailable (e.g., private mode); the
      // collapse state still works in-memory for the current session.
    }
  }, [collapsed]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);
  return { collapsed, toggle };
};
