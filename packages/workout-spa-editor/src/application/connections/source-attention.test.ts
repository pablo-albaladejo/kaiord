import { describe, expect, it } from "vitest";

import type { ConnectionSource } from "./connection-source";
import { buildConnectionAttention, needsAttention } from "./source-attention";

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
  connection: "working",
  sessionVerifiable: true,
  lastSyncAt: undefined,
  importTypes: [],
  exportTypes: [],
  ...overrides,
});

/** A last sync exists, and still never outranks the Connection's own state. */
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

  it("should name a lone source by its own Connection state", () => {
    // Arrange
    const sources = [
      source({
        status: "attention",
        connection: "not-answering",
        lastSyncAt: LAST_SYNC_AT,
      }),
    ];

    // Act
    const attention = buildConnectionAttention(sources);

    // Assert
    expect(attention?.cause).toEqual({
      kind: "notice",
      connection: "not-answering",
      name: "Garmin",
    });
  });

  it("should keep a sign-in the Platform refused as its cause", () => {
    // Arrange
    const sources = [
      source({
        id: "trainingpeaks",
        name: "TrainingPeaks",
        status: "attention",
        connection: "signed-out",
        lastSyncAt: LAST_SYNC_AT,
      }),
    ];

    // Act
    const attention = buildConnectionAttention(sources);

    // Assert
    expect(attention?.cause).toEqual({
      kind: "notice",
      connection: "signed-out",
      name: "TrainingPeaks",
    });
  });

  it("should report an outdated extension instead of blaming the session", () => {
    // Arrange
    // The probe SUCCEEDED here — the extension answered with an unsupported
    // protocol version — and signing in again would fix nothing.
    const sources = [source({ status: "attention", connection: "outdated" })];

    // Act
    const attention = buildConnectionAttention(sources);

    // Assert
    expect(attention?.cause).toEqual({
      kind: "notice",
      connection: "outdated",
      name: "Garmin",
    });
  });

  it("should claim no cause for several affected sources", () => {
    // Arrange
    const sources = [
      source({ status: "attention", connection: "outdated" }),
      source({ id: "whoop", status: "attention", connection: "not-answering" }),
    ];

    // Act
    const attention = buildConnectionAttention(sources);

    // Assert
    expect(attention?.cause).toEqual({ kind: "several" });
  });
});
