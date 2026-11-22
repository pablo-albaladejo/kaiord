---
"@kaiord/core": patch
"@kaiord/fit": patch
"@kaiord/tcx": patch
"@kaiord/zwo": patch
"@kaiord/garmin": patch
"@kaiord/garmin-connect": patch
"@kaiord/cli": patch
"@kaiord/ai": patch
"@kaiord/whoop": patch
"@kaiord/tanita": patch
"@kaiord/trainingpeaks": patch
"@kaiord/landing": patch
---

The landing and the READMEs say only what the code makes true, and every claim on them points to its proof in the claims register (`claims/landing.json`, `claims/readme.json`). Kaiord is described as two products, the Kaiord SDK and the Kaiord App, and KRD as the SDK's internal canonical model. "No backend" and "nothing leaves your device" give way to the real statement: no accounts and no user data stored on Kaiord's servers, and data leaves the device only to destinations the athlete set up. "Lossless" and "round-trip safe" are withdrawn until each format has a Round-trip test. The landing's code example now imports `fromBinary` and `toText` from `@kaiord/core`, where they live.
