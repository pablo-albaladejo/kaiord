/**
 * useFocusOnSectionChange — move focus to an in-tab Settings sub-section
 * when the `?section=` query changes, complementing
 * `useFocusOnRouteChange` (which keys on pathname only and cannot see a
 * query-only transition).
 *
 * Contract: each addressable sub-section carries the
 * `[data-settings-section]` attribute and `tabIndex={-1}`. The hook
 * reads `?section=` via wouter's `useSearch()`, resolves the matching
 * element, and focuses it via `applyFocusToElement` (focus +
 * scroll-into-view). It dedupes on the section value so re-selecting the
 * same section does not steal focus back.
 */

import { useEffect, useRef } from "react";
import { useSearch } from "wouter";

import {
  SETTINGS_SECTION_ATTR,
  SETTINGS_SECTION_SELECTOR,
} from "../components/pages/SettingsPage/settings-section";
import {
  applyFocusToElement,
  prefersReducedMotion,
} from "./focus/apply-focus-to-element";

export function useFocusOnSectionChange(): void {
  const search = useSearch();
  const section = new URLSearchParams(search).get("section");
  const lastRef = useRef<string | null>(null);

  useEffect(() => {
    if (section === null || section === lastRef.current) return;
    lastRef.current = section;

    const raf = requestAnimationFrame(() => {
      const el = Array.from(
        document.querySelectorAll<HTMLElement>(SETTINGS_SECTION_SELECTOR)
      ).find((n) => n.getAttribute(SETTINGS_SECTION_ATTR) === section);
      if (el) applyFocusToElement(el, { reduceMotion: prefersReducedMotion() });
    });

    return () => cancelAnimationFrame(raf);
  }, [section]);
}
