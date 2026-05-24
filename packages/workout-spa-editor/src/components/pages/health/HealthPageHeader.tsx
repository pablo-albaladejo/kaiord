/**
 * Shared header for /health/* pages.
 *
 * Renders an `<h1>` marked with `data-route-heading` + `tabIndex={-1}`
 * so the focus-on-route-change hook can move focus on navigation.
 * Optional subtitle is rendered as a muted `<p>` below the title.
 */
import { ROUTE_HEADING_ATTR } from "../../../routing/constants";

type HealthPageHeaderProps = {
  title: string;
  subtitle?: string;
};

export const HealthPageHeader = ({
  title,
  subtitle,
}: HealthPageHeaderProps) => (
  <header className="mb-6">
    <h1
      tabIndex={-1}
      {...{ [ROUTE_HEADING_ATTR]: "" }}
      className="text-xl font-semibold text-gray-900 dark:text-white"
    >
      {title}
    </h1>
    {subtitle && (
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {subtitle}
      </p>
    )}
  </header>
);
