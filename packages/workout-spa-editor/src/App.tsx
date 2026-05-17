import { useEffect } from "react";
import { useLocation } from "wouter";

import { AppRoutes } from "./AppRoutes";
import { AppKeyboardShortcuts } from "./components/AppKeyboardShortcuts";
import { AppTutorial } from "./components/AppTutorial";
import { MigrationBoot } from "./components/MigrationBoot";
import { AppToastProvider } from "./components/providers/AppToastProvider";
import { MainLayout } from "./components/templates/MainLayout";
import { useAnalytics } from "./contexts";
import { useOnboardingTutorial } from "./hooks/use-onboarding-tutorial";
import { useProfileSnapshotPush } from "./hooks/use-profile-snapshot-push";
import { useStoreHydration } from "./hooks/use-store-hydration";

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
