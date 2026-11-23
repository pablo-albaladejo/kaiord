---
"@kaiord/core": minor
"@kaiord/fit": patch
"@kaiord/tcx": patch
"@kaiord/zwo": patch
"@kaiord/garmin": patch
---

Every format the Kaiord SDK reads and writes has a Round-trip test. `@kaiord/core` exports `diffRoundTrip`, which compares every value of two KRDs within `DECLARED_TOLERANCES` (time ±1 s, distance ±1 m, power ±1 W or ±1 % FTP, heart rate ±1 bpm or ±0.5 % of maximum, cadence ±1 rpm, pace ±0.01 m/s), and one Round-trip contract per format (`FIT_ROUND_TRIP`, `TCX_ROUND_TRIP`, `ZWO_ROUND_TRIP`, `GCN_ROUND_TRIP`) naming, with a reason, each field the format cannot carry; `@kaiord/core/test-utils` exports `buildRoundTripCases` and `roundTripReport` to run them. The tests found and fixed: FIT wrote the manufacturer `dynastream` as `dynastreamOem`, dropped a Garmin product name, did not write workout notes to the workout description, and failed to write a note longer than the 254 bytes of a FIT string (it is now cut on a character boundary); TCX and Garmin Connect dropped workout notes, now written as the TCX `Notes` and the Garmin Connect workout `description`. `@kaiord/core/test-utils` also exports `firstReadReport` and `sourceValuesOf`, which check that the first read of a real file keeps every field KRD can hold; that check found and fixed: TCX skipped lap-button (`UserInitiated_t`), calorie and heart-rate-below steps and read a custom heart-rate zone in beats per minute and a `Cadence_t` target as no target; Garmin Connect read a `cadence.zone` target as no target, dropped a stroke or equipment given only by its id, and replaced the workout's `createdDate` with the time it was read.
