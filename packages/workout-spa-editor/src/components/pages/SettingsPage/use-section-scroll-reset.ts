import { useEffect, useRef } from "react";

/**
 * Reset the document scroll when the open Settings section changes, so a
 * section is never entered already scrolled to the previous one's offset.
 *
 * Writing the scroller's `scrollTop` rather than calling `window.scrollTo()`
 * keeps the hook silent under jsdom, which does not implement the scroll
 * methods. `document.scrollingElement` is the standards-mode scroller;
 * jsdom leaves it undefined, hence the `documentElement` fallback.
 *
 * The first render is deliberately skipped: a deep link carrying
 * `?section=` is scrolled by `useFocusOnSectionChange`, and resetting on
 * mount would fight it.
 */
export function useSectionScrollReset(section: string | undefined): void {
  const lastRef = useRef<string | undefined | null>(null);

  useEffect(() => {
    if (lastRef.current === null) {
      lastRef.current = section;
      return;
    }
    if (lastRef.current === section) return;
    lastRef.current = section;

    const scroller = document.scrollingElement ?? document.documentElement;
    scroller.scrollTop = 0;
  }, [section]);
}
