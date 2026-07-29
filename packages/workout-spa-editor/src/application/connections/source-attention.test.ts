import { describe, expect, it } from "vitest";

import type { ConnectionSource } from "./connection-source";
import {
  buildConnectionAttention,
  countDetected,
  needsAttention,
} from "./source-attention";

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
    // Unlinked, or its extension is not running — and, before the first
    // discovery pass, every bridge in the app.
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
      { discovered: true },
      { discovered: true },
      { discovered: false },
    ];

    // Act
    const detected = countDetected(connections);

    // Assert
    expect(detected).toBe(2);
  });
});

describe("buildConnectionAttention", () => {
  it("should build no model when nothing needs attention", () => {
    // Arrange
    const sources = [
      source(),
      source({ id: "tanita", status: "installed", sessionVerifiable: false }),
    ];

    // Act
    const attention = buildConnectionAttention(sources);

    // Assert
    expect(attention).toBeNull();
  });

  it("should count only the affected sources", () => {
    // Arrange
    const sources = [
      source({ status: "attention" }),
      source({ id: "whoop", status: "attention" }),
      source({ id: "train2go" }),
    ];

    // Act
    const attention = buildConnectionAttention(sources);

    // Assert
    expect(attention?.count).toBe(2);
  });

  it("should date the consequence from the last data that arrived", () => {
    // Arrange
    const sources = [source({ status: "attention", lastSyncAt: LAST_SYNC_AT })];

    // Act
    const attention = buildConnectionAttention(sources);

    // Assert
    expect(attention?.cause).toEqual({
      kind: "noNewDataSince",
      date: "2026-07-25",
    });
  });

  it("should keep the sign-in cause when a last-sync date also exists", () => {
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
    const attention = buildConnectionAttention(sources);

    // Assert
    expect(attention?.cause).toEqual({ kind: "signedOut" });
  });

  it("should report an outdated extension instead of blaming the session", () => {
    // Arrange
    // The probe SUCCEEDED here — the extension answered with an unsupported
    // protocol version — and signing in again would fix nothing.
    const sources = [
      source({ status: "attention", outdated: true, lastSyncAt: LAST_SYNC_AT }),
    ];

    // Act
    const attention = buildConnectionAttention(sources);

    // Assert
    expect(attention?.cause).toEqual({ kind: "extensionOutdated" });
  });

  it("should fall back to the signed-out cause for several affected sources", () => {
    // Arrange
    const sources = [
      source({ status: "attention", lastSyncAt: LAST_SYNC_AT }),
      source({ id: "whoop", status: "attention" }),
    ];

    // Act
    const attention = buildConnectionAttention(sources);

    // Assert
    expect(attention?.cause).toEqual({ kind: "signedOut" });
  });

  it("should ignore a stored timestamp that does not parse as a date", () => {
    // Arrange
    const sources = [source({ status: "attention", lastSyncAt: "not-a-date" })];

    // Act
    const attention = buildConnectionAttention(sources);

    // Assert
    expect(attention?.cause).toEqual({ kind: "signedOut" });
  });
});
