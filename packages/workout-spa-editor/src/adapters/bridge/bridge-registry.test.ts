import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createBridgeRegistry } from "./bridge-registry";
import * as transport from "./bridge-transport";

vi.mock("./bridge-transport", () => ({
  sendBridgeMessage: vi.fn(),
}));

const VALID_PING_RESPONSE = {
  ok: true,
  protocolVersion: 1,
  data: {
    id: "garmin-bridge",
    name: "Garmin Connect",
    version: "1.0.0",
    protocolVersion: 1,
    capabilities: ["write:workouts" as const],
  },
};

describe("createBridgeRegistry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("detectBridge", () => {
    it("registers a bridge with valid manifest", async () => {
      vi.mocked(transport.sendBridgeMessage).mockResolvedValue(
        VALID_PING_RESPONSE
      );

      const registry = createBridgeRegistry();
      const bridge = await registry.detectBridge("ext-123");

      expect(bridge).not.toBeNull();
      expect(bridge?.id).toBe("garmin-bridge");
      expect(bridge?.status).toBe("verified");
      expect(bridge?.extensionId).toBe("ext-123");
    });

    it("returns null for invalid manifest", async () => {
      vi.mocked(transport.sendBridgeMessage).mockResolvedValue({
        ok: true,
        data: { id: "bad", name: "Bad" },
      });

      const registry = createBridgeRegistry();
      const bridge = await registry.detectBridge("ext-bad");

      expect(bridge).toBeNull();
      expect(registry.getAllBridges()).toHaveLength(0);
    });

    it("returns null when extension does not respond", async () => {
      vi.mocked(transport.sendBridgeMessage).mockResolvedValue({
        ok: false,
        error: "Extension not available",
      });

      const registry = createBridgeRegistry();
      const bridge = await registry.detectBridge("ext-none");

      expect(bridge).toBeNull();
    });
  });

  describe("hasCapability", () => {
    it("returns true for verified bridge capability", async () => {
      vi.mocked(transport.sendBridgeMessage).mockResolvedValue(
        VALID_PING_RESPONSE
      );

      const registry = createBridgeRegistry();
      await registry.detectBridge("ext-123");

      expect(registry.hasCapability("write:workouts")).toBe(true);
      expect(registry.hasCapability("read:body")).toBe(false);
    });
  });

  describe("heartbeat", () => {
    it("keeps bridge verified on successful heartbeat", async () => {
      vi.mocked(transport.sendBridgeMessage).mockResolvedValue(
        VALID_PING_RESPONSE
      );

      const registry = createBridgeRegistry();
      await registry.detectBridge("ext-123");
      registry.startHeartbeat(100);

      await vi.advanceTimersByTimeAsync(100);

      expect(registry.getBridge("ext-123")?.status).toBe("verified");
      expect(registry.getBridge("ext-123")?.failCount).toBe(0);

      registry.destroy();
    });

    it("marks bridge unavailable after 3 failures", async () => {
      vi.mocked(transport.sendBridgeMessage)
        .mockResolvedValueOnce(VALID_PING_RESPONSE)
        .mockResolvedValue({ ok: false, error: "timeout" });

      const registry = createBridgeRegistry();
      await registry.detectBridge("ext-123");
      registry.startHeartbeat(100);

      await vi.advanceTimersByTimeAsync(100);
      await vi.advanceTimersByTimeAsync(100);
      await vi.advanceTimersByTimeAsync(100);

      expect(registry.getBridge("ext-123")?.status).toBe("unavailable");
      expect(registry.getBridge("ext-123")?.failCount).toBe(3);

      registry.destroy();
    });

    it("recovers from unavailable on successful ping", async () => {
      vi.mocked(transport.sendBridgeMessage)
        .mockResolvedValueOnce(VALID_PING_RESPONSE) // detect
        .mockResolvedValueOnce({ ok: false, error: "t" }) // hb 1
        .mockResolvedValueOnce({ ok: false, error: "t" }) // hb 2
        .mockResolvedValueOnce({ ok: false, error: "t" }) // hb 3
        .mockResolvedValue(VALID_PING_RESPONSE); // hb 4

      const registry = createBridgeRegistry();
      await registry.detectBridge("ext-123");
      registry.startHeartbeat(100);

      await vi.advanceTimersByTimeAsync(100);
      await vi.advanceTimersByTimeAsync(100);
      await vi.advanceTimersByTimeAsync(100);
      expect(registry.getBridge("ext-123")?.status).toBe("unavailable");

      await vi.advanceTimersByTimeAsync(100);
      expect(registry.getBridge("ext-123")?.status).toBe("verified");

      registry.destroy();
    });
  });
});
