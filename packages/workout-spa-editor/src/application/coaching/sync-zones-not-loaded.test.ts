/**
 * `syncZones` when the read could not be made because a part of the App did
 * not load: Train2Go was never asked, so the failure is the App's own, not a
 * transport error. A read Train2Go itself failed keeps `transport-error`.
 */
import { describe, expect, it, vi } from "vitest";

import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { AppPartNotLoadedError } from "../../types/app-part-not-loaded-error";
import type { Profile } from "../../types/profile";
import type { CoachingTransport } from "./coaching-transport-port";
import { syncZones } from "./sync-zones";

const PROFILE_ID = "00000000-0000-0000-0000-000000000002";
const NOW = "2026-05-04T10:00:00.000Z";

const profile: Profile = {
  id: PROFILE_ID,
  name: "Pablo",
  sportZones: {},
  linkedAccounts: [
    {
      source: "train2go",
      externalUserId: "99999",
      externalUserName: "Pablo",
      linkedAt: NOW,
    },
  ],
  createdAt: NOW,
  updatedAt: NOW,
};

const transportReading = (
  readZones: CoachingTransport["readZones"]
): CoachingTransport => ({
  source: "train2go",
  ping: vi.fn(),
  openExternal: vi.fn(),
  readWeek: vi.fn(),
  readDay: vi.fn(),
  readZones,
});

describe("syncZones with a read that could not be made", () => {
  it("should fail as app-part-not-loaded when a part of the App did not load", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(profile);
    const transport = transportReading(async () => {
      throw new AppPartNotLoadedError();
    });

    // Act
    const result = await syncZones(PROFILE_ID, transport, persistence);

    // Assert
    expect(result).toEqual({ ok: false, reason: "app-part-not-loaded" });
  });

  it("should keep transport-error when Train2Go did not answer", async () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    await persistence.profiles.put(profile);
    const transport = transportReading(async () => {
      throw new Error("Bridge timeout");
    });

    // Act
    const result = await syncZones(PROFILE_ID, transport, persistence);

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "transport-error",
      error: "Bridge timeout",
    });
  });
});
