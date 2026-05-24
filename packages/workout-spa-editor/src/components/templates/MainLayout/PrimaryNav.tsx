/**
 * PrimaryNav — top-level Training / Health / Settings navigation.
 *
 * See PRIMARY_NAV_DECISION.md for the tab-bar-over-sidebar rationale.
 * Uses semantic `<nav>` + `<a>` links (no APG tab pattern) — the
 * destinations are pages, not tab panels, so role="tablist"/"tab"
 * would oversell the semantics without delivering keyboard arrow
 * navigation. The active tab is rendered as a non-link `<span>` with
 * `aria-current="page"`, which naturally no-ops re-clicks.
 */
import { Link, useLocation } from "wouter";

type TabDef = {
  id: "training" | "health" | "settings";
  label: string;
  to: string;
  isActive: (path: string) => boolean;
};

const TRAINING_PREFIXES = ["/calendar", "/library", "/workout"];

const TABS: ReadonlyArray<TabDef> = [
  {
    id: "training",
    label: "Training",
    to: "/calendar",
    isActive: (path) =>
      path === "/" || TRAINING_PREFIXES.some((p) => path.startsWith(p)),
  },
  {
    id: "health",
    label: "Health",
    to: "/health",
    isActive: (path) => path.startsWith("/health"),
  },
  {
    id: "settings",
    label: "Settings",
    to: "/settings/ai",
    isActive: (path) => path.startsWith("/settings"),
  },
];

const tabClass = (active: boolean): string =>
  [
    "flex-1 px-4 py-3 text-sm font-medium text-center border-b-2 transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    active
      ? "border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300"
      : "border-transparent text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100",
  ].join(" ");

export const PrimaryNav = () => {
  const [location] = useLocation();
  return (
    <nav
      aria-label="Primary navigation"
      className="mx-auto flex w-full max-w-7xl border-b border-gray-200 dark:border-slate-800"
      data-testid="primary-nav"
    >
      {TABS.map((tab) => {
        const active = tab.isActive(location);
        return active ? (
          <span
            key={tab.id}
            aria-current="page"
            data-testid={`primary-nav-${tab.id}`}
            className={tabClass(true)}
          >
            {tab.label}
          </span>
        ) : (
          <Link
            key={tab.id}
            href={tab.to}
            data-testid={`primary-nav-${tab.id}`}
            className={tabClass(false)}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};
