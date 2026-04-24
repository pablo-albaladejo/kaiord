import { lazy, Suspense, useEffect } from "react";
import { Redirect, Route, Switch } from "wouter";

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

function AppRoutes() {
  return (
    <Suspense fallback={<RouteSpinner />}>
      <Switch>
        <Route path="/">
          <Redirect to="/calendar" />
        </Route>
        <Route path="/calendar/:weekId?">
          <RouteErrorBoundary>
            <CalendarPage />
          </RouteErrorBoundary>
        </Route>
        <Route path="/library">
          <RouteErrorBoundary>
            <LibraryPage />
          </RouteErrorBoundary>
        </Route>
        <Route path="/workout/new">
          <RouteErrorBoundary>
            <EditorPage />
          </RouteErrorBoundary>
        </Route>
        <Route path="/workout/:id">
          {(params) => (
            <RouteErrorBoundary>
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

  useEffect(() => {
    analytics.event("editor-loaded");
  }, [analytics]);

  return (
    <AppToastProvider>
      <AppKeyboardShortcuts />
      <MainLayout onReplayTutorial={() => setShowTutorial(true)}>
        <AppRoutes />
      </MainLayout>
      <AppTutorial show={showTutorial} onOpenChange={setShowTutorial} />
    </AppToastProvider>
  );
}

export default App;
