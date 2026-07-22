/**
 * Scrubbed WHOOP `advanced-labs-service/v1/biomarker-tests/{id}/summary`
 * response, trimmed to four biomarkers: a fully-populated measured value
 * (with an unmodelled extra field kept to exercise non-strict tolerance), a
 * measured value with null units, a measured entry with no reference
 * ranges at all, and an unmeasured (`UNAVAILABLE`) entry. Values mirror the
 * live "Blood" panel sample. Deliberately untyped (no `WhoopBiomarkerSummary`
 * annotation) so the extra fields don't trip an excess-property check.
 */

export const BIOMARKER_TEST_ID = "test-1";
export const ALT_VALUE = 38;
export const ALT_RANGE_LOW = 6;
export const ALT_RANGE_HIGH = 35;
export const HDL_VALUE = 58;

export const BIOMARKER_SUMMARY_FIXTURE = {
  biomarker_test_id: BIOMARKER_TEST_ID,
  test_display_name: "Blood",
  test_date: "2026-07-10",
  biomarkers: [
    {
      biomarker_name: "alt",
      biomarker_display_name: "ALT",
      value: ALT_VALUE,
      units: "U/L",
      status: "SUFFICIENT",
      sufficient_range: {
        lower_endpoint: ALT_RANGE_LOW,
        upper_endpoint: ALT_RANGE_HIGH,
      },
      unmodelled_field: "kept-to-exercise-tolerance",
    },
    {
      biomarker_name: "hdl_cholesterol",
      biomarker_display_name: "HDL Cholesterol",
      value: HDL_VALUE,
      units: null,
      status: "OPTIMAL",
    },
    {
      biomarker_name: "custom_marker",
      biomarker_display_name: "Custom Marker",
      value: null,
      units: null,
      status: "OPTIMAL",
    },
    {
      biomarker_name: "vitamin_d",
      biomarker_display_name: "Vitamin D",
      value: null,
      units: null,
      status: "UNAVAILABLE",
    },
  ],
};
