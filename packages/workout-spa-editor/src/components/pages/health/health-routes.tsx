/**
 * Health Hub sub-router.
 *
 * Mounted under a single `/health/*?` Route in AppRoutes so the
 * top-level route table stays small. Internal dispatch is by
 * normalised pathname (trailing-slash tolerant); unknown
 * `/health/...` URLs redirect to the Health dashboard.
 */
import type { Analytics } from "@kaiord/core";
import { lazy } from "react";
import { Redirect, useLocation } from "wouter";

import { RouteErrorBoundary } from "../../molecules/RouteErrorBoundary";

const HealthDashboardPage = lazy(() => import("./HealthDashboardPage"));
const HealthSleepPage = lazy(() => import("./HealthSleepPage"));
const HealthWeightPage = lazy(() => import("./HealthWeightPage"));
const HealthRecoveryPage = lazy(() => import("./HealthRecoveryPage"));
const HealthActivityPage = lazy(() => import("./HealthActivityPage"));

const normalize = (pathname: string): string =>
  pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;

const renderFor = (pathname: string) => {
  const path = normalize(pathname);
  if (path === "/health") return <HealthDashboardPage />;
  if (path === "/health/sleep") return <HealthSleepPage />;
  if (path === "/health/weight") return <HealthWeightPage />;
  if (path === "/health/recovery") return <HealthRecoveryPage />;
  if (path === "/health/activity") return <HealthActivityPage />;
  return null;
};

type HealthSubRouterProps = { analytics: Analytics };

export function HealthSubRouter({ analytics }: HealthSubRouterProps) {
  const [pathname] = useLocation();
  const page = renderFor(pathname);
  if (!page) return <Redirect to="/health" />;
  return <RouteErrorBoundary analytics={analytics}>{page}</RouteErrorBoundary>;
}
