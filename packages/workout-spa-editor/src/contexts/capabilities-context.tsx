import { createContext, type ReactNode, useContext, useMemo } from "react";

import { db } from "../adapters/dexie/dexie-database";
import { createDexiePersistence } from "../adapters/dexie/dexie-persistence-adapter";
import { createDexieUserPreferencesRepository } from "../adapters/dexie/dexie-user-preferences-repository";
import { setCapability } from "../application/capabilities/set-capability";
import { useCapabilityInputsLive } from "../hooks/use-capability-inputs-live";
import {
  type ActiveCapabilities,
  NO_CAPABILITIES,
  resolveCapabilities,
} from "../lib/capabilities/resolve-capabilities";

/**
 * The read API every screen, route, settings section, command, shortcut,
 * Tool and link goes through before showing a Capability's surface
 * (`scripts/check-capability-surfaces.mjs` holds the line).
 */
export type Capabilities = ActiveCapabilities & {
  /** `loading` until the athlete's decisions are read: show nothing yet. */
  status: "loading" | "ready";
  /** Records one decision for the active athlete; data is never touched. */
  set: (id: string, on: boolean) => Promise<void>;
};

const OUTSIDE_PROVIDER: Capabilities = {
  ...NO_CAPABILITIES,
  status: "ready",
  set: async () => {},
};

const CapabilitiesContext = createContext<Capabilities>(OUTSIDE_PROVIDER);

const writeDecision = async (profileId: string, id: string, on: boolean) =>
  setCapability(
    { profileId, id, on },
    {
      clock: () => new Date().toISOString(),
      repository: createDexieUserPreferencesRepository(db),
      profileRepository: createDexiePersistence(db).profiles,
    }
  );

export function CapabilitiesProvider({ children }: { children: ReactNode }) {
  const live = useCapabilityInputsLive();
  const value = useMemo<Capabilities>(() => {
    if (live === undefined) {
      return { ...OUTSIDE_PROVIDER, status: "loading" };
    }
    const { profileId } = live;
    return {
      ...resolveCapabilities(live.inputs),
      status: "ready",
      set: async (id, on) => {
        if (profileId !== null) await writeDecision(profileId, id, on);
      },
    };
  }, [live]);
  return (
    <CapabilitiesContext.Provider value={value}>
      {children}
    </CapabilitiesContext.Provider>
  );
}

/** Outside a provider every Capability reads as off. */
export const useCapabilities = (): Capabilities =>
  useContext(CapabilitiesContext);

/** Fixed Capabilities for a story or a test that renders one surface. */
export function CapabilitiesFixture({
  on,
  loading = false,
  children,
}: {
  on: readonly string[];
  loading?: boolean;
  children: ReactNode;
}) {
  const decisions = Object.fromEntries(on.map((id) => [id, true]));
  const value: Capabilities = {
    ...resolveCapabilities({ decisions, withData: new Set() }),
    status: loading ? "loading" : "ready",
    set: async () => {},
  };
  return (
    <CapabilitiesContext.Provider value={value}>
      {children}
    </CapabilitiesContext.Provider>
  );
}
