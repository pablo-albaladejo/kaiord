import { describe, expect, it } from "vitest";
import { mapEquipmentToFit, mapEquipmentToKrd } from "./equipment.mapper";

describe("mapEquipmentToKrd", () => {
  it("should map valid FIT equipment to KRD", () => {
    // Arrange & Act
    const result = mapEquipmentToKrd("swimFins");

    // Assert
    expect(result).toBe("swim_fins");
  });

  it("should map 1:1 FIT equipment to KRD", () => {
    // Arrange & Act
    const result = mapEquipmentToKrd("none");

    // Assert
    expect(result).toBe("none");
  });

  it("should return none for invalid FIT equipment", () => {
    // Arrange & Act
    const result = mapEquipmentToKrd("invalid");

    // Assert
    expect(result).toBe("none");
  });

  it("should handle null gracefully", () => {
    // Arrange & Act
    const result = mapEquipmentToKrd(null);

    // Assert
    expect(result).toBe("none");
  });

  it("should handle undefined gracefully", () => {
    // Arrange & Act
    const result = mapEquipmentToKrd(undefined);

    // Assert
    expect(result).toBe("none");
  });

  it("should handle number gracefully", () => {
    // Arrange & Act
    const result = mapEquipmentToKrd(123);

    // Assert
    expect(result).toBe("none");
  });
});

describe("mapEquipmentToFit", () => {
  it("should map valid KRD equipment to FIT", () => {
    // Arrange & Act
    const result = mapEquipmentToFit("swim_fins");

    // Assert
    expect(result).toBe("swimFins");
  });

  it("should map 1:1 KRD equipment to FIT", () => {
    // Arrange & Act
    const result = mapEquipmentToFit("none");

    // Assert
    expect(result).toBe("none");
  });

  it("should return none for invalid KRD equipment", () => {
    // Arrange & Act
    const result = mapEquipmentToFit("invalid");

    // Assert
    expect(result).toBe("none");
  });

  it("should handle null gracefully", () => {
    // Arrange & Act
    const result = mapEquipmentToFit(null);

    // Assert
    expect(result).toBe("none");
  });

  it("should handle undefined gracefully", () => {
    // Arrange & Act
    const result = mapEquipmentToFit(undefined);

    // Assert
    expect(result).toBe("none");
  });

  it("should handle number gracefully", () => {
    // Arrange & Act
    const result = mapEquipmentToFit(123);

    // Assert
    expect(result).toBe("none");
  });
});

describe("round-trip conversion", () => {
  it("should preserve equipment through FIT -> KRD -> FIT", () => {
    // Arrange
    const fitEquipment = "swimFins";

    // Act
    const krdEquipment = mapEquipmentToKrd(fitEquipment);
    const roundTripped = mapEquipmentToFit(krdEquipment);

    // Assert
    expect(roundTripped).toBe(fitEquipment);
  });

  it("should preserve equipment through KRD -> FIT -> KRD", () => {
    // Arrange
    const krdEquipment = "swim_fins";

    // Act
    const fitEquipment = mapEquipmentToFit(krdEquipment);
    const roundTripped = mapEquipmentToKrd(fitEquipment);

    // Assert
    expect(roundTripped).toBe(krdEquipment);
  });

  it("should preserve 1:1 equipment through round-trip", () => {
    // Arrange
    const equipment = "none";

    // Act
    const fitEquipment = mapEquipmentToFit(equipment);
    const roundTripped = mapEquipmentToKrd(fitEquipment);

    // Assert
    expect(roundTripped).toBe(equipment);
  });
});
