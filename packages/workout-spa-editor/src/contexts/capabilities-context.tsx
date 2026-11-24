import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

import { setCapability } from "../application/capabilities/set-capability";
import {
  type Capabilities,
  type CapabilityStore,
  createFixedCapabilityStore,
  createLiveCapabilityStore,
} from "../hooks/capabilities/capability-store";
import { observeCapabilityInputs } from "../hooks/use-capability-inputs-live";
import type { CapabilityId } from "../lib/capabilities/capability-catalogue";
import { usePersistence } from "./persistence-context";

export type { Capabilities } from "../hooks/capabilities/capability-store";

/**
 * The read API every screen, route, settings section, Tool and link goes
 * through before showing a Capability's surface
 * (`scripts/check-capability-surfaces.mjs` holds the line). The context
 * carries a handle, never the athlete's data: the decisions are read live
 * from Dexie and written through the `PersistencePort`.
 */
const CapabilitiesContext = createContext<CapabilityStore | null>(null);

export function CapabilitiesProvider({ children }: { children: ReactNode }) {
  const persistence = usePersistence();
  const store = useMemo(
    () =>
      createLiveCapabilityStore(
        () => observeCapabilityInputs(),
        (profileId, id, on) =>
          setCapability(
            { profileId, id, on },
            { ...persistence, clock: () => new Date().toISOString() }
          )
      ),
    [persistence]
  );
  return (
    <CapabilitiesContext.Provider value={store}>
      {children}
    </CapabilitiesContext.Provider>
  );
}

export const useCapabilities = (): Capabilities => {
  const store = useContext(CapabilitiesContext);
  if (!store) {
    throw new Error("useCapabilities must be used within CapabilitiesProvider");
  }
  return useSyncExternalStore(store.subscribe, store.get, store.get);
};

/** Fixed Capabilities for a story or a test that renders one surface. */
export function CapabilitiesFixture({
  on,
  loading = false,
  children,
}: {
  on: readonly CapabilityId[];
  loading?: boolean;
  children: ReactNode;
}) {
  const key = on.join(" ");
  const store = useMemo(
    () =>
      createFixedCapabilityStore(
        key === "" ? [] : (key.split(" ") as CapabilityId[]),
        loading
      ),
    [key, loading]
  );
  return (
    <CapabilitiesContext.Provider value={store}>
      {children}
    </CapabilitiesContext.Provider>
  );
}
