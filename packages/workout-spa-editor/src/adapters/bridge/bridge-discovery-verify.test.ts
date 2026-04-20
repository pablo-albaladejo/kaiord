import { describe, expect, it, vi } from "vitest";

import { verifyAnnouncement } from "./bridge-discovery-verify";
import type { BridgeAnnouncement } from "./bridge-discovery-types";

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
  it("returns true for a matching ping manifest", async () => {
    mockSend.mockResolvedValue(validManifest);

    await expect(verifyAnnouncement(ann)).resolves.toBe(true);
  });

  it("returns false when the ping fails", async () => {
    mockSend.mockResolvedValue({ ok: false, error: "no" });

    await expect(verifyAnnouncement(ann)).resolves.toBe(false);
  });

  it("returns false when the manifest fails schema validation", async () => {
    mockSend.mockResolvedValue({
      ok: true,
      data: { id: "garmin-bridge", name: "x" },
    });

    await expect(verifyAnnouncement(ann)).resolves.toBe(false);
  });

  it("returns false when manifest.id does not match the announced bridgeId", async () => {
    mockSend.mockResolvedValue({
      ok: true,
      data: {
        ...validManifest.data,
        id: "different-bridge",
      },
    });

    await expect(verifyAnnouncement(ann)).resolves.toBe(false);
  });

  it("returns false when the protocol version is unsupported", async () => {
    mockSend.mockResolvedValue({
      ok: true,
      data: {
        ...validManifest.data,
        protocolVersion: 99,
      },
    });

    await expect(verifyAnnouncement(ann)).resolves.toBe(false);
  });
});
