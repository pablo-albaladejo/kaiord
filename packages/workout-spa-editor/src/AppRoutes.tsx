import type { Analytics } from "@kaiord/core";
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
  WorkoutDetail,
} from "./lazy-pages";
import { NewWorkoutRoute } from "./new-workout-route";

export type AppRoutesProps = { analytics: Analytics };

export function AppRoutes({ analytics }: AppRoutesProps) {
  return (
    <Suspense fallback={<RouteSpinner />}>
      <Switch>
        <Route path="/">
          <Redirect to="/calendar" />
        </Route>
        <Route path="/calendar/:weekId?">
          <RouteErrorBoundary analytics={analytics}>
            <CalendarPage />
          </RouteErrorBoundary>
        </Route>
        <Route path="/athlete">
          <RouteErrorBoundary analytics={analytics}>
            <AthletePage />
          </RouteErrorBoundary>
        </Route>
        <Route path="/library">
          <RouteErrorBoundary analytics={analytics}>
            <LibraryPage />
          </RouteErrorBoundary>
        </Route>
        <Route path="/workout/new">
          <RouteErrorBoundary analytics={analytics}>
            <NewWorkoutRoute />
          </RouteErrorBoundary>
        </Route>
        <Route path="/workout/view/:id">
          {(params) => (
            <RouteErrorBoundary analytics={analytics}>
              <WorkoutDetail id={params.id} />
            </RouteErrorBoundary>
          )}
        </Route>
        <Route path="/workout/:id">
          {(params) => (
            <RouteErrorBoundary analytics={analytics}>
              <EditorPage id={params.id} />
            </RouteErrorBoundary>
          )}
        </Route>
        <Route path="/settings/profile">
          <Redirect to="/athlete" />
        </Route>
        <Route path="/settings/:tab?">
          <RouteErrorBoundary analytics={analytics}>
            <SettingsPage />
          </RouteErrorBoundary>
        </Route>
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
