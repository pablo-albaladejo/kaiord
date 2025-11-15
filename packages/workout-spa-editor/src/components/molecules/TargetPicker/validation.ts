import type { Target } from "../../../types/krd";

export type ValidationResult = {
  isValid: boolean;
  error?: string;
  target?: Target;
};

/**
 * Validates target value and returns a Target object if valid
 */
export const validateTargetValue = (
  type: "power" | "heart_rate" | "pace" | "cadence" | "open",
  unit: string,
  value: string,
  minValue?: string,
  maxValue?: string
): ValidationResult => {
  if (type === "open") {
    return {
      isValid: true,
      target: { type: "open" },
    };
  }

  // Handle range inputs
  if (unit === "range") {
    const minStr = String(minValue || "");
    const maxStr = String(maxValue || "");

    if (!minStr || minStr.trim() === "") {
      return {
        isValid: false,
        error: "Minimum value is required",
      };
    }

    if (!maxStr || maxStr.trim() === "") {
      return {
        isValid: false,
        error: "Maximum value is required",
      };
    }

    const min = Number(minStr);
    const max = Number(maxStr);

    if (isNaN(min) || isNaN(max)) {
      return {
        isValid: false,
        error: "Values must be valid numbers",
      };
    }

    if (min <= 0 || max <= 0) {
      return {
        isValid: false,
        error: "Values must be greater than 0",
      };
    }

    if (min >= max) {
      return {
        isValid: false,
        error: "Minimum must be less than maximum",
      };
    }

    // Create target based on type
    if (type === "power") {
      return {
        isValid: true,
        target: {
          type: "power",
          value: { unit: "range", min, max },
        },
      };
    }

    if (type === "heart_rate") {
      return {
        isValid: true,
        target: {
          type: "heart_rate",
          value: { unit: "range", min, max },
        },
      };
    }

    if (type === "pace") {
      return {
        isValid: true,
        target: {
          type: "pace",
          value: { unit: "range", min, max },
        },
      };
    }

    if (type === "cadence") {
      return {
        isValid: true,
        target: {
          type: "cadence",
          value: { unit: "range", min, max },
        },
      };
    }
  }

  // Handle single value inputs
  const valueStr = String(value || "");

  if (!valueStr || valueStr.trim() === "") {
    return {
      isValid: false,
      error: "Value is required",
    };
  }

  const numericValue = Number(valueStr);

  if (isNaN(numericValue)) {
    return {
      isValid: false,
      error: "Must be a valid number",
    };
  }

  if (numericValue <= 0) {
    return {
      isValid: false,
      error: "Must be greater than 0",
    };
  }

  // Type-specific validation
  if (type === "power") {
    if (unit === "zone") {
      if (
        !Number.isInteger(numericValue) ||
        numericValue < 1 ||
        numericValue > 7
      ) {
        return {
          isValid: false,
          error: "Power zone must be between 1 and 7",
        };
      }
    } else if (unit === "watts") {
      if (numericValue > 2000) {
        return {
          isValid: false,
          error: "Power cannot exceed 2000 watts",
        };
      }
    } else if (unit === "percent_ftp") {
      if (numericValue > 200) {
        return {
          isValid: false,
          error: "Percentage cannot exceed 200%",
        };
      }
    }

    return {
      isValid: true,
      target: {
        type: "power",
        value: {
          unit: unit as "watts" | "percent_ftp" | "zone",
          value: numericValue,
        },
      },
    };
  }

  if (type === "heart_rate") {
    if (unit === "zone") {
      if (
        !Number.isInteger(numericValue) ||
        numericValue < 1 ||
        numericValue > 5
      ) {
        return {
          isValid: false,
          error: "Heart rate zone must be between 1 and 5",
        };
      }
    } else if (unit === "bpm") {
      if (numericValue > 250) {
        return {
          isValid: false,
          error: "Heart rate cannot exceed 250 BPM",
        };
      }
    } else if (unit === "percent_max") {
      if (numericValue > 100) {
        return {
          isValid: false,
          error: "Percentage cannot exceed 100%",
        };
      }
    }

    return {
      isValid: true,
      target: {
        type: "heart_rate",
        value: {
          unit: unit as "bpm" | "zone" | "percent_max",
          value: numericValue,
        },
      },
    };
  }

  if (type === "pace") {
    if (unit === "zone") {
      if (
        !Number.isInteger(numericValue) ||
        numericValue < 1 ||
        numericValue > 5
      ) {
        return {
          isValid: false,
          error: "Pace zone must be between 1 and 5",
        };
      }
    } else if (unit === "mps") {
      if (numericValue > 20) {
        return {
          isValid: false,
          error: "Pace cannot exceed 20 m/s",
        };
      }
    }

    return {
      isValid: true,
      target: {
        type: "pace",
        value: { unit: unit as "mps" | "zone", value: numericValue },
      },
    };
  }

  if (type === "cadence") {
    if (unit === "rpm") {
      if (numericValue > 300) {
        return {
          isValid: false,
          error: "Cadence cannot exceed 300 RPM",
        };
      }
    }

    return {
      isValid: true,
      target: {
        type: "cadence",
        value: { unit: "rpm", value: numericValue },
      },
    };
  }

  return {
    isValid: false,
    error: "Invalid target type",
  };
};
