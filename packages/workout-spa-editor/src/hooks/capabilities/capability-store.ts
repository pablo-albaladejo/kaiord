import type { Observable } from "dexie";

import type { CapabilityId } from "../../lib/capabilities/capability-catalogue";
import {
  type ActiveCapabilities,
  NO_CAPABILITIES,
  resolveCapabilities,
} from "../../lib/capabilities/resolve-capabilities";
import type { CapabilityInputsLive } from "../use-capability-inputs-live";

/** What every screen, route, settings section, Tool and link reads. */
export type Capabilities = ActiveCapabilities & {
  /** `loading` until the athlete's decisions are read: show nothing yet. */
  status: "loading" | "ready";
  /** Records one decision for the active athlete; data is never touched. */
  set: (id: CapabilityId, on: boolean) => Promise<void>;
};

/** A handle on the Capabilities, carried by the context: no data in it. */
export type CapabilityStore = {
  subscribe: (listener: () => void) => () => void;
  get: () => Capabilities;
};

type Write = (
  profileId: string,
  id: CapabilityId,
  on: boolean
) => Promise<void>;

const LOADING: Capabilities = {
  ...NO_CAPABILITIES,
  status: "loading",
  set: async () => {},
};

/**
 * One live read shared by every reader: subscribed while anyone reads, the
 * last answer kept, so a screen mounted later never starts from "loading".
 */
export const createLiveCapabilityStore = (
  observe: () => Observable<CapabilityInputsLive>,
  write: Write
): CapabilityStore => {
  let current = LOADING;
  const listeners = new Set<() => void>();
  let stop: (() => void) | undefined;
  const publish = ({ profileId, inputs }: CapabilityInputsLive) => {
    current = {
      ...resolveCapabilities(inputs),
      status: "ready",
      set: (id, on) =>
        profileId === null ? Promise.resolve() : write(profileId, id, on),
    };
    listeners.forEach((listener) => listener());
  };
  return {
    get: () => current,
    subscribe: (listener) => {
      listeners.add(listener);
      stop ??= (() => {
        const sub = observe().subscribe({ next: publish });
        return () => sub.unsubscribe();
      })();
      return () => {
        listeners.delete(listener);
        if (listeners.size > 0) return;
        stop?.();
        stop = undefined;
      };
    },
  };
};

/** Fixed Capabilities for a story or a test that renders one surface. */
export const createFixedCapabilityStore = (
  on: readonly CapabilityId[],
  loading = false
): CapabilityStore => {
  const decisions = Object.fromEntries(on.map((id) => [id, true]));
  const fixed: Capabilities = {
    ...resolveCapabilities({ decisions, withData: new Set() }),
    status: loading ? "loading" : "ready",
    set: async () => {},
  };
  return { get: () => fixed, subscribe: () => () => {} };
};
