import type { Analytics } from "@kaiord/core";
import { lazy, Suspense, useEffect } from "react";
import { Redirect, Route, Switch, useLocation } from "wouter";

import { AppKeyboardShortcuts } from "./components/AppKeyboardShortcuts";
import { AppTutorial } from "./components/AppTutorial";
import { RouteSpinner } from "./components/atoms/RouteSpinner";
import { MigrationBoot } from "./components/MigrationBoot";
import { RouteErrorBoundary } from "./components/molecules/RouteErrorBoundary";
import { AppToastProvider } from "./components/providers/AppToastProvider";
import { MainLayout } from "./components/templates/MainLayout";
import { useAnalytics } from "./contexts";
import { useOnboardingTutorial } from "./hooks/use-onboarding-tutorial";
import { useProfileSnapshotPush } from "./hooks/use-profile-snapshot-push";
import { useStoreHydration } from "./hooks/use-store-hydration";

const CalendarPage = lazy(() => import("./components/pages/CalendarPage"));
const LibraryPage = lazy(() => import("./components/pages/LibraryPage"));
const EditorPage = lazy(() => import("./components/pages/EditorPage"));

type AppRoutesProps = { analytics: Analytics };

function AppRoutes({ analytics }: AppRoutesProps) {
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
        <Route>
          <Redirect to="/calendar" />
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  useStoreHydration();
  useProfileSnapshotPush();
  const { showTutorial, setShowTutorial } = useOnboardingTutorial();
  const analytics = useAnalytics();
  const [path] = useLocation();

  useEffect(() => {
    analytics.event("editor-loaded");
  }, [analytics]);

  // Fire pageView on real routes only — skip redirect-only paths (/ and
  // catch-all) which never render content of their own.
  useEffect(() => {
    if (path !== "/") {
      analytics.pageView(path);
    }
  }, [analytics, path]);

  return (
    <AppToastProvider>
      <MigrationBoot />
      <AppKeyboardShortcuts />
      <MainLayout onReplayTutorial={() => setShowTutorial(true)}>
        <AppRoutes analytics={analytics} />
      </MainLayout>
      <AppTutorial show={showTutorial} onOpenChange={setShowTutorial} />
    </AppToastProvider>
  );
}

export default App;
