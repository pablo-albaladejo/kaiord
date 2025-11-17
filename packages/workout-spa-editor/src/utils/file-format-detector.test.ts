import { describe, expect, it } from "vitest";
import {
  detectFormat,
  getFileExtension,
  getFormatErrorMessage,
  getFormatName,
  getMimeType,
  validateFileFormat,
} from "./file-format-detector";

describe("detectFormat", () => {
  describe("valid formats", () => {
    it("should detect FIT format", () => {
      // Arrange & Act
      const result = detectFormat("workout.fit");

      // Assert
      expect(result).toBe("fit");
    });

    it("should detect TCX format", () => {
      // Arrange & Act
      const result = detectFormat("workout.tcx");

      // Assert
      expect(result).toBe("tcx");
    });

    it("should detect PWX format", () => {
      // Arrange & Act
      const result = detectFormat("workout.pwx");

      // Assert
      expect(result).toBe("pwx");
    });

    it("should detect KRD format", () => {
      // Arrange & Act
      const result = detectFormat("workout.krd");

      // Assert
      expect(result).toBe("krd");
    });

    it("should detect JSON as KRD format", () => {
      // Arrange & Act
      const result = detectFormat("workout.json");

      // Assert
      expect(result).toBe("krd");
    });
  });

  describe("case insensitivity", () => {
    it("should handle uppercase extensions", () => {
      // Arrange & Act
      const result = detectFormat("workout.FIT");

      // Assert
      expect(result).toBe("fit");
    });

    it("should handle mixed case extensions", () => {
      // Arrange & Act
      const result = detectFormat("workout.TcX");

      // Assert
      expect(result).toBe("tcx");
    });
  });

  describe("complex filenames", () => {
    it("should handle filenames with multiple dots", () => {
      // Arrange & Act
      const result = detectFormat("my.workout.file.fit");

      // Assert
      expect(result).toBe("fit");
    });

    it("should handle filenames with paths", () => {
      // Arrange & Act
      const result = detectFormat("/path/to/workout.tcx");

      // Assert
      expect(result).toBe("tcx");
    });

    it("should handle filenames with spaces", () => {
      // Arrange & Act
      const result = detectFormat("my workout file.pwx");

      // Assert
      expect(result).toBe("pwx");
    });
  });

  describe("invalid inputs", () => {
    it("should return null for unsupported extension", () => {
      // Arrange & Act
      const result = detectFormat("workout.txt");

      // Assert
      expect(result).toBeNull();
    });

    it("should return null for empty string", () => {
      // Arrange & Act
      const result = detectFormat("");

      // Assert
      expect(result).toBeNull();
    });

    it("should return null for filename without extension", () => {
      // Arrange & Act
      const result = detectFormat("workout");

      // Assert
      expect(result).toBeNull();
    });

    it("should return null for null input", () => {
      // Arrange & Act
      const result = detectFormat(null as unknown as string);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null for undefined input", () => {
      // Arrange & Act
      const result = detectFormat(undefined as unknown as string);

      // Assert
      expect(result).toBeNull();
    });
  });
});

describe("validateFileFormat", () => {
  it("should return valid result for FIT file", () => {
    // Arrange & Act
    const result = validateFileFormat("workout.fit");

    // Assert
    expect(result).toStrictEqual({
      format: "fit",
      isValid: true,
    });
  });

  it("should return valid result for TCX file", () => {
    // Arrange & Act
    const result = validateFileFormat("workout.tcx");

    // Assert
    expect(result).toStrictEqual({
      format: "tcx",
      isValid: true,
    });
  });

  it("should return valid result for PWX file", () => {
    // Arrange & Act
    const result = validateFileFormat("workout.pwx");

    // Assert
    expect(result).toStrictEqual({
      format: "pwx",
      isValid: true,
    });
  });

  it("should return valid result for KRD file", () => {
    // Arrange & Act
    const result = validateFileFormat("workout.krd");

    // Assert
    expect(result).toStrictEqual({
      format: "krd",
      isValid: true,
    });
  });

  it("should return invalid result with error message for unsupported format", () => {
    // Arrange & Act
    const result = validateFileFormat("workout.txt");

    // Assert
    expect(result.format).toBeNull();
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(
      "Unsupported file format. Supported formats: .fit, .tcx, .pwx, .krd, .json"
    );
  });

  it("should return invalid result for empty filename", () => {
    // Arrange & Act
    const result = validateFileFormat("");

    // Assert
    expect(result.format).toBeNull();
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("getMimeType", () => {
  it("should return correct MIME type for FIT", () => {
    // Arrange & Act
    const result = getMimeType("fit");

    // Assert
    expect(result).toBe("application/octet-stream");
  });

  it("should return correct MIME type for TCX", () => {
    // Arrange & Act
    const result = getMimeType("tcx");

    // Assert
    expect(result).toBe("application/xml");
  });

  it("should return correct MIME type for PWX", () => {
    // Arrange & Act
    const result = getMimeType("pwx");

    // Assert
    expect(result).toBe("application/xml");
  });

  it("should return correct MIME type for KRD", () => {
    // Arrange & Act
    const result = getMimeType("krd");

    // Assert
    expect(result).toBe("application/json");
  });
});

describe("getFileExtension", () => {
  it("should return correct extension for FIT", () => {
    // Arrange & Act
    const result = getFileExtension("fit");

    // Assert
    expect(result).toBe(".fit");
  });

  it("should return correct extension for TCX", () => {
    // Arrange & Act
    const result = getFileExtension("tcx");

    // Assert
    expect(result).toBe(".tcx");
  });

  it("should return correct extension for PWX", () => {
    // Arrange & Act
    const result = getFileExtension("pwx");

    // Assert
    expect(result).toBe(".pwx");
  });

  it("should return correct extension for KRD", () => {
    // Arrange & Act
    const result = getFileExtension("krd");

    // Assert
    expect(result).toBe(".krd");
  });
});

describe("getFormatName", () => {
  it("should return correct name for FIT", () => {
    // Arrange & Act
    const result = getFormatName("fit");

    // Assert
    expect(result).toBe("FIT");
  });

  it("should return correct name for TCX", () => {
    // Arrange & Act
    const result = getFormatName("tcx");

    // Assert
    expect(result).toBe("TCX");
  });

  it("should return correct name for PWX", () => {
    // Arrange & Act
    const result = getFormatName("pwx");

    // Assert
    expect(result).toBe("PWX");
  });

  it("should return correct name for KRD", () => {
    // Arrange & Act
    const result = getFormatName("krd");

    // Assert
    expect(result).toBe("KRD");
  });
});

describe("getFormatErrorMessage", () => {
  it("should return FIT-specific error message", () => {
    // Arrange & Act
    const result = getFormatErrorMessage("fit");

    // Assert
    expect(result).toBe(
      "Failed to parse FIT file. The file may be corrupted or invalid."
    );
  });

  it("should return TCX-specific error message", () => {
    // Arrange & Act
    const result = getFormatErrorMessage("tcx");

    // Assert
    expect(result).toBe(
      "Failed to parse TCX XML. The file may contain invalid XML structure."
    );
  });

  it("should return PWX-specific error message", () => {
    // Arrange & Act
    const result = getFormatErrorMessage("pwx");

    // Assert
    expect(result).toBe(
      "Failed to parse PWX XML. The file may contain invalid XML structure."
    );
  });

  it("should return KRD-specific error message", () => {
    // Arrange & Act
    const result = getFormatErrorMessage("krd");

    // Assert
    expect(result).toBe(
      "Failed to parse KRD JSON. The file may contain invalid JSON or missing required fields."
    );
  });
});
