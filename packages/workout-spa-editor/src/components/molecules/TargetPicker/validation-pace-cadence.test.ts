import { describe, expect, it } from "vitest";

import {
  validateCadenceRange,
  validateCadenceTarget,
  validatePaceRange,
  validatePaceTarget,
} from "./validation-pace-cadence";
import type { ValidationResult } from "./validation-types";

describe("validatePaceTarget", () => {
  it.each([
    {
      label: "zone-too-low",
      unit: "zone",
      value: 0,
      expected: {
        isValid: false,
        error: "Pace zone must be between 1 and 5",
      } as ValidationResult,
    },
    {
      label: "zone-too-high",
      unit: "zone",
      value: 6,
      expected: {
        isValid: false,
        error: "Pace zone must be between 1 and 5",
      } as ValidationResult,
    },
    {
      label: "zone-non-integer",
      unit: "zone",
      value: 2.5,
      expected: {
        isValid: false,
        error: "Pace zone must be between 1 and 5",
      } as ValidationResult,
    },
    {
      label: "zone-lower-boundary",
      unit: "zone",
      value: 1,
      expected: {
        isValid: true,
        target: {
          type: "pace",
          value: { unit: "zone", value: 1 },
        },
      } as ValidationResult,
    },
    {
      label: "zone-middle",
      unit: "zone",
      value: 3,
      expected: {
        isValid: true,
        target: {
          type: "pace",
          value: { unit: "zone", value: 3 },
        },
      } as ValidationResult,
    },
    {
      label: "zone-upper-boundary",
      unit: "zone",
      value: 5,
      expected: {
        isValid: true,
        target: {
          type: "pace",
          value: { unit: "zone", value: 5 },
        },
      } as ValidationResult,
    },
    {
      label: "mps-too-high",
      unit: "mps",
      value: 21,
      expected: {
        isValid: false,
        error: "Pace cannot exceed 20 m/s",
      } as ValidationResult,
    },
    {
      label: "mps-upper-boundary",
      unit: "mps",
      value: 20,
      expected: {
        isValid: true,
        target: {
          type: "pace",
          value: { unit: "mps", value: 20 },
        },
      } as ValidationResult,
    },
    {
      label: "mps-typical",
      unit: "mps",
      value: 3.5,
      expected: {
        isValid: true,
        target: {
          type: "pace",
          value: { unit: "mps", value: 3.5 },
        },
      } as ValidationResult,
    },
    {
      label: "fall-through-unit",
      unit: "other",
      value: 99,
      expected: {
        isValid: true,
        target: {
          type: "pace",
          value: { unit: "other" as "mps" | "zone", value: 99 },
        },
      } as ValidationResult,
    },
  ])(
    "should return $label result for unit=$unit value=$value",
    ({ unit, value, expected }) => {
      // Arrange

      // Act
      const result = validatePaceTarget(unit, value);

      // Assert
      expect(result).toEqual(expected);
    }
  );
});

describe("validatePaceRange", () => {
  it.each([
    {
      min: 3,
      max: 5,
      expected: {
        isValid: true,
        target: {
          type: "pace",
          value: { unit: "range", min: 3, max: 5 },
        },
      } as ValidationResult,
    },
    {
      min: 0,
      max: 0,
      expected: {
        isValid: true,
        target: {
          type: "pace",
          value: { unit: "range", min: 0, max: 0 },
        },
      } as ValidationResult,
    },
  ])(
    "should build a pace-range target for min=$min max=$max",
    ({ min, max, expected }) => {
      // Arrange

      // Act
      const result = validatePaceRange(min, max);

      // Assert
      expect(result).toEqual(expected);
    }
  );
});

describe("validateCadenceTarget", () => {
  it.each([
    {
      label: "rpm-too-high",
      unit: "rpm",
      value: 301,
      expected: {
        isValid: false,
        error: "Cadence cannot exceed 300 RPM",
      } as ValidationResult,
    },
    {
      label: "rpm-upper-boundary",
      unit: "rpm",
      value: 300,
      expected: {
        isValid: true,
        target: {
          type: "cadence",
          value: { unit: "rpm", value: 300 },
        },
      } as ValidationResult,
    },
    {
      label: "rpm-typical",
      unit: "rpm",
      value: 90,
      expected: {
        isValid: true,
        target: {
          type: "cadence",
          value: { unit: "rpm", value: 90 },
        },
      } as ValidationResult,
    },
    {
      label: "fall-through-unit",
      unit: "other",
      value: 99,
      expected: {
        isValid: true,
        target: {
          type: "cadence",
          value: { unit: "rpm", value: 99 },
        },
      } as ValidationResult,
    },
  ])(
    "should return $label result for unit=$unit value=$value",
    ({ unit, value, expected }) => {
      // Arrange

      // Act
      const result = validateCadenceTarget(unit, value);

      // Assert
      expect(result).toEqual(expected);
    }
  );
});

describe("validateCadenceRange", () => {
  it.each([
    {
      min: 70,
      max: 110,
      expected: {
        isValid: true,
        target: {
          type: "cadence",
          value: { unit: "range", min: 70, max: 110 },
        },
      } as ValidationResult,
    },
  ])(
    "should build a cadence-range target for min=$min max=$max",
    ({ min, max, expected }) => {
      // Arrange

      // Act
      const result = validateCadenceRange(min, max);

      // Assert
      expect(result).toEqual(expected);
    }
  );
});
