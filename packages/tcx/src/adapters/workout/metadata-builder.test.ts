import type { KRD } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { addKaiordMetadata } from "./metadata-builder";

const createKrd = (overrides: Partial<KRD["metadata"]> = {}): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: {
    created: "2024-01-15T10:00:00Z",
    sport: "cycling",
    ...overrides,
  },
  extensions: {},
});

describe("addKaiordMetadata", () => {
  it.each([
    ["created", "@_kaiord:timeCreated", "2024-01-15T10:00:00Z"],
    ["manufacturer", "@_kaiord:manufacturer", "Garmin"],
    ["product", "@_kaiord:product", "Edge 1040"],
    ["serialNumber", "@_kaiord:serialNumber", "ABC123"],
  ])("should add %s as the %s attribute", (field, expectedAttr, value) => {
    // Arrange
    const trainingCenterDatabase: Record<string, unknown> = {};
    const krd = createKrd({ [field]: value } as Partial<KRD["metadata"]>);

    // Act
    addKaiordMetadata(trainingCenterDatabase, krd);

    // Assert
    expect(trainingCenterDatabase[expectedAttr]).toBe(value);
  });

  it("should not add undefined metadata fields", () => {
    // Arrange
    const trainingCenterDatabase: Record<string, unknown> = {};
    const krd = createKrd();
    krd.metadata.manufacturer = undefined;
    krd.metadata.product = undefined;
    krd.metadata.serialNumber = undefined;

    // Act
    addKaiordMetadata(trainingCenterDatabase, krd);

    // Assert
    expect(trainingCenterDatabase["@_kaiord:manufacturer"]).toBeUndefined();
    expect(trainingCenterDatabase["@_kaiord:product"]).toBeUndefined();
    expect(trainingCenterDatabase["@_kaiord:serialNumber"]).toBeUndefined();
  });

  it("should not overwrite existing attributes", () => {
    // Arrange
    const trainingCenterDatabase: Record<string, unknown> = {
      "@_xmlns": "http://example.com",
    };
    const krd = createKrd({ created: "2024-01-15T10:00:00Z" });

    // Act
    addKaiordMetadata(trainingCenterDatabase, krd);

    // Assert
    expect(trainingCenterDatabase["@_xmlns"]).toBe("http://example.com");
    expect(trainingCenterDatabase["@_kaiord:timeCreated"]).toBe(
      "2024-01-15T10:00:00Z"
    );
  });
});
