import { describe, expect, it, vi } from "vitest";
import type { Logger } from "@kaiord/core";
import {
  extractIntensity,
  extractPowerFromExtensions,
  extractExtensions,
} from "./step-helpers";

const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

describe("extractIntensity", () => {
  it("should extract Warmup as warmup", () => {
    const result = extractIntensity({ Intensity: "Warmup" });

    expect(result).toBe("warmup");
  });

  it("should extract Active as active", () => {
    const result = extractIntensity({ Intensity: "Active" });

    expect(result).toBe("active");
  });

  it("should extract Cooldown as cooldown", () => {
    const result = extractIntensity({ Intensity: "Cooldown" });

    expect(result).toBe("cooldown");
  });

  it("should extract Rest as rest", () => {
    const result = extractIntensity({ Intensity: "Rest" });

    expect(result).toBe("rest");
  });

  it("should extract Resting as rest", () => {
    const result = extractIntensity({ Intensity: "Resting" });

    expect(result).toBe("rest");
  });

  it("should handle lowercase warmup", () => {
    const result = extractIntensity({ Intensity: "warmup" });

    expect(result).toBe("warmup");
  });

  it("should return undefined for missing Intensity", () => {
    const result = extractIntensity({});

    expect(result).toBeUndefined();
  });

  it("should return undefined for unknown intensity", () => {
    const result = extractIntensity({ Intensity: "Unknown" });

    expect(result).toBeUndefined();
  });

  it("should return undefined for undefined intensity value", () => {
    const result = extractIntensity({ Intensity: undefined });

    expect(result).toBeUndefined();
  });
});

describe("extractPowerFromExtensions", () => {
  it("should extract Watts from TPX extension", () => {
    const logger = createMockLogger();
    const extensions = {
      TPX: { Watts: 250 },
    };

    const result = extractPowerFromExtensions(extensions, logger);

    expect(result).toBe(250);
    expect(logger.debug).toHaveBeenCalledWith(
      "Found power data in TCX extensions",
      { watts: 250 }
    );
  });

  it("should extract Power from extensions", () => {
    const logger = createMockLogger();
    const extensions = { Power: 200 };

    const result = extractPowerFromExtensions(extensions, logger);

    expect(result).toBe(200);
  });

  it("should return undefined when no power data", () => {
    const logger = createMockLogger();
    const extensions = { HeartRate: 150 };

    const result = extractPowerFromExtensions(extensions, logger);

    expect(result).toBeUndefined();
  });

  it("should return undefined when TPX has no Watts", () => {
    const logger = createMockLogger();
    const extensions = {
      TPX: { HeartRate: 150 },
    };

    const result = extractPowerFromExtensions(extensions, logger);

    expect(result).toBeUndefined();
  });

  it("should return undefined when Power is not a number", () => {
    const logger = createMockLogger();
    const extensions = { Power: "200" };

    const result = extractPowerFromExtensions(extensions, logger);

    expect(result).toBeUndefined();
  });

  it("should return undefined when Watts is not a number", () => {
    const logger = createMockLogger();
    const extensions = {
      TPX: { Watts: "250" },
    };

    const result = extractPowerFromExtensions(extensions, logger);

    expect(result).toBeUndefined();
  });

  it("should prefer TPX.Watts over Power", () => {
    const logger = createMockLogger();
    const extensions = {
      TPX: { Watts: 250 },
      Power: 200,
    };

    const result = extractPowerFromExtensions(extensions, logger);

    expect(result).toBe(250);
  });
});

describe("extractExtensions", () => {
  it("should extract extensions from step", () => {
    const logger = createMockLogger();
    const tcxStep = {
      Extensions: { TPX: { Watts: 250 } },
    };

    const result = extractExtensions(tcxStep, logger);

    expect(result).toStrictEqual({ TPX: { Watts: 250 } });
    expect(logger.debug).toHaveBeenCalledWith(
      "Extracting TCX extensions from step"
    );
  });

  it("should return undefined when no extensions", () => {
    const logger = createMockLogger();
    const tcxStep = { Name: "Step 1" };

    const result = extractExtensions(tcxStep, logger);

    expect(result).toBeUndefined();
  });

  it("should return a shallow copy of extensions", () => {
    const logger = createMockLogger();
    const originalExtensions = { TPX: { Watts: 250 } };
    const tcxStep = { Extensions: originalExtensions };

    const result = extractExtensions(tcxStep, logger);

    expect(result).not.toBe(originalExtensions);
    expect(result).toStrictEqual(originalExtensions);
  });
});
