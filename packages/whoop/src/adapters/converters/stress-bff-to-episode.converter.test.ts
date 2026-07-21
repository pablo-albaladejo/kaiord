import { stressEpisodeSchema } from "@kaiord/core";
import { describe, expect, it } from "vitest";

import { STRESS_BFF_FIXTURE } from "../../test-utils/stress-fixture";
import type { WhoopStressResponse } from "../schemas/whoop-stress.schema";
import { stressBffToEpisode } from "./stress-bff-to-episode.converter";

const USER_ID = 42;
const DATE = "2026-07-10";
const EXPECTED_AVERAGE_LEVEL = 47;
const EXPECTED_PEAK_LEVEL = 62;
const CLAMPED_LEVEL = 50;

describe("stressBffToEpisode", () => {
  it("should map averageLevel from the gauge fill fraction", () => {
    // Arrange

    // Act
    const episode = stressBffToEpisode(STRESS_BFF_FIXTURE, {
      userId: USER_ID,
      date: DATE,
    });

    // Assert
    expect(episode?.averageLevel).toBe(EXPECTED_AVERAGE_LEVEL);
  });

  it("should map peakLevel from the maximum stress_graph point", () => {
    // Arrange

    // Act
    const episode = stressBffToEpisode(STRESS_BFF_FIXTURE, {
      userId: USER_ID,
      date: DATE,
    });

    // Assert
    expect(episode?.peakLevel).toBe(EXPECTED_PEAK_LEVEL);
  });

  it("should clamp peakLevel to averageLevel when every point is below the average", () => {
    // Arrange
    const bff: WhoopStressResponse = {
      gauge: { gauge_fill_percentage: 0.5 },
      stress_graph: {
        graph: {
          plots: [{ plot: { segments: [{ points: [{ position_y: 0.2 }] }] } }],
        },
      },
    };

    // Act
    const episode = stressBffToEpisode(bff, { userId: USER_ID, date: DATE });

    // Assert
    expect(episode?.averageLevel).toBe(CLAMPED_LEVEL);
    expect(episode?.peakLevel).toBe(CLAMPED_LEVEL);
  });

  it("should return null when the gauge is absent", () => {
    // Arrange
    const bff: WhoopStressResponse = { stress_graph: null };

    // Act
    const episode = stressBffToEpisode(bff, { userId: USER_ID, date: DATE });

    // Assert
    expect(episode).toBeNull();
  });

  it("should return null when gauge_fill_percentage is null", () => {
    // Arrange
    const bff: WhoopStressResponse = {
      gauge: { gauge_fill_percentage: null },
    };

    // Act
    const episode = stressBffToEpisode(bff, { userId: USER_ID, date: DATE });

    // Assert
    expect(episode).toBeNull();
  });

  it("should fall back peakLevel to averageLevel when stress_graph is missing or garbled", () => {
    // Arrange
    const bff: WhoopStressResponse = {
      gauge: { gauge_fill_percentage: 0.47 },
      stress_graph: { graph: { plots: "garbled" } },
    };

    // Act
    const episode = stressBffToEpisode(bff, { userId: USER_ID, date: DATE });

    // Assert
    expect(episode?.averageLevel).toBe(EXPECTED_AVERAGE_LEVEL);
    expect(episode?.peakLevel).toBe(EXPECTED_AVERAGE_LEVEL);
  });

  it("should span the full day and stamp kind, version, sourceBridgeId, externalId", () => {
    // Arrange

    // Act
    const episode = stressBffToEpisode(STRESS_BFF_FIXTURE, {
      userId: USER_ID,
      date: DATE,
    });

    // Assert
    expect(episode?.kind).toBe("stress");
    expect(episode?.version).toBe("2.0");
    expect(episode?.startTime).toBe(`${DATE}T00:00:00.000Z`);
    expect(episode?.endTime).toBe(`${DATE}T23:59:59.999Z`);
    expect(episode?.sourceBridgeId).toBe("whoop-bridge");
    expect(episode?.externalId).toBe(`stress:${USER_ID}:${DATE}`);
  });

  it("should produce a stress episode that validates against the KRD schema", () => {
    // Arrange
    const episode = stressBffToEpisode(STRESS_BFF_FIXTURE, {
      userId: USER_ID,
      date: DATE,
    });

    // Act
    const result = stressEpisodeSchema.safeParse(episode);

    // Assert
    expect(result.success).toBe(true);
  });
});
