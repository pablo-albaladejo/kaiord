import type { BodyComposition, KRD } from "@kaiord/core";
import {
  BODY_FAT_TOLERANCE_PERCENT,
  bodyCompositionSchema,
  WEIGHT_TOLERANCE_KG,
} from "@kaiord/core";
import { createMockLogger } from "@kaiord/core/test-utils";
import { describe, expect, it } from "vitest";

import type { FitMessages } from "../../shared/types";
import { groupBodyCompositionMessages } from "./body-composition-message-grouping";
import { convertFitToKrdHealthBodyComposition } from "./fit-to-krd-health-body-composition.converter";
import { convertKrdToFitHealthBodyCompositionMessages } from "./krd-health-body-composition-to-fit.converter";

const MEASURED_AT = "2026-05-22T07:15:00.000Z";

const buildOriginalBody = (): BodyComposition =>
  bodyCompositionSchema.parse({
    kind: "bodyComposition",
    version: "2.0",
    measuredAt: MEASURED_AT,
    bodyFatPercent: 20.4,
    bodyWaterPercent: 55.2,
    leanMassKilograms: 33.5,
    boneMassKilograms: 3.1,
    bmi: 23.5,
    visceralFatRating: 12,
    basalMetabolicRateKcal: 1500,
  });

const buildOriginalKrd = (body: BodyComposition): KRD => ({
  version: "2.0",
  type: "body_composition",
  metadata: { created: MEASURED_AT },
  extensions: { health: { bodyComposition: body } },
});

const extractBody = (krd: KRD): BodyComposition => {
  const ext = krd.extensions as {
    health?: { bodyComposition?: BodyComposition };
  };
  const body = ext?.health?.bodyComposition;
  if (!body) throw new Error("missing bodyComposition in round-tripped KRD");
  return body;
};

describe("body composition KRD → FIT → KRD round-trip", () => {
  it("should preserve all body composition fields through one round-trip", () => {
    // Arrange
    const logger = createMockLogger();
    const body = buildOriginalBody();
    const original = buildOriginalKrd(body);

    // Act
    const flat = convertKrdToFitHealthBodyCompositionMessages(original, logger);
    const grouped = groupBodyCompositionMessages(flat) as FitMessages;
    const replayed = extractBody(
      convertFitToKrdHealthBodyComposition(grouped, logger)
    );
    const bodyFatDelta = Math.abs(
      (replayed.bodyFatPercent ?? 0) - (body.bodyFatPercent ?? 0)
    );
    const leanDelta = Math.abs(
      (replayed.leanMassKilograms ?? 0) - (body.leanMassKilograms ?? 0)
    );
    const boneDelta = Math.abs(
      (replayed.boneMassKilograms ?? 0) - (body.boneMassKilograms ?? 0)
    );

    // Assert
    expect(replayed.measuredAt).toBe(MEASURED_AT);
    expect(bodyFatDelta).toBeLessThanOrEqual(BODY_FAT_TOLERANCE_PERCENT);
    expect(leanDelta).toBeLessThanOrEqual(WEIGHT_TOLERANCE_KG);
    expect(boneDelta).toBeLessThanOrEqual(WEIGHT_TOLERANCE_KG);
    expect(replayed.bodyWaterPercent).toBe(body.bodyWaterPercent);
    expect(replayed.bmi).toBe(body.bmi);
    expect(replayed.visceralFatRating).toBe(body.visceralFatRating);
    expect(replayed.basalMetabolicRateKcal).toBe(body.basalMetabolicRateKcal);
  });
});
