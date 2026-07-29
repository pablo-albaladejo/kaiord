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
    // WHOOP is the ONLY bridge announcing `read:sleep`, so this is the whole
    // reachable source set for sleep: one bridge plus the always-present manual
    // path. Union — the DEFAULT with no policy row — keeps both records with
    // nothing ranking them. Writer: the Data Hub sleep/WHOOP import toggle.
    const rows = buildDataTypeRoutingRows(
      flows({ sleep: { import: [route("whoop-bridge")] } }),
      []
    );

    // Act
    const origin = rowFor(rows, "sleep").origin;

    // Assert
    expect(origin).toEqual({ kind: "unranked", count: 2 });
  });

  it("should name the priority head once the user has ranked the sources", () => {
    // Arrange
    // WHOOP and Tanita both announce `read:body`, and Tanita's route filter
    // allows weight, so weight genuinely reaches 2 enabled bridge imports —
    // which is what makes the Data Hub's priority editor list it at all. That
    // editor is the writer; the head it stores is the one
    // resolveEffectiveSource consults first.
    const rows = buildDataTypeRoutingRows(
      flows({
        weight: { import: [route("whoop-bridge"), route("tanita-bridge")] },
      }),
      [priority("weight", ["tanita-bridge", "whoop-bridge"])]
    );

    // Act
    const origin = rowFor(rows, "weight").origin;

    // Assert
    expect(origin).toEqual({ kind: "primary", sourceId: "tanita", count: 3 });
  });

  it("should not name a head when a stored priority order is empty", () => {
    // Arrange
    // `applySourcePolicy` now refuses to mint this, but rows persisted by
    // earlier builds survive in IndexedDB with no migration, so the reader
    // still meets it. Naming sources[0] would attribute sleep to whichever
    // import route happened to be created first.
    const rows = buildDataTypeRoutingRows(
      flows({ sleep: { import: [route("whoop-bridge")] } }),
      [priority("sleep", [])]
    );

    // Act
    const origin = rowFor(rows, "sleep").origin;

    // Assert
    expect(origin).toEqual({ kind: "rankedUnavailable", count: 2 });
  });

  it("should not name a head that is no longer an enabled source", () => {
    // Arrange
    // Live, post-guard path: chat `set_source_policy weight priority ["whoop"]`
    // resolves cleanly and is accepted, then the Data Hub switches WHOOP's
    // weight import off and Tanita's + TrainingPeaks' on. The saved order
    // survives pinning nothing available, and neither remaining bridge was
    // ever ranked.
    const rows = buildDataTypeRoutingRows(
      flows({
        weight: {
          import: [route("tanita-bridge"), route("trainingpeaks-bridge")],
        },
      }),
      [priority("weight", ["whoop-bridge"])]
    );

    // Act
    const origin = rowFor(rows, "weight").origin;

    // Assert
    expect(origin).toEqual({ kind: "rankedUnavailable", count: 3 });
  });

  it("should not name a lone source a ranked order excludes", () => {
    // Arrange
    // Chat `set_source_policy stress priority ["garmin"]` resolves fine, so no
    // writer guard stops it — but Garmin announces only write:workouts,
    // read:activities and write:body, so a Garmin stress import can never be
    // enabled. Manual entry is then the lone source while the resolver's
    // effective order is empty and it returns NOTHING: the pill must not
    // attribute the type to manual entry while the user's typed stress is
    // failing to surface.
    const rows = buildDataTypeRoutingRows(flows({}), [
      priority("stress", ["garmin-bridge"]),
    ]);

    // Act
    const origin = rowFor(rows, "stress").origin;

    // Assert
    expect(origin).toEqual({ kind: "rankedUnavailable", count: 1 });
  });

  it("should drop an import route the user switched off", () => {
    // Arrange
    // Toggling the Data Hub's weight/WHOOP cell off writes enabled:false rather
    // than deleting the row, so a disabled route stays visible to this
    // derivation.
    const rows = buildDataTypeRoutingRows(
      flows({ weight: { import: [route("whoop-bridge", false)] } }),
      []
    );

    // Act
    const origin = rowFor(rows, "weight").origin;

    // Assert
    expect(origin).toEqual({ kind: "only", sourceId: "manual" });
  });

  it("should list an export target only while its route is enabled", () => {
    // Arrange
    // Garmin announces `write:workouts` with no route restriction, so this is
    // the one export the Data Hub can genuinely switch on.
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
