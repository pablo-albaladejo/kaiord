/**
 * Compact, read-only row of lifecycle badges for a calendar session card.
 *
 * F2 cockpit invariant: this is a state surface only — no mutation
 * affordances live here (see `openspec` calendario-cockpit plan, F2/F3
 * invariant). Renders one icon per active facet and nothing at all when
 * no facet is active, so a plain manual/unlinked card stays unchanged.
 *
 * The row is a pure function of which of the four facets are active, so
 * there are at most 16 distinct rows. Rendered rows are cached by that
 * locale and bitmask so a 30-card calendar week reuses one element per combination
 * instead of re-running filter/map and allocating icon elements per card
 * (calendar performance budget).
 */
import type { ReactNode } from "react";

import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { getTranslate, type Translate } from "../../../i18n/use-translate";
import type { SessionLifecycleFlags } from "./session-lifecycle";
import { LIFECYCLE_BADGE_DEFS } from "./session-lifecycle-defs";

const rowCache = new Map<string, ReactNode>();

const bitmaskOf = (flags: SessionLifecycleFlags): number =>
  LIFECYCLE_BADGE_DEFS.reduce(
    (mask, def, index) => (flags[def.facet] ? mask | (1 << index) : mask),
    0
  );

const buildRow = (mask: number, t: Translate): ReactNode => {
  const active = LIFECYCLE_BADGE_DEFS.filter((_, index) => mask & (1 << index));
  if (active.length === 0) return null;
  return (
    <span
      data-testid="session-lifecycle-badges"
      className="inline-flex items-center gap-1"
    >
      {active.map((def) => (
        <def.icon
          key={def.facet}
          className="h-3 w-3 shrink-0 text-slate-500 dark:text-slate-400"
          role="img"
          aria-label={t(`lifecycleBadge.${def.facet}`)}
          data-testid={`lifecycle-badge-${def.facet}`}
        />
      ))}
    </span>
  );
};

export type SessionLifecycleBadgesProps = {
  flags: SessionLifecycleFlags;
};

export function SessionLifecycleBadges({ flags }: SessionLifecycleBadgesProps) {
  const locale = useActiveLocale();
  const mask = bitmaskOf(flags);
  const cacheKey = `${locale}:${mask}`;
  let row = rowCache.get(cacheKey);
  if (row === undefined) {
    row = buildRow(mask, getTranslate("calendar", locale));
    rowCache.set(cacheKey, row);
  }
  return <>{row}</>;
}
