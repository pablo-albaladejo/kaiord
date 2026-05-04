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
  it("should add created timestamp", () => {
    // Arrange
    const trainingCenterDatabase: Record<string, unknown> = {};
    const krd = createKrd({ created: "2024-01-15T10:00:00Z" });

    // Act
    addKaiordMetadata(trainingCenterDatabase, krd);

    // Assert
    expect(trainingCenterDatabase["@_kaiord:timeCreated"]).toBe(
      "2024-01-15T10:00:00Z"
    );
  });

  it("should add manufacturer", () => {
    // Arrange
    const trainingCenterDatabase: Record<string, unknown> = {};
    const krd = createKrd({ manufacturer: "Garmin" });

    // Act
    addKaiordMetadata(trainingCenterDatabase, krd);

    // Assert
    expect(trainingCenterDatabase["@_kaiord:manufacturer"]).toBe("Garmin");
  });

  it("should add product", () => {
    // Arrange
    const trainingCenterDatabase: Record<string, unknown> = {};
    const krd = createKrd({ product: "Edge 1040" });

    // Act
    addKaiordMetadata(trainingCenterDatabase, krd);

    // Assert
    expect(trainingCenterDatabase["@_kaiord:product"]).toBe("Edge 1040");
  });

  it("should add serial number", () => {
    // Arrange
    const trainingCenterDatabase: Record<string, unknown> = {};
    const krd = createKrd({ serialNumber: "ABC123" });

    // Act
    addKaiordMetadata(trainingCenterDatabase, krd);

    // Assert
    expect(trainingCenterDatabase["@_kaiord:serialNumber"]).toBe("ABC123");
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

  it("should add all metadata fields when present", () => {
    // Arrange
    const trainingCenterDatabase: Record<string, unknown> = {};
    const krd = createKrd({
      created: "2024-01-15T10:00:00Z",
      manufacturer: "Garmin",
      product: "Edge 1040",
      serialNumber: "ABC123",
    });

    // Act
    addKaiordMetadata(trainingCenterDatabase, krd);

    // Assert
    expect(trainingCenterDatabase["@_kaiord:timeCreated"]).toBe(
      "2024-01-15T10:00:00Z"
    );
    expect(trainingCenterDatabase["@_kaiord:manufacturer"]).toBe("Garmin");
    expect(trainingCenterDatabase["@_kaiord:product"]).toBe("Edge 1040");
    expect(trainingCenterDatabase["@_kaiord:serialNumber"]).toBe("ABC123");
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
