import { z } from "zod";

/**
 * Schemas for the WHOOP internal `advanced-labs-service/v1/biomarker-tests`
 * list and `.../biomarker-tests/{id}/summary` detail responses. The list
 * entry models only the fields a `LabReport` needs (id/display_name/
 * test_date/upload_source/status); the summary's `biomarkers[]` is the full
 * per-test catalog (126 entries live), most of which are unmeasured
 * (`status: "UNAVAILABLE"`) — `measuredBiomarkers` filters those out.
 * Every field is deliberately `.nullish()` and neither object schema is
 * strict: WHOOP may add fields or omit any of these without breaking the
 * parse. Building the KRD `LabReport`/`LabValue` (canonical unit + flag) is
 * deferred to the SPA-side importer — this package only exposes the parsed
 * WHOOP shapes.
 */
export const whoopBiomarkerTestSchema = z.object({
  id: z.union([z.string(), z.number()]).nullish(),
  display_name: z.string().nullish(),
  test_date: z.string().nullish(),
  upload_source: z.string().nullish(),
  status: z.string().nullish(),
});

export const whoopBiomarkerTestsResponseSchema = z
  .union([
    z.array(whoopBiomarkerTestSchema),
    z.object({ records: z.array(whoopBiomarkerTestSchema) }),
    z.object({ tests: z.array(whoopBiomarkerTestSchema) }),
  ])
  .transform((value) => {
    if (Array.isArray(value)) return value;
    return "records" in value ? value.records : value.tests;
  });

const rangeSchema = z
  .object({
    lower_endpoint: z.number().nullish(),
    upper_endpoint: z.number().nullish(),
  })
  .nullish();

export const whoopBiomarkerSchema = z.object({
  biomarker_name: z.string(),
  biomarker_display_name: z.string().nullish(),
  value: z.number().nullish(),
  units: z.string().nullish(),
  status: z.string().nullish(),
  optimal_range: rangeSchema,
  sufficient_range: rangeSchema,
  out_of_range: rangeSchema,
});

export const whoopBiomarkerSummarySchema = z.object({
  biomarker_test_id: z.union([z.string(), z.number()]).nullish(),
  test_display_name: z.string().nullish(),
  test_date: z.string().nullish(),
  biomarkers: z.array(whoopBiomarkerSchema).default([]),
});

export type WhoopBiomarkerTest = z.infer<typeof whoopBiomarkerTestSchema>;
export type WhoopBiomarkerTestsResponse = z.infer<
  typeof whoopBiomarkerTestsResponseSchema
>;
export type WhoopBiomarker = z.infer<typeof whoopBiomarkerSchema>;
export type WhoopBiomarkerSummary = z.infer<typeof whoopBiomarkerSummarySchema>;

/**
 * Filters a biomarker summary down to the ones WHOOP actually measured for
 * this test — the catalog carries every possible biomarker, but most come
 * back `status: "UNAVAILABLE"` (or omit `status` altogether) when the test
 * didn't cover them.
 */
export const measuredBiomarkers = (
  summary: WhoopBiomarkerSummary
): WhoopBiomarker[] =>
  summary.biomarkers.filter(
    (biomarker) =>
      biomarker.status != null && biomarker.status !== "UNAVAILABLE"
  );
