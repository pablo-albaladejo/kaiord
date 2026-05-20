import type { Analytics } from "@kaiord/core";
import { lazy, Suspense } from "react";
import { Redirect, Route, Switch, useSearch } from "wouter";

import { RouteSpinner } from "./components/atoms/RouteSpinner";
import { RouteErrorBoundary } from "./components/molecules/RouteErrorBoundary";

const CalendarPage = lazy(() => import("./components/pages/CalendarPage"));
const LibraryPage = lazy(() => import("./components/pages/LibraryPage"));
const EditorPage = lazy(() => import("./components/pages/EditorPage"));
const NewWorkoutPicker = lazy(
  () => import("./components/pages/NewWorkoutPicker")
);
const SettingsPage = lazy(
  () => import("./components/pages/SettingsPage/SettingsPage")
);

function NewWorkoutRoute() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const hasAction = params.get("action") === "import";
  const hasSource = params.get("source") === "scratch";
  if (hasAction || hasSource) return <EditorPage />;
  return <NewWorkoutPicker />;
}

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
            <NewWorkoutRoute />
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
