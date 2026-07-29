import { describe, expect, it } from "vitest";

import type { BridgeConnectionState } from "../../../hooks/use-bridge-connections";
import { getTranslate } from "../../../i18n/use-translate";
import {
  buildAttention,
  countDetected,
  needsAttention,
} from "./connection-attention";

const t = getTranslate("settings");

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
  it("should flag a connection whose last probe failed", () => {
    // Arrange
    const entry = connection({ error: "unreachable", sessionActive: false });

    // Act
    const flagged = needsAttention(entry);

    // Assert
    expect(flagged).toBe(true);
  });

  it("should flag a connection whose session must be signed in again", () => {
    // Arrange
    const entry = connection({ needsReauth: true, sessionActive: false });

    // Act
    const flagged = needsAttention(entry);

    // Assert
    expect(flagged).toBe(true);
  });

  it("should leave a probe-less installed bridge alone", () => {
    // Arrange
    // `tanita-bridge` is never probed, so it is permanently session-inactive
    // with no error: a `discovered && !sessionActive` rule would report it as
    // broken for as long as it stays installed.
    const tanita = connection({
      bridgeId: "tanita-bridge",
      sessionActive: false,
      lastCheckedAt: null,
    });

    // Act
    const flagged = needsAttention(tanita);

    // Assert
    expect(flagged).toBe(false);
  });

  it("should leave a signed-out bridge alone until a probe reports why", () => {
    // Arrange
    const entry = connection({ sessionActive: false });

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
    const connections = [
      connection(),
      connection({ bridgeId: "tanita-bridge", sessionActive: false }),
    ];

    // Act
    const attention = buildAttention(connections, t);

    // Assert
    expect(attention).toBeNull();
  });

  it("should name the affected count in the singular", () => {
    // Arrange
    const connections = [connection({ error: "unreachable" }), connection()];

    // Act
    const attention = buildAttention(connections, t);

    // Assert
    expect(attention?.title).toBe("1 connection needs attention");
  });

  it("should name the affected count in the plural", () => {
    // Arrange
    const connections = [
      connection({ error: "unreachable" }),
      connection({ bridgeId: "whoop-bridge", error: "unreachable" }),
    ];

    // Act
    const attention = buildAttention(connections, t);

    // Assert
    expect(attention?.title).toBe("2 connections need attention");
  });

  it("should date the consequence from the last data that arrived", () => {
    // Arrange
    const connections = [
      connection({ error: "unreachable", lastSyncAt: LAST_SYNC_AT }),
    ];

    // Act
    const attention = buildAttention(connections, t);

    // Assert
    expect(attention?.detail).toBe("No new data since 2026-07-25");
  });

  it("should report a re-authorisation as signed out rather than expired", () => {
    // Arrange
    const connections = [connection({ needsReauth: true })];

    // Act
    const attention = buildAttention(connections, t);

    // Assert
    expect(attention?.detail).toBe(
      "Session signed out — sign in again to resume"
    );
  });

  it("should keep the sign-in instruction when a last-sync date also exists", () => {
    // Arrange
    // The ordinary case: you only get a re-auth demand for an account you
    // were already syncing, so both facts are present and the actionable one
    // must win.
    const connections = [
      connection({
        bridgeId: "trainingpeaks-bridge",
        needsReauth: true,
        error: "Session expired",
        lastSyncAt: LAST_SYNC_AT,
      }),
    ];

    // Act
    const attention = buildAttention(connections, t);

    // Assert
    expect(attention?.detail).toBe(
      "Session signed out — sign in again to resume"
    );
  });

  it("should tell an outdated extension to update instead of reporting a failure", () => {
    // Arrange
    // The probe SUCCEEDED here — the extension answered with an unsupported
    // protocol version — so "the last check failed" would be untrue.
    const connections = [
      connection({
        error: "Update your Kaiord Garmin Bridge extension",
        outdated: true,
        sessionActive: false,
        lastSyncAt: LAST_SYNC_AT,
      }),
    ];

    // Act
    const attention = buildAttention(connections, t);

    // Assert
    expect(attention?.detail).toBe(
      "An extension is out of date — update it to resume"
    );
  });

  it("should fall back to the failed check when no date backs a consequence", () => {
    // Arrange
    const connections = [
      connection({ error: "unreachable" }),
      connection({ bridgeId: "whoop-bridge", error: "unreachable" }),
    ];

    // Act
    const attention = buildAttention(connections, t);

    // Assert
    expect(attention?.detail).toBe("The last check failed");
  });

  it("should ignore a stored timestamp that does not parse as a date", () => {
    // Arrange
    const connections = [
      connection({ error: "unreachable", lastSyncAt: "not-a-date" }),
    ];

    // Act
    const attention = buildAttention(connections, t);

    // Assert
    expect(attention?.detail).toBe("The last check failed");
  });

  it("should declare no action, because no surface can fix a bridge yet", () => {
    // Arrange
    const connections = [connection({ error: "unreachable" })];

    // Act
    const attention = buildAttention(connections, t);

    // Assert
    expect(attention?.action).toBeUndefined();
  });
});
