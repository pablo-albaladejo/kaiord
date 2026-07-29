import { describe, expect, it } from "vitest";

import type { IntegrationRegistryEntry } from "../../integrations/integration-registry";
import {
  type BridgeSessionSignal,
  bridgeSourceStatus,
  sourceStatus,
} from "./connection-source-status";

const CHECKED_AT = 1_700_000_000_000;

/* `hasProbe` is the axis under test throughout, so it is always passed
   explicitly rather than defaulted — the defect these tests pin was a status
   inferred from a state shape that two different bridges reach. */
const PROBED = true;
const PROBELESS = false;
const LINKED = true;

const session = (
  over: Partial<BridgeSessionSignal> = {}
): BridgeSessionSignal =>
  ({
    sessionActive: true,
    checking: false,
    error: null,
    needsReauth: false,
    outdated: false,
    lastCheckedAt: CHECKED_AT,
    ...over,
  }) satisfies BridgeSessionSignal;

const entry = (
  mechanism: IntegrationRegistryEntry["mechanism"]
): IntegrationRegistryEntry => ({
  id: "x",
  name: "X",
  mark: "X",
  mechanism,
  bridgeId: mechanism === "bridge" ? "x-bridge" : null,
});

describe("bridgeSourceStatus", () => {
  it("should report a live session as connected", () => {
    // Arrange
    const state = session();

    // Act
    const result = bridgeSourceStatus(state, LINKED, PROBED);

    // Assert
    expect(result).toBe("connected");
  });

  it("should report a bridge with no prober as installed", () => {
    // Arrange
    // A bridge with no prober can never report a live session, so "installed"
    // is all that can be claimed. The state shape is deliberately identical to
    // the probed case below — only `hasProbe` differs.
    const state = session({ sessionActive: false, lastCheckedAt: null });

    // Act
    const result = bridgeSourceStatus(state, LINKED, PROBELESS);

    // Assert
    expect(result).toBe("installed");
  });

  it("should not call a probed bridge installed when its probe has not answered", () => {
    // Arrange
    // `probeBridge` writes `{...undiscoveredEntry, discovered: true}` when the
    // extension id changes mid-probe, so a PROBED bridge reaches the SAME
    // shape as the probe-less case above. Inferring "has no prober" from it
    // put Tanita's "cannot check without downloading your whole export" copy
    // on a WHOOP card, where it is false.
    const state = session({ sessionActive: false, lastCheckedAt: null });

    // Act
    const result = bridgeSourceStatus(state, LINKED, PROBED);

    // Assert
    expect(result).toBe("checking");
  });

  it("should report an in-flight probe as checking", () => {
    // Arrange
    const state = session({ checking: true, lastCheckedAt: null });

    // Act
    const result = bridgeSourceStatus(state, LINKED, PROBED);

    // Assert
    expect(result).toBe("checking");
  });

  it("should report a probed but inactive session as needing attention", () => {
    // Arrange
    const state = session({ sessionActive: false });

    // Act
    const result = bridgeSourceStatus(state, LINKED, PROBED);

    // Assert
    expect(result).toBe("attention");
  });

  it("should report a probe error as needing attention", () => {
    // Arrange
    const state = session({ error: "boom" });

    // Act
    const result = bridgeSourceStatus(state, LINKED, PROBED);

    // Assert
    expect(result).toBe("attention");
  });

  it("should report an unlinked bridge as available whatever its session says", () => {
    // Arrange
    const state = session();

    // Act
    const result = bridgeSourceStatus(state, !LINKED, PROBED);

    // Assert
    expect(result).toBe("available");
  });

  it("should report a probe-less bridge as available once it stops answering", () => {
    // Arrange
    // The liveness ping is what makes this reachable: without it `connected`
    // could never go false for a bridge nobody disconnected, so "installed"
    // was unfalsifiable.
    const state = session({ sessionActive: false, lastCheckedAt: null });

    // Act
    const result = bridgeSourceStatus(state, !LINKED, PROBELESS);

    // Assert
    expect(result).toBe("available");
  });
});

describe("sourceStatus", () => {
  it("should report manual entry as always on and unsupported brands as such", () => {
    // Arrange
    const manual = entry("manual");
    const strava = entry("not-supported");

    // Act
    const manualStatus = sourceStatus(manual, undefined, !LINKED, PROBELESS);
    const stravaStatus = sourceStatus(strava, undefined, !LINKED, PROBELESS);

    // Assert
    expect(manualStatus).toBe("manual");
    expect(stravaStatus).toBe("unsupported");
  });

  it("should map an api-key provider straight onto its connection record", () => {
    // Arrange
    const intervals = entry("api-key");

    // Act
    const linked = sourceStatus(intervals, undefined, LINKED, PROBELESS);
    const unlinked = sourceStatus(intervals, undefined, !LINKED, PROBELESS);

    // Assert
    expect(linked).toBe("connected");
    expect(unlinked).toBe("available");
  });
});
