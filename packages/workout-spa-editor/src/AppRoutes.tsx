import type { Analytics } from "@kaiord/core";
import { lazy, Suspense } from "react";
import { Redirect, Route, Switch } from "wouter";

import { RouteSpinner } from "./components/atoms/RouteSpinner";
import { RouteErrorBoundary } from "./components/molecules/RouteErrorBoundary";

const CalendarPage = lazy(() => import("./components/pages/CalendarPage"));
const LibraryPage = lazy(() => import("./components/pages/LibraryPage"));
const EditorPage = lazy(() => import("./components/pages/EditorPage"));
const SettingsPage = lazy(() => import("./components/pages/SettingsPage"));

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
        <Route path="/library">
          <RouteErrorBoundary analytics={analytics}>
            <LibraryPage />
          </RouteErrorBoundary>
        </Route>
        <Route path="/workout/new">
          <RouteErrorBoundary analytics={analytics}>
            <EditorPage />
          </RouteErrorBoundary>
        </Route>
        <Route path="/workout/:id">
          {(params) => (
            <RouteErrorBoundary analytics={analytics}>
              <EditorPage id={params.id} />
            </RouteErrorBoundary>
          )}
        </Route>
        <Route path="/settings/:tab?">
          <RouteErrorBoundary analytics={analytics}>
            <SettingsPage />
          </RouteErrorBoundary>
        </Route>
        <Route>
          <Redirect to="/calendar" />
        </Route>
      </Switch>
    </Suspense>
  );
}
