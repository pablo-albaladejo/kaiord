import { Suspense, useEffect } from "react";
import { useLocation } from "wouter";

import { AppRoutes } from "./AppRoutes";
import { MigrationBoot } from "./components/MigrationBoot";
import { DefaultProfileNotice } from "./components/molecules/DefaultProfileNotice/DefaultProfileNotice";
import { ProfileChoiceBanner } from "./components/molecules/ProfileChoiceBanner/ProfileChoiceBanner";
import { SilentErrorBoundary } from "./components/molecules/SilentErrorBoundary";
import { AppToastProvider } from "./components/providers/AppToastProvider";
import { MainLayout } from "./components/templates/MainLayout";
import { useAnalytics } from "./contexts";
import { useBridgeThemePush } from "./hooks/use-bridge-theme-push";
import { useProfileSnapshotPush } from "./hooks/use-profile-snapshot-push";
import { useStoreHydration } from "./hooks/use-store-hydration";
import { useSyncAutoPush } from "./hooks/use-sync-auto-push";
import { AppKeyboardShortcuts } from "./lazy-pages";

function App() {
  useStoreHydration();
  useProfileSnapshotPush();
  useBridgeThemePush();
  useSyncAutoPush();
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
      <SilentErrorBoundary name="keyboard-shortcuts">
        <Suspense fallback={null}>
          <AppKeyboardShortcuts />
        </Suspense>
      </SilentErrorBoundary>
      <MainLayout>
        <ProfileChoiceBanner />
        <DefaultProfileNotice />
        <AppRoutes analytics={analytics} />
      </MainLayout>
    </AppToastProvider>
  );
}

export default App;
