import { describe, expect, it } from "vitest";

import type { ConnectionSource } from "../../../application/connections/connection-source";
import type { BridgeConnectionState } from "../../../hooks/use-bridge-connections";
import { getTranslate } from "../../../i18n/use-translate";
import {
  buildAttention,
  countDetected,
  needsAttention,
} from "./connection-attention";

const t = getTranslate("settings");

const source = (
  overrides: Partial<ConnectionSource> = {}
): ConnectionSource => ({
  id: "garmin",
  name: "Garmin",
  mark: "G",
  mechanism: "bridge",
  bridgeId: "garmin-bridge",
  status: "connected",
  bridgeDetected: true,
  disconnected: false,
  needsReauth: false,
  outdated: false,
  sessionVerifiable: true,
  lastSyncAt: undefined,
  importTypes: [],
  exportTypes: [],
  ...overrides,
});

const connection = (
  overrides: Partial<BridgeConnectionState> = {}
): BridgeConnectionState => ({
  bridgeId: "garmin-bridge",
  discovered: true,
  sessionActive: true,
  checking: false,
  error: null,
  needsReauth: false,
  outdated: false,
  lastCheckedAt: 1_700_000_000_000,
  lastSyncAt: undefined,
  ...overrides,
});

/**
 * A date-time with no timezone designator parses as LOCAL time, so this is
 * local noon on 2026-07-25 wherever the runner is. Both properties matter:
 * the asserted calendar day holds in every timezone, and it is the LOCAL day
 * being asserted, which is the point of the formatter.
 */
const LAST_SYNC_AT = new Date("2026-07-25T12:00:00").toISOString();

describe("needsAttention", () => {
  it("should flag a source the connections page marks for attention", () => {
    // Arrange
    const entry = source({ status: "attention" });

    // Act
    const flagged = needsAttention(entry);

    // Assert
    expect(flagged).toBe(true);
  });

  it.each([
    // A bridge with no session prober; `tanita-bridge` lives here forever.
    { status: "installed" as const },
    // Probed, but its first answer has not arrived: not knowing is not broken.
    { status: "checking" as const },
    // Unlinked, or its extension is not running.
    { status: "available" as const },
    { status: "connected" as const },
    { status: "manual" as const },
  ])("should leave a $status source alone", ({ status }) => {
    // Arrange
    const entry = source({ status });

    // Act
    const flagged = needsAttention(entry);

    // Assert
    expect(flagged).toBe(false);
  });
});

describe("countDetected", () => {
  it("should count discovered bridges regardless of their session", () => {
    // Arrange
    const connections = [
      connection({ bridgeId: "garmin-bridge" }),
      connection({ bridgeId: "tanita-bridge", sessionActive: false }),
      connection({ bridgeId: "whoop-bridge", discovered: false }),
    ];

    // Act
    const detected = countDetected(connections);

    // Assert
    expect(detected).toBe(2);
  });
});

describe("buildAttention", () => {
  it("should build no model when nothing needs attention", () => {
    // Arrange
    const sources = [
      source(),
      source({ id: "tanita", status: "installed", sessionVerifiable: false }),
    ];

    // Act
    const attention = buildAttention(sources, t);

    // Assert
    expect(attention).toBeNull();
  });

  it("should name the affected count in the singular", () => {
    // Arrange
    const sources = [source({ status: "attention" }), source({ id: "whoop" })];

    // Act
    const attention = buildAttention(sources, t);

    // Assert
    expect(attention?.title).toBe("1 connection needs attention");
  });

  it("should name the affected count in the plural", () => {
    // Arrange
    const sources = [
      source({ status: "attention" }),
      source({ id: "whoop", status: "attention" }),
    ];

    // Act
    const attention = buildAttention(sources, t);

    // Assert
    expect(attention?.title).toBe("2 connections need attention");
  });

  it("should date the consequence from the last data that arrived", () => {
    // Arrange
    const sources = [source({ status: "attention", lastSyncAt: LAST_SYNC_AT })];

    // Act
    const attention = buildAttention(sources, t);

    // Assert
    expect(attention?.detail).toBe("No new data since 2026-07-25");
  });

  it("should keep the sign-in instruction when a last-sync date also exists", () => {
    // Arrange
    // The ordinary case: you only get a re-auth demand for an account you
    // were already syncing, so both facts are present and the actionable one
    // must win.
    const sources = [
      source({
        id: "trainingpeaks",
        status: "attention",
        needsReauth: true,
        lastSyncAt: LAST_SYNC_AT,
      }),
    ];

    // Act
    const attention = buildAttention(sources, t);

    // Assert
    expect(attention?.detail).toBe(
      "Session signed out — sign in again to resume"
    );
  });

  it("should tell an outdated extension to update instead of blaming the session", () => {
    // Arrange
    // The probe SUCCEEDED here — the extension answered with an unsupported
    // protocol version — and signing in again would fix nothing.
    const sources = [
      source({ status: "attention", outdated: true, lastSyncAt: LAST_SYNC_AT }),
    ];

    // Act
    const attention = buildAttention(sources, t);

    // Assert
    expect(attention?.detail).toBe(
      "An extension is out of date — update it to resume"
    );
  });

  it("should fall back to the signed-out line for several affected sources", () => {
    // Arrange
    const sources = [
      source({ status: "attention", lastSyncAt: LAST_SYNC_AT }),
      source({ id: "whoop", status: "attention" }),
    ];

    // Act
    const attention = buildAttention(sources, t);

    // Assert
    expect(attention?.detail).toBe(
      "Session signed out — sign in again to resume"
    );
  });

  it("should ignore a stored timestamp that does not parse as a date", () => {
    // Arrange
    const sources = [source({ status: "attention", lastSyncAt: "not-a-date" })];

    // Act
    const attention = buildAttention(sources, t);

    // Assert
    expect(attention?.detail).toBe(
      "Session signed out — sign in again to resume"
    );
  });

  it("should declare no action, leaving the adjacent row to lead the way", () => {
    // Arrange
    // The banner renders only on the index, directly above the row that opens
    // the Connections section, so a button would duplicate its neighbour.
    const sources = [source({ status: "attention" })];

    // Act
    const attention = buildAttention(sources, t);

    // Assert
    expect(attention?.action).toBeUndefined();
  });
});
