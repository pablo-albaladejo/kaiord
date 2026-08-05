import { Link, useLocation } from "wouter";

import { useTranslate } from "../../../i18n/use-translate";
import { HEALTH_SUB_ROUTES, isCurrentHealthRoute } from "./health-sub-routes";

const baseClass =
  "flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors";
const currentClass = "bg-accent text-surface";
const otherClass = "text-ink-muted hover:text-ink-strong";

/**
 * The strip every `/health/*` page carries. All six routes are listed — a page
 * reachable only by typing its URL is not discoverable — and the current one
 * keeps its href while carrying `aria-current`, so tab order does not shift
 * between routes.
 */
export function HealthSubRouteLinks() {
  const t = useTranslate("health");
  const [pathname] = useLocation();
  return (
    <nav
      data-testid="health-sub-route-links"
      aria-label={t("nav.ariaLabel")}
      className="flex gap-1 overflow-x-auto rounded-xl border border-edge bg-surface-deep p-1"
    >
      {HEALTH_SUB_ROUTES.map((route) => {
        const current = isCurrentHealthRoute(route, pathname);
        return (
          <Link
            key={route.id}
            href={route.href}
            aria-current={current ? "page" : undefined}
            className={`${baseClass} ${current ? currentClass : otherClass}`}
          >
            {t(route.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
