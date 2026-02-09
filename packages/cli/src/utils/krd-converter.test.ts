import type { Logger } from "@kaiord/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { convertFromKrd, convertToKrd, loadFileAsKrd } from "./krd-converter";

vi.mock("@kaiord/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@kaiord/core")>();
  return {
    ...actual,
    fromBinary: vi.fn().mockResolvedValue({ metadata: { sport: "cycling" } }),
    fromText: vi.fn().mockResolvedValue({ metadata: { sport: "cycling" } }),
    toBinary: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    toText: vi.fn().mockResolvedValue("<output/>"),
  };
});

vi.mock("@kaiord/fit", () => ({
  createFitReader: vi.fn().mockReturnValue(vi.fn()),
  createFitWriter: vi.fn().mockReturnValue(vi.fn()),
}));

vi.mock("@kaiord/tcx", () => ({
  createTcxReader: vi.fn().mockReturnValue(vi.fn()),
  createTcxWriter: vi.fn().mockReturnValue(vi.fn()),
}));

vi.mock("@kaiord/zwo", () => ({
  createZwiftReader: vi.fn().mockReturnValue(vi.fn()),
  createZwiftWriter: vi.fn().mockReturnValue(vi.fn()),
}));

vi.mock("@kaiord/garmin", () => ({
  createGarminReader: vi.fn().mockReturnValue(vi.fn()),
  createGarminWriter: vi.fn().mockReturnValue(vi.fn()),
}));

const mockLogger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

describe("convertToKrd", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should convert FIT buffer to KRD", async () => {
    // Arrange
    const { fromBinary } = await import("@kaiord/core");
    const { createFitReader } = await import("@kaiord/fit");
    const fitData = new Uint8Array([0x2e, 0x46, 0x49, 0x54]);

    // Act
    await convertToKrd(fitData, "fit", mockLogger);

    // Assert
    expect(createFitReader).toHaveBeenCalledWith(mockLogger);
    expect(fromBinary).toHaveBeenCalledWith(
      fitData,
      expect.any(Function),
      mockLogger
    );
  });

  it("should convert TCX string to KRD", async () => {
    // Arrange
    const { fromText } = await import("@kaiord/core");
    const { createTcxReader } = await import("@kaiord/tcx");
    const tcxData = '<?xml version="1.0"?><TrainingCenterDatabase/>';

    // Act
    await convertToKrd(tcxData, "tcx", mockLogger);

    // Assert
    expect(createTcxReader).toHaveBeenCalledWith(mockLogger);
    expect(fromText).toHaveBeenCalledWith(
      tcxData,
      expect.any(Function),
      mockLogger
    );
  });

  it("should convert ZWO string to KRD", async () => {
    // Arrange
    const { fromText } = await import("@kaiord/core");
    const { createZwiftReader } = await import("@kaiord/zwo");
    const zwoData = '<?xml version="1.0"?><workout_file/>';

    // Act
    await convertToKrd(zwoData, "zwo", mockLogger);

    // Assert
    expect(createZwiftReader).toHaveBeenCalledWith(mockLogger);
    expect(fromText).toHaveBeenCalledWith(
      zwoData,
      expect.any(Function),
      mockLogger
    );
  });

  it("should convert GCN string to KRD", async () => {
    // Arrange
    const { fromText } = await import("@kaiord/core");
    const { createGarminReader } = await import("@kaiord/garmin");
    const gcnData = '{"workoutId": 123}';

    // Act
    await convertToKrd(gcnData, "gcn", mockLogger);

    // Assert
    expect(createGarminReader).toHaveBeenCalledWith(mockLogger);
    expect(fromText).toHaveBeenCalledWith(
      gcnData,
      expect.any(Function),
      mockLogger
    );
  });

  it("should parse KRD JSON string", async () => {
    // Arrange
    const validKrd = {
      version: "1.0",
      type: "structured_workout",
      metadata: { created: "2025-01-01T00:00:00Z", sport: "running" },
    };
    const krdData = JSON.stringify(validKrd);

    // Act
    const result = await convertToKrd(krdData, "krd", mockLogger);

    // Assert
    expect(result).toEqual(validKrd);
  });

  it("should throw for unsupported format", async () => {
    // Arrange
    const data = "some data";

    // Act & Assert
    await expect(convertToKrd(data, "invalid", mockLogger)).rejects.toThrow(
      "Unsupported format: invalid"
    );
  });

  it("should throw when FIT format receives string", async () => {
    // Arrange
    const data = "string data";

    // Act & Assert
    await expect(convertToKrd(data, "fit", mockLogger)).rejects.toThrow(
      "FIT input must be Uint8Array"
    );
  });

  it("should throw when text format receives Uint8Array", async () => {
    // Arrange
    const data = new Uint8Array([1, 2, 3]);

    // Act & Assert
    await expect(convertToKrd(data, "tcx", mockLogger)).rejects.toThrow(
      "TCX input must be string"
    );
  });
});

