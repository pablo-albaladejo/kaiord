/**
 * useTrain2GoSource — factory-hook tests.
 *
 * The hook is parameterized by (activeProfileId, days). Activities come
 * from a useLiveQuery over coachingActivities; sync/expand/connect
 * delegate to application use cases. Tests mock the use cases and the
 * persistence context to keep the surface focused.
 */

import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PersistenceProvider } from "../../contexts/persistence-context";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";

const mockSync = vi.fn(async () => ({
  ok: true as const,
  activityCount: 0,
  orphansDeleted: 0,
}));
const mockExpand = vi.fn(async () => ({ ok: true as const, activityCount: 0 }));
const mockAttempt = vi.fn(async () => ({ ok: true as const }));

vi.mock("../../application/coaching/sync-week", () => ({
  syncWeek: (...args: unknown[]) => mockSync(...args),
}));
vi.mock("../../application/coaching/expand-day", () => ({
  expandDay: (...args: unknown[]) => mockExpand(...args),
}));
vi.mock("../../application/coaching/attempt-link", () => ({
  attemptLink: (...args: unknown[]) => mockAttempt(...args),
}));

// Make useLiveQuery actually invoke the supplied query so the persisted
// coaching read path is exercised (per CodeRabbit — a constant [] would
// bypass the adapter's profile/week scoping coverage). For Promise-returning
// queries we surface `undefined` (matching dexie-react-hooks' pre-resolution
// behavior); the assertion in the test that expects an empty array does so
// against a fresh in-memory store, which yields [] synchronously here.
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: (fn: () => unknown) => {
    try {
      const r = fn();
      return r instanceof Promise ? undefined : r;
    } catch {
      return undefined;
    }
  },
}));

vi.mock("../../store/train2go-store", () => ({
  useTrain2GoStore: () => ({
    extensionInstalled: true,
    sessionActive: true,
    loading: false,
    lastError: null,
    lastDetectionTimestamp: null,
    detectExtension: vi.fn(),
    openTrain2Go: vi.fn(),
  }),
}));

vi.mock("../bridge/bridge-discovery", () => ({
  bridgeDiscovery: {
    getExtensionId: () => "ext-id",
  },
}));

import { useTrain2GoSource } from "./use-train2go-source";

const wrap = (children: ReactNode) => (
  <PersistenceProvider persistence={createInMemoryPersistence()}>
    {children}
  </PersistenceProvider>
);

describe("useTrain2GoSource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a CoachingSource with the expected static fields", () => {
    const { result } = renderHook(
      () => useTrain2GoSource("p1", ["2026-04-13"]),
      {
        wrapper: ({ children }) => wrap(children),
      }
    );

    expect(result.current.id).toBe("train2go");
    expect(result.current.label).toBe("Train2Go");
    expect(result.current.badge).toBe("T2G");
    expect(result.current.available).toBe(true);
    expect(result.current.connected).toBe(true);
  });

  it("returns empty activities when the live-query yields []", () => {
    const { result } = renderHook(
      () => useTrain2GoSource("p1", ["2026-04-13"]),
      {
        wrapper: ({ children }) => wrap(children),
      }
    );

    expect(result.current.activities).toEqual([]);
  });

  it("sync(profileId, weekStart) delegates to syncWeek use case", async () => {
    const { result } = renderHook(
      () => useTrain2GoSource("p1", ["2026-04-13"]),
      {
        wrapper: ({ children }) => wrap(children),
      }
    );

    await result.current.sync("p1", "2026-04-13");

    expect(mockSync).toHaveBeenCalledTimes(1);
    expect(mockSync.mock.calls[0]?.[1]).toBe("p1");
    expect(mockSync.mock.calls[0]?.[2]).toBe("2026-04-13");
  });

  it("expand(profileId, date) delegates to expandDay use case", async () => {
    const { result } = renderHook(
      () => useTrain2GoSource("p1", ["2026-04-13"]),
      {
        wrapper: ({ children }) => wrap(children),
      }
    );

    await result.current.expand("p1", "2026-04-13");

    expect(mockExpand).toHaveBeenCalledTimes(1);
    expect(mockExpand.mock.calls[0]?.[1]).toBe("p1");
    expect(mockExpand.mock.calls[0]?.[2]).toBe("2026-04-13");
  });

  it("connect(profileId) delegates to attemptLink with an AbortSignal", async () => {
    const { result } = renderHook(
      () => useTrain2GoSource("p1", ["2026-04-13"]),
      {
        wrapper: ({ children }) => wrap(children),
      }
    );

    await result.current.connect("p1");

    expect(mockAttempt).toHaveBeenCalledTimes(1);
    expect(mockAttempt.mock.calls[0]?.[1]).toBe("p1");
    const signal = mockAttempt.mock.calls[0]?.[2] as AbortSignal | undefined;
    expect(signal).toBeInstanceOf(AbortSignal);
  });
});
