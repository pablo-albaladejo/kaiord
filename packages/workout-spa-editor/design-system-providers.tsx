// The provider chain a component needs to render outside the app.
//
// The design-system card harness mounts a compiled component directly from
// `window.KaiordDesignSystem`, without Storybook's preview decorators. Anything
// reaching for theme, copy, units, bridge state, toast or a route therefore
// throws "must be used within a Provider" and the card renders empty.
//
// `cfg.provider` in .design-sync/config.json can name components and pass
// literal props, but a `Router` needs a hook and JSON cannot express one.
// Bundling the chain behind a single component is what makes it expressible.
//
// Deliberately NOT here: `PersistenceProvider` and `SyncProvider`. Both need a
// runtime port, and building one opens Dexie and starts a sync engine — side
// effects that threw inside the card harness and took every one of the 85 cards
// down with them, including atoms that had rendered fine without any of this. A
// component that genuinely needs persistence gets an owned preview under
// `.design-sync/previews/` instead, where the cost is one card, not all of them.

import { type ReactNode, useMemo } from "react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { GarminBridgeProvider } from "./src/contexts/garmin-bridge-context";
import { ThemeProvider } from "./src/contexts/ThemeContext";
import { ToastContextProvider } from "./src/contexts/ToastContext";
import { UnitsProvider } from "./src/contexts/units-context";
import { LocaleProvider } from "./src/i18n/LocaleProvider";

export const DesignSystemProviders = ({
  children,
}: {
  children: ReactNode;
}) => {
  // Navigation stays inside the card rather than moving the host frame. Built
  // on first render, not at module scope, so importing the bundle is inert.
  const { hook } = useMemo(() => memoryLocation({ path: "/" }), []);
  return (
    <ThemeProvider defaultTheme="light">
      <ToastContextProvider>
        <LocaleProvider>
          <UnitsProvider>
            <GarminBridgeProvider>
              <Router hook={hook}>{children}</Router>
            </GarminBridgeProvider>
          </UnitsProvider>
        </LocaleProvider>
      </ToastContextProvider>
    </ThemeProvider>
  );
};
