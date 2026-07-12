/**
 * Scrubbed WHOOP `core-details-bff/v0/cycles/details` response, trimmed to a
 * single cycle. Values mirror the live shapes (extra fields kept to exercise
 * unknown-field tolerance). `CYCLES_DETAILS_RECORDS` is the bare-array form;
 * `CYCLES_DETAILS_WRAPPED` is the `{ records: [...] }` form.
 */

export const CYCLES_DETAILS_RECORDS = [
  {
    cycle: {
      id: 1629599351,
      days: "['2026-07-10','2026-07-11')",
      scaled_strain: 5.36,
      kilojoule: 8123.4,
    },
    recovery: {
      hrv_rmssd: 0.0571,
      recovery_score: 66,
      resting_heart_rate: 55,
      spo2: 96,
      skin_temp_celsius: 33.4,
      created_at: "2026-07-10T17:59:12.250Z",
    },
    sleeps: [
      {
        activity_id: "b1e5d3a2-7c9f-4e21-8a6d-3f0c1b2a9d84",
        during: "['2026-07-09T22:24:47.970Z','2026-07-10T06:26:12.340Z')",
        time_in_bed: 28_884_370,
        light_sleep_duration: 14_905_851,
        slow_wave_sleep_duration: 6_630_370,
        rem_sleep_duration: 5_869_845,
        wake_duration: 1_478_304,
        respiratory_rate: 17.05,
        score: 90,
      },
    ],
  },
];

export const CYCLES_DETAILS_WRAPPED = { records: CYCLES_DETAILS_RECORDS };
