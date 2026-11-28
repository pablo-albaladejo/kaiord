import type { ManagedDataType } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import type { DataFlowsByType } from "../../hooks/connections/use-data-flows";
import type { DataTypeSourcePolicy } from "../../types/data-type-source-policy";
import type { IntegrationPolicy } from "../../types/integration-policy";
import { authorityChanges } from "./authority-change";
import { buildDataTypeRoutingRows } from "./data-type-routing";

const route = (bridgeId: string, enabled = true): IntegrationPolicy =>
  ({ bridgeId, enabled }) as IntegrationPolicy;

const flows = (
  entries: Partial<Record<ManagedDataType, IntegrationPolicy[]>>
): DataFlowsByType =>
  new Map(
    Object.entries(entries).map(([dataType, imports]) => [
      dataType as ManagedDataType,
      { import: imports ?? [], export: [] },
    ])
  );

const rows = (
  entries: Partial<Record<ManagedDataType, IntegrationPolicy[]>>,
  choices: DataTypeSourcePolicy[] = []
) => buildDataTypeRoutingRows(flows(entries), choices);

const chose = (
  dataType: ManagedDataType,
  sourceOrder: string[]
): DataTypeSourcePolicy => ({
  profileId: "p1",
  dataType,
  mode: "priority",
  sourceOrder,
});

describe("authorityChanges", () => {
  it("should name the new Platform and the one it replaces when a scale starts deciding weight", () => {
    // Arrange
    const seen = { weight: ["trainingpeaks"] };
    const now = rows({
      weight: [route("trainingpeaks-bridge"), route("tanita-bridge")],
    });

    // Act
    const result = authorityChanges(now, seen);

    // Assert
    expect(result.notices).toEqual([
      { decides: "tanita", replaces: "trainingpeaks", dataTypes: ["weight"] },
    ]);
    expect(result.seen.weight).toEqual(["trainingpeaks", "tanita"]);
  });

  it("should say nothing the first time a kind has a Platform deciding it", () => {
    // Arrange
    const now = rows({
      weight: [route("trainingpeaks-bridge"), route("tanita-bridge")],
    });

    // Act
    const result = authorityChanges(now, {});

    // Assert
    expect(result.notices).toEqual([]);
    expect(result.seen.weight).toEqual(["tanita"]);
  });

  it("should say nothing again once the athlete was told about that Platform for that kind", () => {
    // Arrange
    const seen = { weight: ["trainingpeaks", "tanita"] };
    const now = rows({
      weight: [route("trainingpeaks-bridge"), route("tanita-bridge")],
    });

    // Act
    const result = authorityChanges(now, seen);

    // Assert
    expect(result.notices).toEqual([]);
    expect(result.changed).toBe(false);
  });

  it("should say nothing when a Platform that decided before decides again after a disconnect", () => {
    // Arrange
    const seen = { weight: ["trainingpeaks", "tanita"] };
    const now = rows({
      weight: [route("trainingpeaks-bridge"), route("tanita-bridge", false)],
    });

    // Act
    const result = authorityChanges(now, seen);

    // Assert
    expect(result.notices).toEqual([]);
    expect(result.seen.weight).toEqual(["tanita", "trainingpeaks"]);
  });

  it("should never tell the athlete about a Platform they chose themselves in the matrix", () => {
    // Arrange
    const seen = { weight: ["trainingpeaks"] };
    const now = rows(
      { weight: [route("trainingpeaks-bridge"), route("tanita-bridge")] },
      [chose("weight", ["tanita-bridge"])]
    );

    // Act
    const chosen = authorityChanges(now, seen);
    const matrixOffLater = authorityChanges(
      rows({ weight: [route("trainingpeaks-bridge"), route("tanita-bridge")] }),
      chosen.seen
    );

    // Assert
    expect(chosen.notices).toEqual([]);
    expect(chosen.seen.weight).toEqual(["trainingpeaks", "tanita"]);
    expect(matrixOffLater.notices).toEqual([]);
  });

  it("should give one notice for every kind the same Platform takes from the same one", () => {
    // Arrange
    const seen = { sleep: ["garmin"], hrv: ["garmin"] };
    const both = [route("garmin-bridge"), route("whoop-bridge")];
    const now = rows({ sleep: both, hrv: both });

    // Act
    const result = authorityChanges(now, seen);

    // Assert
    expect(result.notices).toEqual([
      { decides: "whoop", replaces: "garmin", dataTypes: ["sleep", "hrv"] },
    ]);
  });

  it("should say nothing for Activities, which keep every source", () => {
    // Arrange
    const seen = { activity: ["garmin"] };
    const now = rows({
      activity: [route("garmin-bridge"), route("whoop-bridge")],
    });

    // Act
    const result = authorityChanges(now, seen);

    // Assert
    expect(result.notices).toEqual([]);
    expect(result.changed).toBe(false);
  });

  it("should forget nothing about a kind no source sends any more", () => {
    // Arrange
    const seen = { weight: ["trainingpeaks", "tanita"] };

    // Act
    const result = authorityChanges(rows({}), seen);

    // Assert
    expect(result.seen).toEqual(seen);
    expect(result.changed).toBe(false);
  });

  it("should say nothing for Training Zones, which are not health data", () => {
    // Arrange
    const seen = { "training-zones": ["garmin"] };
    const now = rows({
      "training-zones": [route("garmin-bridge"), route("train2go-bridge")],
    });

    // Act
    const result = authorityChanges(now, seen);

    // Assert
    expect(result.notices).toEqual([]);
    expect(result.changed).toBe(false);
  });
});
