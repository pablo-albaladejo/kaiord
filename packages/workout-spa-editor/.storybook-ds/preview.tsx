import type { Decorator, Preview } from "@storybook/react-vite";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import base from "../.storybook/preview";

// Storybook loads `preview` from the same directory as the `main` it was given,
// so this config dir needs its own. Without it the sync's Storybook renders
// every story with no stylesheet and no providers — the compare sheets then show
// an unstyled serif column against a styled preview, and every comparison is
// meaningless.
//
// The one addition is for overlay stories. Radix dialogs and toasts portal into
// `document.body`, leaving `#storybook-root` empty, and the sync's comparer
// reads an empty root as "the story did not render" — every open dialog was
// reported broken while rendering correctly. It also screenshots the root, not
// the page, so even a found root would be the padded box of the `centered`
// layout: a blank square, not the dialog.
//
// So the anchor does two things. It is always present and always first — the
// comparer waits on the root's FIRST child being visible, and a story whose
// first child is a zero-height wrapper (Toast's viewport) failed that wait
// too. And while nothing but itself paints inside the root, it
// stretches the root over the viewport — the same frame the design-system card
// is shot at — so the capture is the overlay the story actually opened. The
// moment the story paints in the root, the root is left exactly as Storybook
// laid it out; the anchor is `position: fixed` and never takes part in layout.
const OVERLAY_FRAME: Partial<CSSStyleDeclaration> = {
  position: "fixed",
  inset: "0",
  margin: "0",
  padding: "0",
};

const paintsSomething = (el: Element) =>
  [...el.getClientRects()].some((r) => r.width > 0 && r.height > 0);

// Text placed straight in the root paints but is no element, so it is checked
// on its own.
const hasText = (root: Element) =>
  [...root.childNodes].some(
    (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim()
  );

const Anchor = () => {
  const ref = useRef<HTMLSpanElement>(null);
  // Not on the first commit: an anchor that paints immediately would release
  // the comparer's wait before a story that fills in a frame later (a portal
  // mounting in an effect, a lazy child) has painted anything.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setReady(true));
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useLayoutEffect(() => {
    if (!ready) return;
    const anchor = ref.current;
    const root = anchor?.parentElement;
    if (!anchor || !root) return;
    const original = root.getAttribute("style");
    const sync = () => {
      // Descendants, not children: a story's outer node may be a
      // `display: contents` wrapper with no box of its own (Tooltip's
      // trigger), while what it wraps paints.
      const empty =
        !hasText(root) &&
        ![...root.querySelectorAll("*")].some(
          (el) => el !== anchor && paintsSomething(el)
        );
      if (original === null) root.removeAttribute("style");
      else root.setAttribute("style", original);
      if (empty) Object.assign(root.style, OVERLAY_FRAME);
    };
    sync();
    // Paint can start without a node being inserted: a class or style flip, or
    // an image finishing its load. The root's own style is this code's write,
    // so records on the root itself are ignored — otherwise it would loop.
    const observer = new MutationObserver((records) => {
      if (records.some((r) => r.target !== root)) sync();
    });
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
    root.addEventListener("load", sync, true);
    return () => {
      observer.disconnect();
      root.removeEventListener("load", sync, true);
      if (original === null) root.removeAttribute("style");
      else root.setAttribute("style", original);
    };
  }, [ready]);
  if (!ready) return null;
  return (
    <span
      ref={ref}
      aria-hidden="true"
      data-design-sync-anchor=""
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: "none",
      }}
    />
  );
};

const withAnchor: Decorator = (Story) => (
  <>
    <Anchor />
    <Story />
  </>
);

const preview: Preview = {
  ...base,
  // Last in the list is outermost, so the anchor sits directly in the root.
  decorators: [...[base.decorators ?? []].flat(), withAnchor],
};

export default preview;
