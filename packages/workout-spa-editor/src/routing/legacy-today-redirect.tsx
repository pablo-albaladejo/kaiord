/**
 * Back-compat: the page route was renamed `/today` → `/daily` (the page concept
 * became "Daily"). This redirects shipped `/today` and `/today?date=` deep links
 * (and the `?from=today` editor Back target) to `/daily`, PRESERVING the query —
 * wouter's `<Redirect>` drops the search, so a query-aware redirect is needed.
 * Shipped in #731/#734; retained for in-flight links. Safe to remove once those
 * links have aged out.
 */
import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";

export function LegacyTodayRedirect() {
  const search = useSearch();
  const [, navigate] = useLocation();

  useEffect(() => {
    navigate(`/daily${search ? `?${search}` : ""}`, { replace: true });
  }, [search, navigate]);

  return null;
}
