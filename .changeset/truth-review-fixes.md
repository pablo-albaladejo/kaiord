---
"@kaiord/mcp": patch
"@kaiord/garmin-connect": patch
"@kaiord/landing": patch
"@kaiord/workout-spa-editor": patch
"@kaiord/docs": patch
---

The MCP server's instructions describe the Kaiord SDK instead of a "fitness data framework". `@kaiord/garmin-connect` says it is an unofficial Garmin Connect client, not a Garmin API. The landing's data statement names every destination of the athlete's data, intervals.icu included, and says separately what Umami analytics records. The App's page description no longer says data never leaves the browser or that it syncs with Garmin and WHOOP: it sends workouts to Garmin Connect and reads WHOOP recovery and sleep. The docs home, getting started and converters pages drop "framework", "lossless" and "round-trip safe".
