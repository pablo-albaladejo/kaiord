/**
 * What a Session check costs the athlete, at the message contract with each
 * extension (docs/adr/0004-thin-bridge-smart-connector.md: a check never
 * downloads data and never mints a token). An extension one protocol behind
 * (the store versions) answers Garmin's `ping` with a read of one workout and
 * TrainingPeaks' `checkSession` and Tanita's with a token or an export, so
 * it is asked nothing and its check is "not checked". The current ones check
 * for free and are asked.
 */
import { afterEach, describe, expect, it } from "vitest";

import {
  currentExtension,
  previousExtension,
  uninstallFakeExtension,
} from "../../test-utils/fake-bridge-extension";
import { SESSION_PROBES } from "./bridge-session-probes";

const EXT = "ext-1";
const PREVIOUS = 1;
const CURRENT = 2;
const NOT_CHECKED = {
  reachable: true,
  sessionActive: false,
  error: null,
  needsReauth: false,
  outdated: false,
  notChecked: true,
};

afterEach(() => uninstallFakeExtension());

describe("a Session check asks an extension one protocol behind nothing that costs", () => {
  it.each([
    ["garmin-bridge", "ping"],
    ["trainingpeaks-bridge", "checkSession"],
    ["tanita-bridge", "checkSession"],
  ])(
    "should report %s on protocol 1 not checked without sending it anything",
    async (bridgeId, action) => {
      // Arrange
      const sent = previousExtension({ [action]: { authenticated: true } });

      // Act
      const result = await SESSION_PROBES[bridgeId]!(EXT, PREVIOUS);

      // Assert
      expect(sent).toEqual([]);
      expect(result).toEqual(NOT_CHECKED);
    }
  );

  it.each([
    ["garmin-bridge", "ping"],
    ["trainingpeaks-bridge", "checkSession"],
    ["tanita-bridge", "checkSession"],
  ])(
    "should check %s on protocol 2 with its one free check",
    async (bridgeId, action) => {
      // Arrange
      const sent = currentExtension({}, { [action]: { session: "signed-in" } });

      // Act
      const result = await SESSION_PROBES[bridgeId]!(EXT, CURRENT);

      // Assert
      expect(sent).toEqual([{ action }]);
      expect(result).toMatchObject({ sessionActive: true, outdated: false });
    }
  );

  it("should still check Train2Go and WHOOP on protocol 1, whose checks read nothing", async () => {
    // Arrange
    const sent = previousExtension({
      ping: { sessionActive: true },
      status: { connected: true },
    });

    // Act
    const train2go = await SESSION_PROBES["train2go-bridge"]!(EXT, PREVIOUS);
    const whoop = await SESSION_PROBES["whoop-bridge"]!(EXT, PREVIOUS);

    // Assert
    expect(sent).toEqual([{ action: "ping" }, { action: "status" }]);
    expect([train2go.sessionActive, whoop.sessionActive]).toEqual([true, true]);
  });
});
