import type { Analytics } from "@kaiord/core";
import { lazy, Suspense, useEffect } from "react";
import { Redirect, Route, Switch, useLocation } from "wouter";

import { AppKeyboardShortcuts } from "./components/AppKeyboardShortcuts";
import { AppTutorial } from "./components/AppTutorial";
import { RouteSpinner } from "./components/atoms/RouteSpinner";
import { RouteErrorBoundary } from "./components/molecules/RouteErrorBoundary";
import { AppToastProvider } from "./components/providers/AppToastProvider";
import { MainLayout } from "./components/templates/MainLayout";
import { useAnalytics } from "./contexts";
import { useOnboardingTutorial } from "./hooks/use-onboarding-tutorial";
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
  const { showTutorial, setShowTutorial } = useOnboardingTutorial();
  const analytics = useAnalytics();
  const [path] = useLocation();

  useEffect(() => {
    analytics.event("editor-loaded");
  }, [analytics]);

  // Fire pageView on initial mount and on every wouter route change
  // so that SPA navigations are recorded in Cloudflare Web Analytics.
  useEffect(() => {
    analytics.pageView(path);
  }, [analytics, path]);

  return (
    <AppToastProvider>
      <AppKeyboardShortcuts />
      <MainLayout onReplayTutorial={() => setShowTutorial(true)}>
        <AppRoutes analytics={analytics} />
      </MainLayout>
      <AppTutorial show={showTutorial} onOpenChange={setShowTutorial} />
    </AppToastProvider>
  );
}

export default App;
