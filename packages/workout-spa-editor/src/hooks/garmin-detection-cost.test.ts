/**
 * The Garmin send path's detection at the message contract: the store
 * Garmin extension (protocol 1) answers `ping` with a read of one workout, so
 * it is asked nothing and its Connection is "not checked", with the features
 * its verification answer already carried. The current extension's `ping`
 * reads nothing and is asked.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { bridgeDiscovery } from "../adapters/bridge/bridge-discovery";
import {
  currentExtension,
  previousExtension,
  uninstallFakeExtension,
} from "../test-utils/fake-bridge-extension";
import { runDetect } from "./use-garmin-bridge-action-helpers";

const FEATURES = ["calendar-write-v1", "calendar-find-v1"];

const discovered = (protocolVersion: number) => {
  vi.spyOn(bridgeDiscovery, "getExtensionId").mockReturnValue("garmin-ext");
  vi.spyOn(bridgeDiscovery, "getVerified").mockReturnValue({
    protocolVersion,
    features: FEATURES,
  });
};

const setters = () => ({
  setExtensionInstalled: vi.fn(),
  setSessionActive: vi.fn(),
  setFeatures: vi.fn(),
  setConnection: vi.fn(),
});

afterEach(() => {
  uninstallFakeExtension();
  vi.restoreAllMocks();
});

describe("Garmin detection asks only what costs nothing", () => {
  it("should report a protocol 1 extension not checked without pinging it", async () => {
    // Arrange
    discovered(1);
    const sent = previousExtension({ ping: { gcApi: { ok: true } } });
    const set = setters();

    // Act
    await runDetect(set);

    // Assert
    expect(sent).toEqual([]);
    expect(set.setExtensionInstalled).toHaveBeenCalledWith(true);
    expect(set.setSessionActive).toHaveBeenCalledWith(true);
    expect(set.setFeatures).toHaveBeenCalledWith(FEATURES);
    expect(set.setConnection).toHaveBeenCalledWith("not-checked");
  });

  it("should ping a protocol 2 extension, whose check mints nothing", async () => {
    // Arrange
    discovered(2);
    const sent = currentExtension(
      {},
      { ping: { session: "signed-in", features: FEATURES } }
    );
    const set = setters();

    // Act
    await runDetect(set);

    // Assert
    expect(sent).toEqual([{ action: "ping" }]);
    expect(set.setConnection).toHaveBeenCalledWith("working");
  });
});
