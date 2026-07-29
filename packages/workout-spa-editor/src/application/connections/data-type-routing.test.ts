import type { ManagedDataType } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import type { DataFlowsByType } from "../../components/organisms/ProfileManager/components/useDataFlows";
import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";
import type { IntegrationPolicy } from "../../types/integration-policy";
import {
  buildDataTypeRoutingRows,
  type DataTypeRoutingRow,
} from "./data-type-routing";

const route = (bridgeId: string, enabled = true): IntegrationPolicy =>
  ({ bridgeId, enabled }) as IntegrationPolicy;

const flows = (
  entries: Partial<
    Record<
      ManagedDataType,
      { import?: IntegrationPolicy[]; export?: IntegrationPolicy[] }
    >
  >
): DataFlowsByType =>
  new Map(
    Object.entries(entries).map(([dataType, value]) => [
      dataType as ManagedDataType,
      { import: value?.import ?? [], export: value?.export ?? [] },
    ])
  );

const rowFor = (
  rows: DataTypeRoutingRow[],
  dataType: ManagedDataType
): DataTypeRoutingRow => {
  const row = rows.find((candidate) => candidate.dataType === dataType);
  if (row === undefined) throw new Error(`no row for ${dataType}`);
  return row;
};

const priority = (
  dataType: ManagedDataType,
  sourceOrder: string[]
): DataTypeSourcePolicy =>
  ({ dataType, mode: "priority", sourceOrder }) as DataTypeSourcePolicy;

describe("buildDataTypeRoutingRows", () => {
  it("should treat manual entry as a source where a manual path exists", () => {
    // Arrange
    // The state of a profile that has linked nothing yet — the first thing
    // anyone opening the page sees. `sleep` has a manual entry path, so it is
    // never sourceless even with no bridge at all.
    const rows = buildDataTypeRoutingRows(flows({}), []);

    // Act
    const origin = rowFor(rows, "sleep").origin;

    // Assert
    expect(origin).toEqual({ kind: "only", sourceId: "manual" });
  });

  it("should report no source only for a type with no manual path", () => {
    // Arrange
    // Same empty profile. `planned-session` is deliberately absent from
    // MANUAL_ENTRY_TYPES (there is no way to author a coach session by hand),
    // so it is one of the four types where "No source" is reachable at all.
    const rows = buildDataTypeRoutingRows(flows({}), []);

    // Act
    const origin = rowFor(rows, "planned-session").origin;

    // Assert
    expect(origin).toEqual({ kind: "none" });
  });

  it("should count sources rather than name one in the default union mode", () => {
    // Arrange
    // One enabled Garmin sleep route plus the always-present manual path is
    // already two sources, and union — the DEFAULT with no policy row — keeps
    // both records with nothing ranking them. Naming Garmin here would be
    // reporting write order as a choice the user never made.
    const rows = buildDataTypeRoutingRows(
      flows({ sleep: { import: [route("garmin-bridge")] } }),
      []
    );

    // Act
    const origin = rowFor(rows, "sleep").origin;

    // Assert
    expect(origin).toEqual({ kind: "unranked", count: 2 });
  });

  it("should name the priority head once the user has ranked the sources", () => {
    // Arrange
    // The Data Hub's source-priority editor writes exactly this row, and the
    // head it stores is the one resolveEffectiveSource consults first.
    const rows = buildDataTypeRoutingRows(
      flows({
        weight: {
          import: [route("garmin-bridge"), route("trainingpeaks-bridge")],
        },
      }),
      [priority("weight", ["trainingpeaks-bridge", "garmin-bridge"])]
    );

    // Act
    const origin = rowFor(rows, "weight").origin;

    // Assert
    expect(origin).toEqual({
      kind: "primary",
      sourceId: "trainingpeaks",
      count: 3,
    });
  });

  it("should not name a head when a priority policy ranks nothing", () => {
    // Arrange
    // Reachable through chat: `set_data_route` counts the RAW sourceOrder, so
    // ["strava"] passes its length check and then resolves to nothing, leaving
    // a persisted priority policy with an empty order. Naming sources[0] here
    // would attribute sleep to whichever import route was created first.
    const rows = buildDataTypeRoutingRows(
      flows({ sleep: { import: [route("garmin-bridge")] } }),
      [priority("sleep", [])]
    );

    // Act
    const origin = rowFor(rows, "sleep").origin;

    // Assert
    expect(origin).toEqual({ kind: "unranked", count: 2 });
  });

  it("should not name a head that is no longer an enabled source", () => {
    // Arrange
    // The same shape reached through the Data Hub alone: rank Garmin, then
    // switch Garmin's import off and WHOOP's on. The saved order still exists
    // but pins nothing available, and WHOOP was never ranked.
    const rows = buildDataTypeRoutingRows(
      flows({ sleep: { import: [route("whoop-bridge")] } }),
      [priority("sleep", ["garmin-bridge"])]
    );

    // Act
    const origin = rowFor(rows, "sleep").origin;

    // Assert
    expect(origin).toEqual({ kind: "unranked", count: 2 });
  });

  it("should drop an import route the user switched off", () => {
    // Arrange
    // Toggling a Data Hub cell off writes enabled:false rather than deleting
    // the row, so a disabled route stays visible to this derivation.
    const rows = buildDataTypeRoutingRows(
      flows({ weight: { import: [route("garmin-bridge", false)] } }),
      []
    );

    // Act
    const origin = rowFor(rows, "weight").origin;

    // Assert
    expect(origin).toEqual({ kind: "only", sourceId: "manual" });
  });

  it("should list an export target only while its route is enabled", () => {
    // Arrange
    const enabled = flows({ workout: { export: [route("garmin-bridge")] } });
    const off = flows({ workout: { export: [route("garmin-bridge", false)] } });

    // Act
    const on = rowFor(buildDataTypeRoutingRows(enabled, []), "workout");
    const paused = rowFor(buildDataTypeRoutingRows(off, []), "workout");

    // Assert
    expect(on.sentTo).toEqual(["garmin"]);
    expect(paused.sentTo).toEqual([]);
  });

  it("should mark only the two types that can be exported at all", () => {
    // Arrange
    // Eleven of thirteen have no export capability in MANAGED_DATA_REGISTRY,
    // so the design's "Also sent to · Nowhere" on Planned Session, Training
    // Zones and Weight describes a route that cannot be created. If a future
    // registry entry gains an export token, this fails and that copy decision
    // gets revisited rather than silently widening.
    const rows = buildDataTypeRoutingRows(flows({}), []);

    // Act
    const exportable = rows
      .filter((row) => row.exportable)
      .map((row) => row.dataType);

    // Assert
    expect(exportable).toEqual(["workout", "body-composition"]);
  });
});
