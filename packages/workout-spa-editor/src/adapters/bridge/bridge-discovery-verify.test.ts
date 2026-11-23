import { describe, expect, it, vi } from "vitest";

import type { BridgeAnnouncement } from "./bridge-discovery-types";
import { verifyAnnouncement } from "./bridge-discovery-verify";

vi.mock("./bridge-transport", () => ({
  sendBridgeMessage: vi.fn(),
}));

import { sendBridgeMessage } from "./bridge-transport";

const mockSend = vi.mocked(sendBridgeMessage);

const ann: BridgeAnnouncement = {
  type: "KAIORD_BRIDGE_ANNOUNCE",
  bridgeId: "garmin-bridge",
  extensionId: "ext-1",
  name: "Garmin",
  version: "1.0.0",
  protocolVersion: 1,
  capabilities: ["write:workouts"],
};

const validManifest = {
  ok: true,
  protocolVersion: 1,
  data: {
    id: "garmin-bridge",
    name: "Garmin",
    version: "1.0.0",
    protocolVersion: 1,
    capabilities: ["write:workouts" as const],
  },
};

describe("verifyAnnouncement", () => {
  it("should return the verified manifest for a matching ping", async () => {
    // Arrange

    // Act
    mockSend.mockResolvedValue(validManifest);

    // Assert
    await expect(verifyAnnouncement(ann)).resolves.toEqual(validManifest.data);
  });

  it("should return false when the ping fails", async () => {
    // Arrange

    // Act
    mockSend.mockResolvedValue({ ok: false, error: "no" });

    // Assert
    await expect(verifyAnnouncement(ann)).resolves.toBeNull();
  });

  it("should return false when the manifest fails schema validation", async () => {
    // Arrange

    // Act
    mockSend.mockResolvedValue({
      ok: true,
      data: { id: "garmin-bridge", name: "x" },
    });

    // Assert
    await expect(verifyAnnouncement(ann)).resolves.toBeNull();
  });

  it("should return false when manifest.id does not match the announced bridgeId", async () => {
    // Arrange

    // Act
    mockSend.mockResolvedValue({
      ok: true,
      data: {
        ...validManifest.data,
        id: "different-bridge",
      },
    });

    // Assert
    await expect(verifyAnnouncement(ann)).resolves.toBeNull();
  });

  it("should accept an extension on another protocol version so its probe can offer Update", async () => {
    // Arrange
    const otherVersion = validManifest.data.protocolVersion + 1;
    mockSend.mockResolvedValue({
      ok: true,
      data: {
        ...validManifest.data,
        protocolVersion: otherVersion,
      },
    });

    // Act
    const manifest = await verifyAnnouncement(ann);

    // Assert
    // Rejecting it made an outdated extension look absent, so the App said
    // Install where only Update can help (#1098).
    expect(manifest?.protocolVersion).toBe(otherVersion);
  });
});
