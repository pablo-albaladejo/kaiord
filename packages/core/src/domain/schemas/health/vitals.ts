import { z } from "zod";

import { healthVersionSchema } from "./version";

/**
 * Zod schema for `extensions.health.vitals` — a read-only, source-agnostic
 * daily-vitals summary folding respiratory rate, SpO₂, skin temperature, and
 * resting heart rate into one payload. A refinement requires that at least
 * one measurement field be present so empty payloads are rejected.
 */
export const vitalsSummarySchema = z
  .object({
    kind: z.literal("vitals"),
    version: healthVersionSchema,
    measuredAt: z.iso.datetime(),
    respiratoryRate: z.number().positive().optional(),
    spo2Percent: z.number().min(0).max(100).optional(),
    skinTempCelsius: z.number().optional(),
    restingHeartRate: z.number().int().positive().optional(),
    kaiordRecordId: z.string().uuid().optional(),
    sourceBridgeId: z.string().optional(),
    externalId: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const hasAny =
      value.respiratoryRate !== undefined ||
      value.spo2Percent !== undefined ||
      value.skinTempCelsius !== undefined ||
      value.restingHeartRate !== undefined;
    if (!hasAny) {
      ctx.addIssue({
        code: "custom",
        message:
          "At least one vitals field (respiratoryRate, spo2Percent, skinTempCelsius, restingHeartRate) must be present.",
      });
    }
  });

export type VitalsSummary = z.infer<typeof vitalsSummarySchema>;
