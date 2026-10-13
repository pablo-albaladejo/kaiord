/**
 * Guard for the pruned version registration. `registerKaiordVersions` declares
 * only the versions with an upgrade function, plus the head; the frozen
 * history (`test-utils/kaiord-schema-history.json`) keeps every version ever
 * shipped. These cases fail when an upgrade version is dropped, or when a kept
 * version's schema drifts from what was shipped without a new version.
 */
import { describe, expect, it } from "vitest";

import {
  captureKaiordRegistrations,
  cumulativeStores,
  HISTORY_HEAD,
  HISTORY_VERSIONS,
  historyRegistrations,
  SCHEMA_HISTORY,
} from "../../test-utils/kaiord-schema-history";

const declared = captureKaiordRegistrations();
const declaredVersions = [...declared.keys()].sort((a, b) => a - b);

describe("registerKaiordVersions against the frozen schema history", () => {
  it("should keep every version that has an upgrade function", () => {
    // Arrange
    const upgradeVersions = SCHEMA_HISTORY.filter((e) => e.upgrade).map(
      (e) => e.version
    );

    // Act
    const missing = upgradeVersions.filter(
      (v) => declared.get(v)?.upgrade === undefined
    );

    // Assert
    expect(missing).toEqual([]);
  });

  it("should declare an upgrade only where the frozen history records one", () => {
    // Arrange
    const recorded = new Set(
      SCHEMA_HISTORY.filter((e) => e.upgrade).map((e) => e.version)
    );

    // Act
    const unrecorded = declaredVersions.filter(
      (v) => declared.get(v)?.upgrade !== undefined && !recorded.has(v)
    );

    // Assert
    expect(unrecorded).toEqual([]);
  });

  it("should declare only historical versions, ending at the history head", () => {
    // Arrange
    const known = new Set(HISTORY_VERSIONS);

    // Act
    const unknown = declaredVersions.filter((v) => !known.has(v));
    const head = declaredVersions.at(-1);

    // Assert
    expect(
      unknown,
      "append every new version to test-utils/kaiord-schema-history.json"
    ).toEqual([]);
    expect(head).toBe(HISTORY_HEAD);
  });

  it.each(declaredVersions)(
    "should match the shipped cumulative schema at kept version %i",
    (version) => {
      // Arrange
      const shipped = cumulativeStores(historyRegistrations(), version);

      // Act
      const current = cumulativeStores(declared, version);

      // Assert
      expect(current).toEqual(shipped);
    }
  );
});
