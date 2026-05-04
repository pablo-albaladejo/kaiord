/**
 * CoachingTransport port — shape smoke tests.
 *
 * Confirms the optional `readZones` capability is treated as truly
 * optional: a Garmin-shaped transport (no readZones) still satisfies
 * the type, while a Train2Go-shaped transport advertises the function.
 * The runtime check `if (!transport.readZones)` is what use cases rely
 * on — we exercise both branches here so the contract is locked in.
 */
import { describe, expect, it, vi } from "vitest";

import type { ZonesPayload } from "../../types/coaching-zones";
import type { CoachingTransport } from "./coaching-transport-port";

const stubBase = (source: string): Omit<CoachingTransport, "readZones"> => ({
  source,
  ping: vi.fn(async () => ({
    sessionActive: false,
    externalUserId: null,
    externalUserName: null,
  })),
  openExternal: vi.fn(async () => undefined),
  readWeek: vi.fn(async () => []),
  readDay: vi.fn(async () => []),
});

describe("CoachingTransport.readZones", () => {
  it("should be absent on a Garmin-shaped transport", () => {
    // Arrange

    // Act
    const transport: CoachingTransport = stubBase("garmin");

    // Assert
    expect(transport.readZones).toBeUndefined();
  });

  it("should be callable on a Train2Go-shaped transport", async () => {
    // Arrange
    const payload: ZonesPayload = {
      physiological: { weight: 83, bpmMax: 187 },
    };
    const readZones = vi.fn(async () => payload);
    const transport: CoachingTransport = {
      ...stubBase("train2go"),
      readZones,
    };
    expect(typeof transport.readZones).toBe("function");

    // Act
    const result = await transport.readZones?.("99999");

    // Assert
    expect(result).toBe(payload);
    expect(readZones).toHaveBeenCalledWith("99999");
  });

  it("should propagate the AbortSignal argument when supplied", async () => {
    // Arrange
    const readZones = vi.fn(async () => null);
    const transport: CoachingTransport = {
      ...stubBase("train2go"),
      readZones,
    };
    const ac = new AbortController();

    // Act
    await transport.readZones?.("99999", ac.signal);

    // Assert
    expect(readZones).toHaveBeenCalledWith("99999", ac.signal);
  });
});
