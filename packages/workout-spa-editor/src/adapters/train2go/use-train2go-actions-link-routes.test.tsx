/**
 * `useConnectCallback` — an explicit Train2Go link opens the import routes the
 * bridge feeds, so a fresh profile can sync without visiting Connections, and
 * never reopens a route the user switched off.
 */
import type { Analytics } from "@kaiord/core";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CoachingTransport } from "../../application/coaching/coaching-transport-port";
import { PersistenceProvider } from "../../contexts/persistence-context";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import type { Profile } from "../../types/profile";

const PROFILE_ID = "22222222-2222-4222-8222-222222222222";
const mockAttempt = vi.fn();

vi.mock("../../application/coaching/attempt-link", () => ({
  attemptLink: (...args: unknown[]) => mockAttempt(...args),
}));
vi.mock("../bridge/bridge-discovery", () => ({
  bridgeDiscovery: {
    getCapabilities: (id: string) =>
      id === "train2go-bridge"
        ? ["read:training-plan", "read:training-zones"]
        : null,
  },
}));

import { useConnectCallback } from "./use-train2go-actions";

const transport = {
  source: "train2go",
  ping: vi.fn(),
  openExternal: vi.fn(),
  readWeek: vi.fn(),
  readDay: vi.fn(),
} as unknown as CoachingTransport;

const analytics = { event: vi.fn() } as unknown as Analytics;

const PROFILE: Profile = {
  id: PROFILE_ID,
  name: "Pablo",
  sportZones: {},
  linkedAccounts: [
    {
      source: "train2go",
      externalUserId: "99999",
      externalUserName: "Pablo",
      linkedAt: "2026-04-28T10:00:00.000Z",
    },
  ],
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
};

const setup = async () => {
  const persistence = createInMemoryPersistence();
  await persistence.profiles.put(PROFILE);
  const runZonesSync = vi.fn(async () => undefined);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PersistenceProvider persistence={persistence}>
      {children}
    </PersistenceProvider>
  );
  const { result } = renderHook(
    () => useConnectCallback(persistence, transport, analytics, runZonesSync),
    { wrapper }
  );
  return { persistence, runZonesSync, connect: result.current };
};

const importRows = (
  persistence: ReturnType<typeof createInMemoryPersistence>,
  dataType: "planned-session" | "training-zones"
) =>
  persistence.integrationPolicy.findByProfileDirection({
    profileId: PROFILE_ID,
    dataType,
    direction: "import",
  });

describe("useConnectCallback route seeding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAttempt.mockResolvedValue({ ok: true });
  });

  it("should enable the planned-session and zones import routes on a successful link", async () => {
    // Arrange
    const { persistence, runZonesSync, connect } = await setup();

    // Act
    await connect(PROFILE_ID);

    // Assert
    const planned = await importRows(persistence, "planned-session");
    const zones = await importRows(persistence, "training-zones");
    expect(planned).toMatchObject([
      { bridgeId: "train2go-bridge", mode: "auto", enabled: true },
    ]);
    expect(zones).toMatchObject([{ mode: "auto", enabled: true }]);
    expect(runZonesSync).toHaveBeenCalledExactlyOnceWith(PROFILE_ID);
  });

  it("should keep a planned-session route the user switched off disabled", async () => {
    // Arrange
    const { persistence, connect } = await setup();
    await persistence.integrationPolicy.put({
      id: "11111111-1111-4111-8111-111111111111",
      profileId: PROFILE_ID,
      dataType: "planned-session",
      bridgeId: "train2go-bridge",
      direction: "import",
      mode: "auto",
      enabled: false,
      updatedAt: "2026-04-28T10:00:00.000Z",
    });

    // Act
    await connect(PROFILE_ID);

    // Assert
    const planned = await importRows(persistence, "planned-session");
    expect(planned).toMatchObject([{ enabled: false }]);
  });

  it("should open no route when the link fails", async () => {
    // Arrange
    mockAttempt.mockResolvedValue({ ok: false, reason: "session-not-active" });
    const { persistence, connect } = await setup();

    // Act
    await connect(PROFILE_ID);

    // Assert
    expect(await importRows(persistence, "planned-session")).toEqual([]);
  });
});
