import { afterEach, describe, expect, it, vi } from "vitest";

import { sendBridgeMessage } from "../bridge/bridge-transport";
import { readTanitaExportCsv, TanitaBridgeError } from "./tanita-transport";

vi.mock("../bridge/bridge-transport", () => ({ sendBridgeMessage: vi.fn() }));

const mockedSend = vi.mocked(sendBridgeMessage);
const READ_EXPORT_CSV_TIMEOUT_MS = 30_000;

describe("readTanitaExportCsv", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should relay read-export-csv and resolve with the parsed csv", async () => {
    // Arrange
    const csv = "Date,Weight (kg)\n2026-07-20T08:00:00Z,75.2\n";
    mockedSend.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { csv },
    });

    // Act
    const result = await readTanitaExportCsv("ext-123");

    // Assert
    expect(mockedSend).toHaveBeenCalledWith(
      "ext-123",
      { action: "read-export-csv" },
      READ_EXPORT_CSV_TIMEOUT_MS
    );
    expect(result).toBe(csv);
  });

  it("should propagate a typed error carrying the bridge message", async () => {
    // Arrange
    const message = "Export failed";
    mockedSend.mockResolvedValue({ ok: false, error: message });

    // Act
    const act = readTanitaExportCsv("ext-123");

    // Assert
    await expect(act).rejects.toBeInstanceOf(TanitaBridgeError);
    await expect(act).rejects.toThrow(message);
  });

  it("should carry needsReauth on the error when the session is dead", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: false,
      needsReauth: true,
      error: "Session expired",
    });

    // Act
    const act = readTanitaExportCsv("ext-123");

    // Assert
    await expect(act).rejects.toMatchObject({ needsReauth: true });
  });

  it("should reject a malformed bridge response envelope", async () => {
    // Arrange
    mockedSend.mockResolvedValue({
      ok: true,
      protocolVersion: 1,
      data: { csv: 42 },
    });

    // Act
    const act = readTanitaExportCsv("ext-123");

    // Assert
    await expect(act).rejects.toThrow("Malformed Tanita bridge response");
  });
});
