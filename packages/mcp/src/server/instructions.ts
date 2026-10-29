const SHARED_INSTRUCTIONS = [
  "Kaiord is a fitness data framework. KRD is the canonical JSON format — all conversions go through KRD.",
  "BEFORE creating or editing KRD documents, call the kaiord_get_format_spec tool to get the full specification.",
  "Use kaiord_list_formats to discover all supported formats (FIT, TCX, ZWO, GCN, KRD).",
];

export const LOCAL_INSTRUCTIONS = [
  ...SHARED_INSTRUCTIONS,
  "Use kaiord_garmin_login to authenticate, then kaiord_garmin_list/kaiord_garmin_push to interact with Garmin Connect.",
  "Use kaiord_get_health_summary / *_history / *_recovery_status to query health data from FIT health files (sleep, weight, HRV, daily wellness).",
].join("\n");

export const REMOTE_INSTRUCTIONS = [
  ...SHARED_INSTRUCTIONS,
  "Use kaiord_convert, kaiord_validate, kaiord_inspect, kaiord_diff, kaiord_extract_workout and kaiord_round_trip_validate on inline content: send text as is and FIT as base64.",
  "Only structured workouts are accepted. FIT output comes back as base64 text.",
].join("\n");
