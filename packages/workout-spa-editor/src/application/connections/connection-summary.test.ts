import { describe, expect, it } from "vitest";

import { buildConnectionCoverage } from "./connection-coverage";
import type {
  ConnectionSource,
  ConnectionSourceStatus,
} from "./connection-source";
import { buildConnectionSummary } from "./connection-summary";

const EMPTY_COVERAGE = buildConnectionCoverage([], new Map());

const source = (over: Partial<ConnectionSource> = {}): ConnectionSource => ({
  id: "garmin",
  name: "Garmin",
  mark: "G",
  mechanism: "bridge",
  bridgeId: "garmin-bridge",
  status: "connected" as ConnectionSourceStatus,
  bridgeDetected: true,
  disconnected: false,
  needsReauth: false,
  outdated: false,
  sessionVerifiable: true,
  lastSyncAt: undefined,
  importTypes: [],
  exportTypes: [],
  ...over,
});

describe("buildConnectionSummary", () => {
  it("should count detected bridges rather than live sessions", () => {
    // Arrange
    // `tanita-bridge` has no session prober by design — its only session call
    // downloads the whole export CSV — so it is permanently session-inactive.
    // A live-session count would report 1 of 2 with both extensions running.
    const sources = [
      source(),
      source({
        id: "tanita",
        bridgeId: "tanita-bridge",
        status: "installed",
        sessionVerifiable: false,
      }),
    ];

    // Act
    const summary = buildConnectionSummary(sources, EMPTY_COVERAGE);

    // Assert
    expect(summary.detected).toBe(2);
    expect(summary.detectedTotal).toBe(2);
  });

  it("should leave non-bridge sources out of both halves of the count", () => {
    // Arrange
    // Manual entry and the unsupported brands are rendered as cards but have
    // no extension to detect; counting them would put the denominator out of
    // reach for every user.
    const sources = [
      source(),
      source({
        id: "manual",
        mechanism: "manual",
        bridgeId: null,
        status: "manual",
        bridgeDetected: false,
      }),
      source({
        id: "strava",
        mechanism: "not-supported",
        bridgeId: null,
        status: "unsupported",
        bridgeDetected: false,
      }),
    ];

    // Act
    const summary = buildConnectionSummary(sources, EMPTY_COVERAGE);

    // Assert
    expect(summary.detected).toBe(1);
    expect(summary.detectedTotal).toBe(1);
  });

  it("should count attention with the predicate the cards are marked by", () => {
    // Arrange
    // A card rendered amber that the counter above it reads as zero is the
    // failure this shares one derivation to prevent.
    const sources = [source(), source({ id: "whoop", status: "attention" })];

    // Act
    const summary = buildConnectionSummary(sources, EMPTY_COVERAGE);

    // Assert
    expect(summary.attention).toBe(1);
  });

  it("should report the newest last sync and the source that wrote it", () => {
    // Arrange
    const sources = [
      source({ lastSyncAt: "2026-07-20T10:00:00.000Z" }),
      source({
        id: "whoop",
        name: "WHOOP",
        lastSyncAt: "2026-07-25T09:00:00.000Z",
      }),
    ];

    // Act
    const summary = buildConnectionSummary(sources, EMPTY_COVERAGE);

    // Assert
    expect(summary.lastSync).toEqual({
      at: "2026-07-25T09:00:00.000Z",
      sourceName: "WHOOP",
    });
  });

  it("should ignore a stored sync time that does not parse", () => {
    // Arrange
    // `coachingSyncState` rows are written by five separate use cases; one
    // unparseable value must not render as `Invalid Date` in the headline.
    const sources = [
      source({ lastSyncAt: "not-a-date" }),
      source({
        id: "whoop",
        name: "WHOOP",
        lastSyncAt: "2026-07-25T09:00:00.000Z",
      }),
    ];

    // Act
    const summary = buildConnectionSummary(sources, EMPTY_COVERAGE);

    // Assert
    expect(summary.lastSync?.sourceName).toBe("WHOOP");
  });

  it("should report no last sync when nothing has ever synced", () => {
    // Arrange
    // The reachable state on a fresh profile: extensions present, no import
    // has run yet.

    // Act
    const summary = buildConnectionSummary([source()], EMPTY_COVERAGE);

    // Assert
    expect(summary.lastSync).toBeUndefined();
  });
});
