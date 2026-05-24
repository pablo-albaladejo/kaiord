/**
 * Health Hub sub-router.
 *
 * Mounted under a single `/health/:rest*` Route in AppRoutes so the
 * top-level route table stays small. Internal dispatch is by exact
 * pathname; unknown `/health/...` URLs fall through to null and the
 * AppRoutes catch-all redirect to /calendar takes over.
 */
import type { Analytics } from "@kaiord/core";
import { lazy } from "react";
import { useLocation } from "wouter";

import { RouteErrorBoundary } from "../../molecules/RouteErrorBoundary";

const HealthDashboardPage = lazy(() => import("./HealthDashboardPage"));
const HealthSleepPage = lazy(() => import("./HealthSleepPage"));
const HealthWeightPage = lazy(() => import("./HealthWeightPage"));
const HealthRecoveryPage = lazy(() => import("./HealthRecoveryPage"));
const HealthActivityPage = lazy(() => import("./HealthActivityPage"));

const renderFor = (pathname: string) => {
  if (pathname === "/health" || pathname === "/health/")
    return <HealthDashboardPage />;
  if (pathname === "/health/sleep") return <HealthSleepPage />;
  if (pathname === "/health/weight") return <HealthWeightPage />;
  if (pathname === "/health/recovery") return <HealthRecoveryPage />;
  if (pathname === "/health/activity") return <HealthActivityPage />;
  return null;
};

type HealthSubRouterProps = { analytics: Analytics };

export function HealthSubRouter({ analytics }: HealthSubRouterProps) {
  const [pathname] = useLocation();
  const page = renderFor(pathname);
  if (!page) return null;
  return <RouteErrorBoundary analytics={analytics}>{page}</RouteErrorBoundary>;
}
