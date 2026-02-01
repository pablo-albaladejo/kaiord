import { describe, expect, it, vi } from "vitest";
import { convertFromKrd, convertToKrd, loadFileAsKrd } from "./krd-file-loader";

describe("convertToKrd", () => {
  const mockProviders = {
    convertFitToKrd: vi
      .fn()
      .mockResolvedValue({ metadata: { sport: "cycling" } }),
    convertTcxToKrd: vi
      .fn()
      .mockResolvedValue({ metadata: { sport: "cycling" } }),
    convertZwiftToKrd: vi
      .fn()
      .mockResolvedValue({ metadata: { sport: "cycling" } }),
  } as unknown as Parameters<typeof convertToKrd>[2];

  it("should convert FIT buffer to KRD", async () => {
    // Arrange
    const fitData = new Uint8Array([0x2e, 0x46, 0x49, 0x54]);

    // Act
    await convertToKrd(fitData, "fit", mockProviders);

    // Assert
    expect(mockProviders.convertFitToKrd).toHaveBeenCalledWith({
      fitBuffer: fitData,
    });
  });

  it("should convert TCX string to KRD", async () => {
    // Arrange
    const tcxData = '<?xml version="1.0"?><TrainingCenterDatabase/>';

    // Act
    await convertToKrd(tcxData, "tcx", mockProviders);

    // Assert
    expect(mockProviders.convertTcxToKrd).toHaveBeenCalledWith({
      tcxString: tcxData,
    });
  });

  it("should convert ZWO string to KRD", async () => {
    // Arrange
    const zwoData = '<?xml version="1.0"?><workout_file/>';

    // Act
    await convertToKrd(zwoData, "zwo", mockProviders);

    // Assert
    expect(mockProviders.convertZwiftToKrd).toHaveBeenCalledWith({
      zwiftString: zwoData,
    });
  });

  it("should parse KRD JSON string", async () => {
    // Arrange
    const krdData = JSON.stringify({ metadata: { sport: "running" } });

    // Act
    const result = await convertToKrd(krdData, "krd", mockProviders);

    // Assert
    expect(result).toEqual({ metadata: { sport: "running" } });
  });

  it("should throw for unsupported format", async () => {
    // Arrange
    const data = "some data";

    // Act & Assert
    await expect(convertToKrd(data, "invalid", mockProviders)).rejects.toThrow(
      "Unsupported format: invalid"
    );
  });

  it("should throw when FIT format receives string", async () => {
    // Arrange
    const data = "string data";

    // Act & Assert
    await expect(convertToKrd(data, "fit", mockProviders)).rejects.toThrow(
      "FIT input must be Uint8Array"
    );
  });

  it("should throw when text format receives Uint8Array", async () => {
    // Arrange
    const data = new Uint8Array([1, 2, 3]);

    // Act & Assert
    await expect(convertToKrd(data, "tcx", mockProviders)).rejects.toThrow(
      "TCX input must be string"
    );
  });
});

describe("convertFromKrd", () => {
  const mockKrd = { metadata: { sport: "cycling" } } as Parameters<
    typeof convertFromKrd
  >[0];
  const mockProviders = {
    convertKrdToFit: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    convertKrdToTcx: vi.fn().mockResolvedValue("<TrainingCenterDatabase/>"),
    convertKrdToZwift: vi.fn().mockResolvedValue("<workout_file/>"),
  } as unknown as Parameters<typeof convertFromKrd>[2];

  it("should convert KRD to FIT", async () => {
    // Act
    await convertFromKrd(mockKrd, "fit", mockProviders);

    // Assert
    expect(mockProviders.convertKrdToFit).toHaveBeenCalledWith({
      krd: mockKrd,
    });
  });

  it("should convert KRD to TCX", async () => {
    // Act
    await convertFromKrd(mockKrd, "tcx", mockProviders);

    // Assert
    expect(mockProviders.convertKrdToTcx).toHaveBeenCalledWith({
      krd: mockKrd,
    });
  });

  it("should convert KRD to ZWO", async () => {
    // Act
    await convertFromKrd(mockKrd, "zwo", mockProviders);

    // Assert
    expect(mockProviders.convertKrdToZwift).toHaveBeenCalledWith({
      krd: mockKrd,
    });
  });

  it("should serialize KRD to JSON string", async () => {
    // Act
    const result = await convertFromKrd(mockKrd, "krd", mockProviders);

    // Assert
    expect(result).toBe(JSON.stringify(mockKrd, null, 2));
  });

  it("should throw for unsupported format", async () => {
    // Act & Assert
    await expect(
      convertFromKrd(mockKrd, "invalid", mockProviders)
    ).rejects.toThrow("Unsupported output format: invalid");
  });
});

describe("loadFileAsKrd", () => {
  it("should throw for unknown file format", async () => {
    // Arrange
    const mockProviders = {} as Parameters<typeof loadFileAsKrd>[2];

    // Act & Assert
    await expect(
      loadFileAsKrd("/path/to/file.unknown", undefined, mockProviders)
    ).rejects.toThrow("Unable to detect format for file");
  });
});
