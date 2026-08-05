/**
 * HeaderLogo Component
 *
 * Kaiord logo and title for the header. Uses wouter Link for SPA
 * navigation (no full page reload).
 *
 * The brand label is a `<span>` (not `<h1>`) so each routed page
 * owns its own primary heading marked with `[data-route-heading]`.
 * This avoids two `<h1>`s on every page and lets the route-change
 * announcer / focus-on-route-change hook target a single, page-
 * scoped landmark.
 */

import { Link } from "wouter";

import { BrandMark } from "../../../atoms/BrandMark/BrandMark";

export function HeaderLogo() {
  return (
    <Link
      href="/calendar"
      className="flex shrink-0 items-center gap-3 no-underline"
    >
      {/* The wrapper is where the runtime will set --core-live to the week's
          dominant zone. Until that derivation exists the SVG's own fallback
          renders the core in ink, which is also the empty-week rendering. */}
      <span className="flex shrink-0 items-center text-ink-strong">
        <BrandMark size={28} core="live" />
      </span>
      <span
        className="whitespace-nowrap text-xl font-semibold tracking-[-0.02em] text-ink-strong sm:text-2xl"
        aria-label="Kaiord Editor"
      >
        Kaiord Editor
      </span>
    </Link>
  );
}
