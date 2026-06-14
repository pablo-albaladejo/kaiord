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
  ChatPage,
  DailyPage,
  EditorPage,
  LibraryPage,
  SettingsPage,
  WorkoutDetail,
} from "./lazy-pages";
import { NewWorkoutRoute } from "./new-workout-route";
import { LegacyTodayRedirect } from "./routing/legacy-today-redirect";
import { getCurrentWeekId } from "./utils/week-utils";

export type AppRoutesProps = { analytics: Analytics };

export function AppRoutes({ analytics }: AppRoutesProps) {
  const guard = (node: ReactNode) => (
    <RouteErrorBoundary analytics={analytics}>{node}</RouteErrorBoundary>
  );

  return (
    <Suspense fallback={<RouteSpinner />}>
      <Switch>
        <Route path="/">
          {/* Default view: the current week's calendar (1-hop). */}
          <Redirect to={`/calendar/${getCurrentWeekId()}`} replace />
        </Route>
        <Route path="/daily">{guard(<DailyPage />)}</Route>
        {/* Legacy alias: the page was renamed /today → /daily; preserve ?date=. */}
        <Route path="/today">
          <LegacyTodayRedirect />
        </Route>
        {/* Bare /calendar is intentionally a non-durable alias for the
            CURRENT week: one URL family, one view (consensus plan, ADR).
            `replace` avoids a back-button re-bounce trap. */}
        <Route path="/calendar">
          <Redirect to={`/calendar/${getCurrentWeekId()}`} replace />
        </Route>
        <Route path="/calendar/:weekId">{guard(<CalendarPage />)}</Route>
        <Route path="/athlete">{guard(<AthletePage />)}</Route>
        <Route path="/chat">{guard(<ChatPage />)}</Route>
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
          {/* Unknown routes settle on the default view (calendar). */}
          <Redirect to={`/calendar/${getCurrentWeekId()}`} replace />
        </Route>
      </Switch>
    </Suspense>
  );
}
