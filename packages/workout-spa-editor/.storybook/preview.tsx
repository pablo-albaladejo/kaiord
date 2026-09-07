import type { Preview } from "@storybook/react-vite";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { GarminBridgeProvider } from "../src/contexts/garmin-bridge-context";
import { PersistenceProvider } from "../src/contexts/persistence-context";
import { SyncProvider } from "../src/contexts/sync-context";
import { ThemeProvider } from "../src/contexts/ThemeContext";
import { ToastContextProvider } from "../src/contexts/ToastContext";
import { UnitsProvider } from "../src/contexts/units-context";
import { LocaleProvider } from "../src/i18n/LocaleProvider";
import { createAppPersistence } from "../src/adapters/create-app-persistence";
import { createDexieSnapshotPort } from "../src/adapters/dexie/dexie-snapshot-port";
import { db } from "../src/adapters/dexie/dexie-database";
import { createGoogleDriveCloudSync } from "../src/adapters/cloud-sync/google-drive-cloud-sync-adapter";
import "../src/index.css";

// The real ports over the real Dexie schema, exactly as main.tsx builds them. A
// story browser has IndexedDB, so this resolves to an empty database rather
// than to a fake — which is the honest first-run state, and the one a component
// has to handle anyway. The cloud port stays disconnected without credentials,
// which is likewise the real signed-out state rather than a stub.
const persistence = createAppPersistence(db);
const cloudSync = createGoogleDriveCloudSync();
const snapshotPort = createDexieSnapshotPort(db);

const preview: Preview = {
  // Global providers. Without these, any component reaching for theme, copy,
  // units or bridge state renders only if its own story remembers to wrap it —
  // and most do not, so they threw "must be used within a Provider" and
  // storybook showed an empty root. Stories that wrap themselves still work:
  // the inner provider wins for its own subtree.
  decorators: [
    (Story, context) => {
      // A component reading `useLocation` needs a Router above it or it throws.
      // `memoryLocation` keeps navigation inside the story, so clicking a link
      // never moves the whole Storybook frame. A story sets its own path with
      // `parameters: { route: "/library" }` — that is how a nav highlights the
      // tab it is meant to be showing as active.
      const { hook } = memoryLocation({
        path: (context.parameters.route as string | undefined) ?? "/",
      });
      return (
        <PersistenceProvider persistence={persistence}>
          <SyncProvider
            cloud={cloudSync}
            snapshotPort={snapshotPort}
            deviceId="storybook"
          >
            <ThemeProvider defaultTheme="light">
              <ToastContextProvider>
                <LocaleProvider>
                  <UnitsProvider>
                    <GarminBridgeProvider>
                      <Router hook={hook}>
                        <Story />
                      </Router>
                    </GarminBridgeProvider>
                  </UnitsProvider>
                </LocaleProvider>
              </ToastContextProvider>
            </ThemeProvider>
          </SyncProvider>
        </PersistenceProvider>
      );
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        {
          name: "light",
          value: "#ffffff",
        },
        {
          name: "dark",
          value: "#0f172a",
        },
      ],
    },
  },
};

export default preview;
