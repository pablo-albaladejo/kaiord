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

import type { CSSProperties } from "react";
import { Link } from "wouter";

import { useActiveProfileLive } from "../../../../hooks/use-active-profile-live";
import { useWeekDominantZone } from "../../../../hooks/use-week-dominant-zone";
import { zoneVar } from "../../../../lib/zone-colors";
import { BrandMark } from "../../../atoms/BrandMark/BrandMark";

export function HeaderLogo() {
  const active = useActiveProfileLive();
  const zone = useWeekDominantZone(active?.id ?? null, active?.profile ?? null);
  const coreLive =
    zone === null
      ? undefined
      : ({ "--core-live": zoneVar(zone) } as CSSProperties);

  return (
    <Link
      href="/calendar"
      className="flex shrink-0 items-center gap-3 no-underline"
    >
      {/* The wrapper carries --core-live: the dominant training zone of the
          week. A week with no calculable zone declares nothing at all, and the
          core inherits the ink the role layer already holds — the empty case
          is the absence of a rule, not a rule that paints ink. */}
      <span
        data-testid="brand-mark-wrapper"
        className="flex shrink-0 items-center text-ink-strong"
        style={coreLive}
      >
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
