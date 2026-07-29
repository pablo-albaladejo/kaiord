import type { ManagedDataType } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { getTranslate } from "../../i18n/use-translate";
import { buildConnectionConsequence } from "./connection-consequence";
import type { ConnectionCoverage } from "./connection-coverage";
import type { ConnectionSource } from "./connection-source";

const t = getTranslate("connections");

/**
 * A date-time with no timezone designator parses as LOCAL time, so this is
 * local noon on 2026-07-25 wherever the runner is: the asserted calendar day
 * holds in every timezone, and it is the LOCAL day being asserted.
 */
const LAST_SYNC_AT = new Date("2026-07-25T12:00:00").toISOString();

const source = (over: Partial<ConnectionSource> = {}): ConnectionSource => ({
  id: "whoop",
  name: "WHOOP",
  mark: "Wh",
  mechanism: "bridge",
  bridgeId: "whoop-bridge",
  status: "attention",
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

const coverage = (
  paused: ManagedDataType[],
  broken: ManagedDataType[] = paused
): ConnectionCoverage => ({ covered: [], broken, paused, total: 13 });

describe("buildConnectionConsequence", () => {
  it("should render nothing while no source needs attention", () => {
    // Arrange
    const sources = [source({ status: "connected" })];

    // Act
    const consequence = buildConnectionConsequence(sources, coverage([]), t);

    // Assert
    // A banner that renders on a healthy page is a permanent false alarm.
    expect(consequence).toBeNull();
  });

  it("should name the paused types instead of claiming a fallback", () => {
    // Arrange
    // `union` is the default multi-source mode and has no winner, so no source
    // ever "takes over" for another. Naming one would be an invention.
    const sources = [source()];

    // Act
    const consequence = buildConnectionConsequence(
      sources,
      coverage(["sleep", "hrv"]),
      t
    );

    // Assert
    expect(consequence?.detail).toContain("No source is sending Sleep, HRV");
    expect(consequence?.detail).not.toMatch(/fell back|fallen back/i);
  });

  it("should name the source and the failed read without naming a cause", () => {
    // Arrange
    // No bridge distinguishes an expired credential from one never issued —
    // `probeWhoopSession` leaves `needsReauth` false either way — and none
    // distinguishes either from a provider outage.
    const sources = [source()];

    // Act
    const consequence = buildConnectionConsequence(sources, coverage([]), t);

    // Assert
    expect(consequence?.title).toBe("Kaiord cannot read from WHOOP");
    // Stems, not whole punctuated words: /expired/ alone lets "expires" and
    // "expiry" through, and /signed out,/ lets "signed out." through.
    expect(consequence?.title).not.toMatch(/expir/i);
    expect(consequence?.title).not.toMatch(/sign(?:ed|ing)?[\s-]*out|signout/i);
  });

  it("should date the consequence from the last data received", () => {
    // Arrange
    // `lastCheckedAt` is when the SPA last probed, so after a reload it reads
    // as seconds ago however long the source has been down. `lastSyncAt` is
    // persisted and survives that reload.
    const sources = [source({ lastSyncAt: LAST_SYNC_AT })];

    // Act
    const consequence = buildConnectionConsequence(
      sources,
      coverage(["sleep"]),
      t
    );

    // Assert
    expect(consequence?.detail).toContain("No new data since 2026-07-25.");
    expect(consequence?.detail).not.toMatch(/stopped syncing/i);
  });

  it("should not attach one source's date when several are affected", () => {
    // Arrange
    // Two bridges break at different times routinely — a shared date would be
    // wrong for at least one of them.
    const sources = [
      source({ lastSyncAt: LAST_SYNC_AT }),
      source({ id: "trainingpeaks", name: "TrainingPeaks" }),
    ];

    // Act
    const consequence = buildConnectionConsequence(
      sources,
      coverage(["weight"]),
      t
    );

    // Assert
    expect(consequence?.title).toBe("2 sources need attention");
    expect(consequence?.detail).not.toContain("No new data since");
  });

  it("should ignore a stored sync time that does not parse", () => {
    // Arrange
    const sources = [source({ lastSyncAt: "not-a-date" })];

    // Act
    const consequence = buildConnectionConsequence(
      sources,
      coverage(["sleep"]),
      t
    );

    // Assert
    expect(consequence?.detail).not.toMatch(/Invalid Date/);
  });

  it("should tell the reader to update an out-of-date bridge, not to sign in", () => {
    // Arrange
    // The probe SUCCEEDED and answered in a protocol version this build cannot
    // read. Signing in again fixes nothing, so the sign-in line would send the
    // reader round a loop that cannot end.
    const sources = [source({ outdated: true })];

    // Act
    const consequence = buildConnectionConsequence(sources, coverage([]), t);

    // Assert
    expect(consequence?.title).toBe("WHOOP's browser bridge is out of date");
  });

  it("should not name a cause that holds for only one of several sources", () => {
    // Arrange
    // One out-of-date extension does not make the other one out of date.
    const sources = [
      source({ outdated: true }),
      source({ id: "trainingpeaks", name: "TrainingPeaks" }),
    ];

    // Act
    const consequence = buildConnectionConsequence(sources, coverage([]), t);

    // Assert
    expect(consequence?.title).toBe("2 sources need attention");
  });

  it("should say nothing stopped while another source still delivers", () => {
    // Arrange
    // WHOOP is signed out with only its `weight` route on, and Tanita imports
    // `weight` too and is installed — the shape of connection-coverage's own
    // "pause a type only when no other source still delivers it" case. WHOOP
    // has a last sync because any past import wrote one, which is ordinary.
    const sources = [source({ lastSyncAt: LAST_SYNC_AT })];

    // Act
    const consequence = buildConnectionConsequence(
      sources,
      coverage([], ["weight"]),
      t
    );

    // Assert
    expect(consequence?.detail).toContain("Nothing has stopped");
    // The date qualifies a loss. Appended here it contradicts the sentence it
    // is joined to: "Nothing has stopped … No new data since 2026-07-25."
    expect(consequence?.detail).not.toContain("No new data since");
  });

  it("should say nothing stopped when the broken source feeds no route", () => {
    // Arrange
    // Reachable on a fresh profile: an extension is installed and signed out
    // before any import route has ever been switched on for it. It still
    // carries a last sync from before the routes were switched off.
    const sources = [source({ lastSyncAt: LAST_SYNC_AT })];

    // Act
    const consequence = buildConnectionConsequence(
      sources,
      coverage([], []),
      t
    );

    // Assert
    expect(consequence?.detail).toContain("No data routes are switched on");
    expect(consequence?.detail).not.toContain("No new data since");
  });
});
