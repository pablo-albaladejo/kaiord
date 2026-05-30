import type { Analytics } from "@kaiord/core";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Redirect, Route, Switch } from "wouter";

import { RouteSpinner } from "./components/atoms/RouteSpinner";
import { RouteErrorBoundary } from "./components/molecules/RouteErrorBoundary";
import { HealthSubRouter } from "./components/pages/health/health-routes";
import {
  AthletePage,
  CalendarPage,
  EditorPage,
  LibraryPage,
  SettingsPage,
  TodayPage,
  WorkoutDetail,
} from "./lazy-pages";
import { NewWorkoutRoute } from "./new-workout-route";

export type AppRoutesProps = { analytics: Analytics };

export function AppRoutes({ analytics }: AppRoutesProps) {
  const guard = (node: ReactNode) => (
    <RouteErrorBoundary analytics={analytics}>{node}</RouteErrorBoundary>
  );

  return (
    <Suspense fallback={<RouteSpinner />}>
      <Switch>
        <Route path="/">
          <Redirect to="/calendar" />
        </Route>
        <Route path="/calendar">{guard(<TodayPage />)}</Route>
        <Route path="/calendar/:weekId">{guard(<CalendarPage />)}</Route>
        <Route path="/athlete">{guard(<AthletePage />)}</Route>
        <Route path="/library">{guard(<LibraryPage />)}</Route>
        <Route path="/workout/new">{guard(<NewWorkoutRoute />)}</Route>
        <Route path="/workout/view/:id">
          {(params) => guard(<WorkoutDetail id={params.id} />)}
        </Route>
        <Route path="/workout/:id">
          {(params) => guard(<EditorPage id={params.id} />)}
        </Route>
        <Route path="/settings/profile">
          <Redirect to="/athlete" />
        </Route>
        <Route path="/settings/:tab?">{guard(<SettingsPage />)}</Route>
        <Route path="/health/*?">
          <HealthSubRouter analytics={analytics} />
        </Route>
        <Route>
          <Redirect to="/calendar" />
        </Route>
      </Switch>
    </Suspense>
  );
}
