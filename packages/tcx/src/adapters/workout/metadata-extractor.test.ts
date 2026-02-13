import { describe, expect, it } from "vitest";
import { extractKaiordMetadata } from "./metadata-extractor";

describe("extractKaiordMetadata", () => {
  it("should extract created timestamp from kaiord attributes", () => {
    const tcd = {
      "@_kaiord:timeCreated": "2024-01-15T10:00:00Z",
    };
    const workout = { sport: "cycling" as const, steps: [] };

    const result = extractKaiordMetadata(tcd, workout);

    expect(result.created).toBe("2024-01-15T10:00:00Z");
  });

  it("should use current date when no created timestamp", () => {
    const tcd = {};
    const workout = { sport: "cycling" as const, steps: [] };

    const result = extractKaiordMetadata(tcd, workout);

    expect(result.created).toBeDefined();
    expect(typeof result.created).toBe("string");
  });

  it("should extract sport from workout", () => {
    const tcd = {};
    const workout = { sport: "running" as const, steps: [] };

    const result = extractKaiordMetadata(tcd, workout);

    expect(result.sport).toBe("running");
  });

  it("should extract subSport from workout", () => {
    const tcd = {};
    const workout = {
      sport: "cycling" as const,
      subSport: "indoor_cycling" as const,
      steps: [],
    };

    const result = extractKaiordMetadata(tcd, workout);

    expect(result.subSport).toBe("indoor_cycling");
  });

  it("should extract manufacturer from kaiord attributes", () => {
    const tcd = {
      "@_kaiord:manufacturer": "Garmin",
    };
    const workout = { sport: "cycling" as const, steps: [] };

    const result = extractKaiordMetadata(tcd, workout);

    expect(result.manufacturer).toBe("Garmin");
  });

  it("should extract product from kaiord attributes", () => {
    const tcd = {
      "@_kaiord:product": "Edge 1040",
    };
    const workout = { sport: "cycling" as const, steps: [] };

    const result = extractKaiordMetadata(tcd, workout);

    expect(result.product).toBe("Edge 1040");
  });

  it("should extract serialNumber from kaiord attributes", () => {
    const tcd = {
      "@_kaiord:serialNumber": "ABC123",
    };
    const workout = { sport: "cycling" as const, steps: [] };

    const result = extractKaiordMetadata(tcd, workout);

    expect(result.serialNumber).toBe("ABC123");
  });

  it("should convert numeric serialNumber to string", () => {
    const tcd = {
      "@_kaiord:serialNumber": 12345,
    };
    const workout = { sport: "cycling" as const, steps: [] };

    const result = extractKaiordMetadata(tcd, workout);

    expect(result.serialNumber).toBe("12345");
  });

  it("should not include manufacturer when not present", () => {
    const tcd = {};
    const workout = { sport: "cycling" as const, steps: [] };

    const result = extractKaiordMetadata(tcd, workout);

    expect(result.manufacturer).toBeUndefined();
  });

  it("should not include product when not present", () => {
    const tcd = {};
    const workout = { sport: "cycling" as const, steps: [] };

    const result = extractKaiordMetadata(tcd, workout);

    expect(result.product).toBeUndefined();
  });

  it("should not include serialNumber when not present", () => {
    const tcd = {};
    const workout = { sport: "cycling" as const, steps: [] };

    const result = extractKaiordMetadata(tcd, workout);

    expect(result.serialNumber).toBeUndefined();
  });

  it("should extract all metadata fields together", () => {
    const tcd = {
      "@_kaiord:timeCreated": "2024-01-15T10:00:00Z",
      "@_kaiord:manufacturer": "Garmin",
      "@_kaiord:product": "Edge 1040",
      "@_kaiord:serialNumber": "ABC123",
    };
    const workout = {
      sport: "cycling" as const,
      subSport: "indoor_cycling" as const,
      steps: [],
    };

    const result = extractKaiordMetadata(tcd, workout);

    expect(result).toStrictEqual({
      created: "2024-01-15T10:00:00Z",
      sport: "cycling",
      subSport: "indoor_cycling",
      manufacturer: "Garmin",
      product: "Edge 1040",
      serialNumber: "ABC123",
    });
  });
});
