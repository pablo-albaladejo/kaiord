import { describe, expect, it } from "vitest";

import type { BridgeConnectionState } from "../../../hooks/use-bridge-connections";
import { getTranslate } from "../../../i18n/use-translate";
import {
  buildAttention,
  countInstalled,
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
  lastCheckedAt: 1_700_000_000_000,
  lastSyncAt: undefined,
  ...overrides,
});

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

describe("countInstalled", () => {
  it("should count discovered bridges regardless of their session", () => {
    // Arrange
    const connections = [
      connection({ bridgeId: "garmin-bridge" }),
      connection({ bridgeId: "tanita-bridge", sessionActive: false }),
      connection({ bridgeId: "whoop-bridge", discovered: false }),
    ];

    // Act
    const installed = countInstalled(connections);

    // Assert
    expect(installed).toBe(2);
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
      connection({ error: "unreachable", lastSyncAt: "2026-07-25T10:00:00Z" }),
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
