/**
 * `useConnectCallback` / `useSyncCallback` — zones-sync fan-out tests.
 *
 * Spec scenarios for §8: after a successful link / weekly read AND the
 * persisted account has an enabled IntegrationPolicy(direction='import',
 * dataType='training-zones'), the action callback SHALL invoke
 * `runZonesSync` exactly once. Errors thrown by `runZonesSync` MUST NOT
 * propagate up.
 */
import type { Analytics } from "@kaiord/core";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import { PersistenceProvider } from "../../contexts/persistence-context";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { LinkedCoachingAccount } from "../../types/coaching-account";
import type { Profile } from "../../types/profile";

const mockAttempt = vi.fn(async () => ({ ok: true as const }));
const mockSyncWeek = vi.fn(async () => ({
  ok: true as const,
  activityCount: 0,
  orphansDeleted: 0,
}));

vi.mock("../../application/coaching/attempt-link", () => ({
  attemptLink: (...args: unknown[]) => mockAttempt(...args),
}));
vi.mock("../../application/coaching/sync-week", () => ({
  syncWeek: (...args: unknown[]) => mockSyncWeek(...args),
}));

import { useConnectCallback, useSyncCallback } from "./use-train2go-actions";

const transport: CoachingTransport = {
  source: "train2go",
  ping: vi.fn(),
  openExternal: vi.fn(),
  readWeek: vi.fn(),
  readDay: vi.fn(),
};

const analytics: Analytics = {
  event: vi.fn(),
  pageview: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
} as unknown as Analytics;

const T2G_LINK: LinkedCoachingAccount = {
  source: "train2go",
  externalUserId: "99999",
  externalUserName: "Pablo",
  linkedAt: "2026-04-28T10:00:00.000Z",
};

const makeProfile = (link: LinkedCoachingAccount): Profile => ({
  id: "p1",
  name: "Pablo",
  sportZones: {},
  linkedAccounts: [link],
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
});

const seedAutoImportPolicy = (
  persistence: ReturnType<typeof createInMemoryPersistence>
) =>
  persistence.integrationPolicy.put({
    id: "11111111-1111-4111-8111-111111111111",
    profileId: "p1",
    dataType: "training-zones",
    bridgeId: "train2go-bridge",
    direction: "import",
    mode: "auto",
    enabled: true,
    updatedAt: "2026-04-28T10:00:00.000Z",
  });

const wrapPersistence = (
  persistence: ReturnType<typeof createInMemoryPersistence>
) => ({
  wrapper: ({ children }: { children: ReactNode }) => (
    <PersistenceProvider persistence={persistence}>
      {children}
    </PersistenceProvider>
  ),
});

describe("useConnectCallback fan-out", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should call runZonesSync after attemptLink ok when runZonesSync is provided", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(makeProfile(T2G_LINK));
    await seedAutoImportPolicy(persistence);
    const runZonesSync = vi.fn(async () => undefined);
    const { result } = renderHook(
      () => useConnectCallback(persistence, transport, analytics, runZonesSync),
      wrapPersistence(persistence)
    );

    // Act
    await result.current("p1");

    // Assert
    expect(runZonesSync).toHaveBeenCalledExactlyOnceWith("p1");
  });

  it("should NOT call runZonesSync when no enabled import policy exists", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(makeProfile(T2G_LINK));
    const runZonesSync = vi.fn(async () => undefined);
    const { result } = renderHook(
      () => useConnectCallback(persistence, transport, analytics, runZonesSync),
      wrapPersistence(persistence)
    );

    // Act
    await result.current("p1");

    // Assert
    expect(runZonesSync).not.toHaveBeenCalled();
  });

  it("should NOT call runZonesSync when runZonesSync is not provided", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(makeProfile(T2G_LINK));
    await seedAutoImportPolicy(persistence);
    const runZonesSync = vi.fn(async () => undefined);

    // Act
    const { result } = renderHook(
      () => useConnectCallback(persistence, transport, analytics),
      wrapPersistence(persistence)
    );
    await result.current("p1");

    // Assert
    expect(runZonesSync).not.toHaveBeenCalled();
  });

  it("should swallow runZonesSync errors so the connect still resolves", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(makeProfile(T2G_LINK));
    await seedAutoImportPolicy(persistence);
    const runZonesSync = vi.fn(async () => {
      throw new Error("zones boom");
    });

    // Act
    const { result } = renderHook(
      () => useConnectCallback(persistence, transport, analytics, runZonesSync),
      wrapPersistence(persistence)
    );

    // Assert
    await expect(result.current("p1")).resolves.toBeUndefined();
  });
});

describe("useSyncCallback fan-out", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should call runZonesSync after syncWeek ok when runZonesSync is provided", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(makeProfile(T2G_LINK));
    await seedAutoImportPolicy(persistence);
    const runZonesSync = vi.fn(async () => undefined);
    const { result } = renderHook(
      () => useSyncCallback(persistence, transport, analytics, runZonesSync),
      wrapPersistence(persistence)
    );

    // Act
    await result.current("p1", "2026-04-13");

    // Assert
    expect(runZonesSync).toHaveBeenCalledExactlyOnceWith("p1");
  });

  it("should NOT call runZonesSync when syncWeek fails", async () => {
    // Arrange
    mockSyncWeek.mockResolvedValueOnce({
      ok: false as const,
      reason: "shape-mismatch",
    } as never);
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(makeProfile(T2G_LINK));
    await seedAutoImportPolicy(persistence);
    const runZonesSync = vi.fn(async () => undefined);
    const { result } = renderHook(
      () => useSyncCallback(persistence, transport, analytics, runZonesSync),
      wrapPersistence(persistence)
    );

    // Act
    await result.current("p1", "2026-04-13");

    // Assert
    expect(runZonesSync).not.toHaveBeenCalled();
  });
});
