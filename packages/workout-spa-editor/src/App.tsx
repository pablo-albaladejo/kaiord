import { useEffect } from "react";
import { useLocation } from "wouter";

import { AppRoutes } from "./AppRoutes";
import { AppKeyboardShortcuts } from "./components/AppKeyboardShortcuts";
import { MigrationBoot } from "./components/MigrationBoot";
import { AppToastProvider } from "./components/providers/AppToastProvider";
import { MainLayout } from "./components/templates/MainLayout";
import { useAnalytics } from "./contexts";
import { useProfileSnapshotPush } from "./hooks/use-profile-snapshot-push";
import { useStoreHydration } from "./hooks/use-store-hydration";
import { useSyncAutoPush } from "./hooks/use-sync-auto-push";

function App() {
  useStoreHydration();
  useProfileSnapshotPush();
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
      <AppKeyboardShortcuts />
      <MainLayout>
        <AppRoutes analytics={analytics} />
      </MainLayout>
    </AppToastProvider>
  );
}

export default App;
