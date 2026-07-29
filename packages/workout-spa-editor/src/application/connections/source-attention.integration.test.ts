/**
 * The attention model over the REAL registry, the REAL prober map and the
 * REAL default store row, rather than over hand-written card fixtures.
 *
 * Each case below names the state it fails on and the writer that produces
 * that state, because the states this file is about are ones a fixture can
 * describe but the app can never reach — and a test pinned to one of those
 * stays green while the reachable failure goes unguarded.
 */
import { describe, expect, it } from "vitest";

import { undiscoveredEntry } from "../../adapters/bridge/bridge-connection-entries";
import { hasSessionProbe } from "../../adapters/bridge/bridge-session-probes";
import { INTEGRATION_REGISTRY } from "../../integrations/integration-registry";
import type { ConnectionSourceSignals } from "./build-connection-sources";
import { buildConnectionSources } from "./build-connection-sources";
import { buildConnectionAttention } from "./source-attention";

const PROBED_AT = 1_700_000_000_000;

/** Nothing discovered, nothing recorded — exactly what the store's snapshot
    reader returns for every known bridge before its first refresh pass. */
const coldSignals = (): ConnectionSourceSignals => ({
  record: () => undefined,
  session: (bridgeId) => undiscoveredEntry(bridgeId),
  isDiscovered: () => false,
  hasSessionProbe,
  lastSyncAt: () => undefined,
  announces: () => false,
  supportsRoute: () => false,
});

const attentionOf = (signals: ConnectionSourceSignals) =>
  buildConnectionAttention(
    buildConnectionSources(INTEGRATION_REGISTRY, signals)
  );

describe("connection attention over the real registry", () => {
  it("should stay silent before the first discovery pass", () => {
    // Arrange
    // Reachable state: app boot. `bridge-connection-store` mounts via
    // `use-store-hydration`, and until `refreshConnections` completes its
    // first pass `createSnapshotReader` answers every known bridge with
    // `undiscoveredEntry` — the writer of this exact row.
    const signals = coldSignals();

    // Act
    const attention = attentionOf(signals);

    // Assert
    expect(attention).toBeNull();
  });

  it("should read Tanita as installed and never count it", () => {
    // Arrange
    // Reachable state: the Tanita extension is installed and has announced
    // itself, so `refreshBridge` writes `{...undiscoveredEntry, discovered:
    // true}` — the no-prober branch — and never messages it again. There is
    // no entry for it in `SESSION_PROBES` because its only session call
    // downloads the whole export CSV.
    //
    // The card's STATUS is asserted as well as the count. Tanita's row is
    // permanently `lastCheckedAt: null`, which two separate guards reject,
    // so a count-only assertion survives deleting the no-prober guard and
    // proves nothing about it. The status is what tells them apart:
    // "installed" (nothing can check this) versus "checking" (we asked and
    // are waiting).
    const signals: ConnectionSourceSignals = {
      ...coldSignals(),
      session: (bridgeId) => ({
        ...undiscoveredEntry(bridgeId),
        discovered: true,
      }),
      isDiscovered: (bridgeId) => bridgeId === "tanita-bridge",
    };

    // Act
    const sources = buildConnectionSources(INTEGRATION_REGISTRY, signals);
    const tanita = sources.find(
      (source) => source.bridgeId === "tanita-bridge"
    );
    const attention = buildConnectionAttention(sources);

    // Assert
    expect(hasSessionProbe("tanita-bridge")).toBe(false);
    expect(tanita?.status).toBe("installed");
    expect(attention).toBeNull();
  });

  it("should count a probed bridge whose session came back inactive", () => {
    // Arrange
    // Reachable state: WHOOP is installed but signed out. `probeWhoopSession`
    // reads `readWhoopStatus`, gets `connected: false`, and writes
    // `inactive()` — sessionActive false, error null, needsReauth false —
    // stamped with `lastCheckedAt`.
    const signals: ConnectionSourceSignals = {
      ...coldSignals(),
      session: (bridgeId) => ({
        ...undiscoveredEntry(bridgeId),
        discovered: true,
        lastCheckedAt: PROBED_AT,
      }),
      isDiscovered: (bridgeId) => bridgeId === "whoop-bridge",
    };

    // Act
    const attention = attentionOf(signals);

    // Assert
    expect(attention).toEqual({ count: 1, cause: { kind: "signedOut" } });
  });

  it("should stay silent for a bridge whose extension id changed mid-probe", () => {
    // Arrange
    // Reachable state: `probeBridge` finishes a probe, finds `getExtensionId`
    // now returns a DIFFERENT non-null id, and writes
    // `{...undiscoveredEntry, discovered: true}` — releasing `checking` while
    // dropping the answer. That row is discovered, not checking, and has
    // never been answered for, so it is unknown rather than broken.
    const signals: ConnectionSourceSignals = {
      ...coldSignals(),
      session: (bridgeId) => ({
        ...undiscoveredEntry(bridgeId),
        discovered: true,
        checking: false,
      }),
      isDiscovered: (bridgeId) => bridgeId === "garmin-bridge",
    };

    // Act
    const attention = attentionOf(signals);

    // Assert
    expect(attention).toBeNull();
  });

  it("should stay silent while a discovered bridge's first probe is pending", () => {
    // Arrange
    // Reachable state: discovery has just announced Garmin and
    // `refreshConnections` has set `checking` on it, but no answer has come
    // back. Not knowing is not the same claim as broken.
    const signals: ConnectionSourceSignals = {
      ...coldSignals(),
      session: (bridgeId) => ({
        ...undiscoveredEntry(bridgeId),
        discovered: true,
        checking: true,
      }),
      isDiscovered: (bridgeId) => bridgeId === "garmin-bridge",
    };

    // Act
    const attention = attentionOf(signals);

    // Assert
    expect(attention).toBeNull();
  });
});
