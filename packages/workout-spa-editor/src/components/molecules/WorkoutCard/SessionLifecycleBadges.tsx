/**
 * Compact, read-only row of lifecycle badges for a calendar session card.
 *
 * F2 cockpit invariant: this is a state surface only — no mutation
 * affordances live here (see `openspec` calendario-cockpit plan, F2/F3
 * invariant). Renders one icon per active facet and nothing at all when
 * no facet is active, so a plain manual/unlinked card stays unchanged.
 */
import type { SessionLifecycleFlags } from "./session-lifecycle";
import { LIFECYCLE_BADGE_DEFS } from "./session-lifecycle-defs";

export type SessionLifecycleBadgesProps = {
  flags: SessionLifecycleFlags;
};

export function SessionLifecycleBadges({ flags }: SessionLifecycleBadgesProps) {
  const active = LIFECYCLE_BADGE_DEFS.filter((def) => flags[def.facet]);
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
          aria-label={def.label}
          data-testid={`lifecycle-badge-${def.facet}`}
        />
      ))}
    </span>
  );
}
