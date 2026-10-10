import { krdSchema } from "@kaiord/core";
import { describe, expect, it, vi } from "vitest";

import type { FitMessages } from "../shared/types";
import { mapMessagesToKRD } from "./messages.mapper";

const TIMESTAMP = new Date("2024-01-01T00:00:00.000Z");
const DROPPED_RECORDS = 2;

describe("activity records without a timestamp", () => {
  it("should drop records whose timestamp is null or missing, and warn once", () => {
    // Arrange
    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    const messages: FitMessages = {
      fileIdMesgs: [{ type: "activity", timeCreated: TIMESTAMP }],
      recordMesgs: [
        { timestamp: TIMESTAMP, heartRate: 120 },
        { timestamp: null, heartRate: 121 },
        { heartRate: 122 },
      ],
    };

    // Act
    const krd = mapMessagesToKRD(messages, logger);

    // Assert
    expect(krdSchema.safeParse(krd).success).toBe(true);
    expect(krd.records).toHaveLength(1);
    expect(krd.records?.[0]?.timestamp).toBe("2024-01-01T00:00:00.000Z");
    expect(logger.warn).toHaveBeenCalledWith(
      "Dropping FIT records without timestamp",
      { dropped: DROPPED_RECORDS }
    );
  });
});
