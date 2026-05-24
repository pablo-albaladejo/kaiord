/**
 * PrimaryNav — top-level Training / Health / Settings tab bar.
 *
 * See PRIMARY_NAV_DECISION.md for the tab-bar-over-sidebar rationale.
 * Re-clicking the active tab is a no-op (no extra history entry, no
 * scroll reset). The Settings tab routes to `/settings/ai` to match
 * the existing header settings button.
 */
import { useLocation } from "wouter";

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
    "flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    active
      ? "border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300"
      : "border-transparent text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100",
  ].join(" ");

export const PrimaryNav = () => {
  const [location, navigate] = useLocation();
  return (
    <nav
      role="tablist"
      aria-label="Primary navigation"
      className="mx-auto flex w-full max-w-7xl border-b border-gray-200 dark:border-slate-800"
      data-testid="primary-nav"
    >
      {TABS.map((tab) => {
        const active = tab.isActive(location);
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-current={active ? "page" : undefined}
            data-testid={`primary-nav-${tab.id}`}
            onClick={() => {
              if (!active) navigate(tab.to);
            }}
            className={tabClass(active)}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
};
