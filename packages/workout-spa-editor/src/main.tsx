import "./index.css";

import { createRoot } from "react-dom/client";

import { createUmamiAnalytics } from "./adapters/analytics/umami-analytics";
import { createLazyCloudSync } from "./adapters/cloud-sync/lazy-cloud-sync";
import { createAppPersistence } from "./adapters/create-app-persistence";
import { registerDefaultProfileBoot } from "./adapters/dexie/default-profile-boot";
import { db, DECLARED_VERNO } from "./adapters/dexie/dexie-database";
import { createDexieSnapshotPort } from "./adapters/dexie/dexie-snapshot-port";
import { probeSchema } from "./adapters/dexie/schema-probe";
import { runMatchDatesHeal } from "./application/coaching/run-match-dates-heal";
import { AppRoot } from "./AppRoot";
import { renderStaleBoot } from "./boot/render-stale-boot";
import { startApp } from "./boot/start-app";
import { defaultProfileName } from "./i18n/default-profile-name";
import { reloadOnceForChunkError } from "./lib/chunk-reload";
import { getUmamiWebsiteId } from "./lib/runtime-config";

// Recover from stale lazy chunks after a deploy: Vite fires `vite:preloadError`
// when a hashed chunk can no longer be fetched; reload once to pull the fresh
// build (loop-guarded). See `lib/chunk-reload`.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  reloadOnceForChunkError();
});

const analytics = createUmamiAnalytics(getUmamiWebsiteId());

const persistence = createAppPersistence(db);

// First-run default profile, created before the database serves any other
// operation (see `adapters/dexie/default-profile-boot`).
registerDefaultProfileBoot(db, persistence, () =>
  defaultProfileName(navigator.language)
);

// Drive + encryption load on first sync use, outside the initial JS.
const cloudSync = createLazyCloudSync(() =>
  import("./adapters/cloud-sync/create-app-cloud-sync").then((m) =>
    m.createAppCloudSync()
  )
);
const snapshotPort = createDexieSnapshotPort(db);

// Every cloud or backup import may bring a match torn from its workout's
// date (design §3.5): heal all profiles once it lands.
const healMatchDatesAfterImport = () =>
  runMatchDatesHeal(persistence, analytics, "all-profiles");

const root = createRoot(document.getElementById("root")!);

// Nothing above opens the database; the first open is `startApp`'s, after
// the probe has ruled out a schema newer than this code.
void startApp({
  probe: () => probeSchema(db.name, DECLARED_VERNO),
  openDb: () => db.open(),
  closeDb: () => db.close({ disableAutoOpen: true }),
  renderStale: () => renderStaleBoot(root),
  renderApp: () =>
    root.render(
      <AppRoot
        analytics={analytics}
        persistence={persistence}
        cloudSync={cloudSync}
        snapshotPort={snapshotPort}
        afterImport={healMatchDatesAfterImport}
      />
    ),
});