describe("convertFromKrd", () => {
  const mockKrd = {
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2025-01-01T00:00:00Z", sport: "cycling" },
  } as Parameters<typeof convertFromKrd>[0];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should convert KRD to FIT", async () => {
    // Arrange
    const { toBinary } = await import("@kaiord/core");
    const { createFitWriter } = await import("@kaiord/fit");

    // Act
    await convertFromKrd(mockKrd, "fit", mockLogger);

    // Assert
    expect(createFitWriter).toHaveBeenCalledWith(mockLogger);
    expect(toBinary).toHaveBeenCalledWith(
      mockKrd,
      expect.any(Function),
      mockLogger
    );
  });

  it("should convert KRD to TCX", async () => {
    // Arrange
    const { toText } = await import("@kaiord/core");
    const { createTcxWriter } = await import("@kaiord/tcx");

    // Act
    await convertFromKrd(mockKrd, "tcx", mockLogger);

    // Assert
    expect(createTcxWriter).toHaveBeenCalledWith(mockLogger);
    expect(toText).toHaveBeenCalledWith(
      mockKrd,
      expect.any(Function),
      mockLogger
    );
  });

  it("should convert KRD to ZWO", async () => {
    // Arrange
    const { toText } = await import("@kaiord/core");
    const { createZwiftWriter } = await import("@kaiord/zwo");

    // Act
    await convertFromKrd(mockKrd, "zwo", mockLogger);

    // Assert
    expect(createZwiftWriter).toHaveBeenCalledWith(mockLogger);
    expect(toText).toHaveBeenCalledWith(
      mockKrd,
      expect.any(Function),
      mockLogger
    );
  });

  it("should convert KRD to GCN", async () => {
    // Arrange
    const { toText } = await import("@kaiord/core");
    const { createGarminWriter } = await import("@kaiord/garmin");

    // Act
    await convertFromKrd(mockKrd, "gcn", mockLogger);

    // Assert
    expect(createGarminWriter).toHaveBeenCalledWith(mockLogger);
    expect(toText).toHaveBeenCalledWith(
      mockKrd,
      expect.any(Function),
      mockLogger
    );
  });

  it("should serialize KRD to JSON string", async () => {
    // Act
    const result = await convertFromKrd(mockKrd, "krd", mockLogger);

    // Assert
    expect(result).toBe(JSON.stringify(mockKrd, null, 2));
  });

  it("should throw for unsupported format", async () => {
    // Act & Assert
    await expect(
      convertFromKrd(mockKrd, "invalid", mockLogger)
    ).rejects.toThrow("Unsupported output format: invalid");
  });
});

describe("loadFileAsKrd", () => {
  it("should throw for unknown file format", async () => {
    // Act & Assert
    await expect(
      loadFileAsKrd("/path/to/file.unknown", undefined, mockLogger)
    ).rejects.toThrow("Unable to detect format for file");
  });
});
