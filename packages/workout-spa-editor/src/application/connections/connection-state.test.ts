import { connectionNotice } from "@kaiord/i18n";
import { describe, expect, it } from "vitest";

import type { BridgeSessionSignal } from "./connection-source-status";
import {
  type ConnectionPresence,
  connectionStateOf,
  sessionOutcomeOf,
} from "./connection-state";

const row = (
  patch: Partial<BridgeSessionSignal> = {}
): BridgeSessionSignal => ({
  sessionActive: false,
  checking: false,
  error: null,
  needsReauth: false,
  outdated: false,
  lastCheckedAt: 1,
  ...patch,
});

const INSTALLED: ConnectionPresence = {
  installed: true,
  settled: true,
  hasProbe: true,
};

describe("connectionStateOf", () => {
  it.each([
    ["a working Session", row({ sessionActive: true }), "working"],
    ["an outdated extension", row({ outdated: true, error: "v2" }), "outdated"],
    [
      "a sign-in the Platform refused",
      row({ needsReauth: true }),
      "signed-out",
    ],
    ["a failed check", row({ error: "500" }), "not-answering"],
    ["an inactive answer with no reason", row(), "not-answering"],
    ["a check still running", row({ checking: true }), "checking"],
    ["a row never checked", row({ lastCheckedAt: null }), "checking"],
  ] as const)("should read %s as %s", (_label, signal, expected) => {
    // Arrange
    const presence = INSTALLED;

    // Act
    const state = connectionStateOf(signal, presence);

    // Assert
    expect(state).toBe(expected);
  });

  it("should call an absent extension not installed only once discovery settled", () => {
    // Arrange
    const absent = { ...INSTALLED, installed: false };

    // Act
    const early = connectionStateOf(undefined, { ...absent, settled: false });
    const settled = connectionStateOf(undefined, absent);

    // Assert
    expect(early).toBe("checking");
    expect(settled).toBe("not-installed");
  });

  it("should call an installed extension that stopped replying not answering, not absent", () => {
    // Arrange
    const unanswered = row({ error: "Extension did not respond" });

    // Act
    const state = connectionStateOf(unanswered, {
      ...INSTALLED,
      installed: false,
    });

    // Assert
    expect(state).toBe("not-answering");
  });

  it("should show no notice for an extension that cannot be checked", () => {
    // Arrange
    const presence = { ...INSTALLED, hasProbe: false };

    // Act
    const state = connectionStateOf(undefined, presence);

    // Assert
    expect(state).toBe("working");
    expect(connectionNotice(state, "Tanita", "en")).toBeNull();
  });

  it("should prefer Update over any session answer from an outdated extension", () => {
    // Arrange
    const signal = row({ outdated: true, needsReauth: true });

    // Act
    const state = connectionStateOf(signal, INSTALLED);

    // Assert
    expect(state).toBe("outdated");
    expect(connectionNotice(state, "WHOOP", "en")?.action).toBe(
      "Update Kaiord for WHOOP"
    );
  });
});

describe("sessionOutcomeOf", () => {
  it.each([
    [{ sessionActive: true, needsReauth: false }, "signed-in"],
    [{ sessionActive: false, needsReauth: true }, "signed-out-verified"],
    [{ sessionActive: false, needsReauth: false }, "could-not-tell"],
  ] as const)("should read %o as %s", (signal, expected) => {
    // Arrange
    const input = signal;

    // Act
    const outcome = sessionOutcomeOf(input);

    // Assert
    expect(outcome).toBe(expected);
  });
});

describe("connectionStateOf with a check that asked nothing", () => {
  it("should show no notice and let the first use decide", () => {
    // Arrange
    const signal = row({ notChecked: true });

    // Act
    const state = connectionStateOf(signal, INSTALLED);

    // Assert
    expect(state).toBe("not-checked");
    expect(connectionNotice(state, "TrainingPeaks", "en")).toBeNull();
  });
});
