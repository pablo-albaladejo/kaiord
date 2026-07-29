import type { ManagedDataType } from "@kaiord/core";
import { managedDataTypes } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import type { DataFlowsByType } from "../../components/organisms/ProfileManager/components/useDataFlows";
import { MANUAL_ENTRY_TYPES } from "../../integrations/manual-entry-types";
import type { IntegrationPolicy } from "../../types/integration-policy";
import { buildConnectionCoverage } from "./connection-coverage";
import type {
  ConnectionSource,
  ConnectionSourceStatus,
} from "./connection-source";

const source = (
  id: string,
  bridgeId: string,
  status: ConnectionSourceStatus
): ConnectionSource => ({
  id,
  name: id,
  mark: id[0] ?? "?",
  mechanism: "bridge",
  bridgeId,
  status,
  bridgeDetected: status !== "available",
  disconnected: false,
  needsReauth: false,
  outdated: false,
  sessionVerifiable: true,
  lastSyncAt: undefined,
  importTypes: [],
  exportTypes: [],
});

const route = (
  dataType: ManagedDataType,
  bridgeId: string,
  enabled = true
): IntegrationPolicy => ({
  id: `${dataType}-${bridgeId}`,
  profileId: "p1",
  dataType,
  bridgeId,
  direction: "import",
  mode: "auto",
  enabled,
  updatedAt: "2026-07-01T00:00:00.000Z",
});

const flows = (
  entries: ReadonlyArray<[ManagedDataType, IntegrationPolicy[]]>
): DataFlowsByType =>
  new Map(
    entries.map(([dataType, imports]) => [
      dataType,
      { import: imports, export: [] },
    ])
  );

describe("buildConnectionCoverage", () => {
  it("should count a type as covered while an enabled route's source is present", () => {
    // Arrange
    const sources = [source("whoop", "whoop-bridge", "connected")];
    const byDataType = flows([["sleep", [route("sleep", "whoop-bridge")]]]);

    // Act
    const coverage = buildConnectionCoverage(sources, byDataType);

    // Assert
    expect(coverage.covered).toContain("sleep");
    expect(coverage.paused).not.toContain("sleep");
  });

  it("should drop a type whose only enabled route needs attention", () => {
    // Arrange
    // `strain` has no manual-entry path and only WHOOP announces a route for
    // it, so a signed-out WHOOP leaves nothing sending it at all — the counter
    // must not keep claiming it has a source.
    const sources = [source("whoop", "whoop-bridge", "attention")];
    const byDataType = flows([["strain", [route("strain", "whoop-bridge")]]]);

    // Act
    const coverage = buildConnectionCoverage(sources, byDataType);

    // Assert
    expect(coverage.covered).not.toContain("strain");
    expect(coverage.paused).toContain("strain");
  });

  it("should name a manual-entry type as paused while still counting it covered", () => {
    // Arrange
    // Reachable whenever a scale bridge signs out: `weight` can be typed in,
    // so it still has a source, but nobody types a weight in because a bridge
    // broke — the automatic delivery stopped and the banner has to say so.
    // Deriving `paused` as the complement of `covered` would silently drop
    // every manual-entry type from the banner, which is 9 of the 13.
    const sources = [source("tanita", "tanita-bridge", "attention")];
    const byDataType = flows([["weight", [route("weight", "tanita-bridge")]]]);

    // Act
    const coverage = buildConnectionCoverage(sources, byDataType);

    // Assert
    expect(coverage.paused).toContain("weight");
    expect(coverage.covered).toContain("weight");
  });

  it("should pause a type only when no other source still delivers it", () => {
    // Arrange
    // Both bridges import `weight`; one is broken and one is not. Naming this
    // type in the banner would tell the reader their weight stopped arriving
    // while it is still arriving.
    const sources = [
      source("whoop", "whoop-bridge", "attention"),
      source("tanita", "tanita-bridge", "installed"),
    ];
    const byDataType = flows([
      [
        "weight",
        [route("weight", "whoop-bridge"), route("weight", "tanita-bridge")],
      ],
    ]);

    // Act
    const coverage = buildConnectionCoverage(sources, byDataType);

    // Assert
    expect(coverage.broken).toContain("weight");
    expect(coverage.paused).not.toContain("weight");
  });

  it("should keep a type covered while its source is being probed", () => {
    // Arrange
    // Every poll flips a source to `checking` for the duration of the probe.
    // Dropping the type for that window makes the headline count twitch while
    // nothing has actually changed.
    const sources = [source("whoop", "whoop-bridge", "checking")];
    const byDataType = flows([["sleep", [route("sleep", "whoop-bridge")]]]);

    // Act
    const coverage = buildConnectionCoverage(sources, byDataType);

    // Assert
    expect(coverage.covered).toContain("sleep");
  });

  it("should ignore a route the user switched off", () => {
    // Arrange
    // Every importer gates on an ENABLED policy row before touching a bridge,
    // so a disabled route delivers nothing however healthy its source is.
    const sources = [source("whoop", "whoop-bridge", "connected")];
    const byDataType = flows([
      ["strain", [route("strain", "whoop-bridge", false)]],
    ]);

    // Act
    const coverage = buildConnectionCoverage(sources, byDataType);

    // Assert
    expect(coverage.covered).not.toContain("strain");
    expect(coverage.paused).not.toContain("strain");
  });

  it("should cover a manual-entry type with no bridge present at all", () => {
    // Arrange
    // No bridge announces `read:workouts`, so `workout` can never be fed by an
    // extension. Excluding manual entry would put the denominator permanently
    // out of reach — the "5 of 5" defect, one surface over.

    // Act
    const coverage = buildConnectionCoverage([], new Map());

    // Assert
    expect(coverage.covered).toContain("workout");
    expect(coverage.total).toBe(managedDataTypes.length);
  });

  it("should leave a type with no source at all uncovered", () => {
    // Arrange
    // `strain` has no manual-entry path and no enabled route here.

    // Act
    const coverage = buildConnectionCoverage([], new Map());

    // Assert
    expect(coverage.covered).not.toContain("strain");
    // With nothing connected, coverage is exactly the hand-entry set — no
    // bridge route may be counted before a bridge has answered.
    expect(coverage.covered).toHaveLength(MANUAL_ENTRY_TYPES.size);
  });
});
