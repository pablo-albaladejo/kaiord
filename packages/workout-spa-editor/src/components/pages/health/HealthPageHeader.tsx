/**
 * Shared header for /health/* pages.
 *
 * Renders an `<h1>` marked with `data-route-heading` + `tabIndex={-1}`
 * so the focus-on-route-change hook can move focus on navigation, then the
 * six-route strip — placed after the heading so the one-heading-per-route
 * contract and the tab order both stay intact.
 */
import type { ManualHealthMetric } from "../../../application/health/manual-health-metric";
import { ROUTE_HEADING_ATTR } from "../../../routing/constants";
import { HealthAddDataButton } from "./HealthAddDataButton";
import { HealthSubRouteLinks } from "./HealthSubRouteLinks";

type HealthPageHeaderProps = {
  title: string;
  subtitle?: string;
  /** Shows an "Add data" action that opens manual entry on this metric. */
  addMetric?: ManualHealthMetric;
};

export const HealthPageHeader = ({
  title,
  subtitle,
  addMetric,
}: HealthPageHeaderProps) => (
  <header className="mb-6 flex flex-col gap-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1
          tabIndex={-1}
          {...{ [ROUTE_HEADING_ATTR]: "" }}
          className="text-xl font-semibold tracking-[-0.02em] text-ink-strong"
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm tabular-nums text-ink-muted">{subtitle}</p>
        )}
      </div>
      {addMetric && <HealthAddDataButton metric={addMetric} />}
    </div>
    <HealthSubRouteLinks />
  </header>
);
