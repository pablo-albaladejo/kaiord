---
"@kaiord/garmin": patch
---

Single-value power, heart-rate and cadence targets are now exported to Garmin Connect as a tolerance band instead of a zero-width range, so the watch alert no longer fires whenever the athlete is off one exact number. Power gets ±5 % (at least ±5 W), heart rate ±3 bpm and cadence ±3, with integer bounds. Power is ordered higher wattage first; heart rate and cadence lowest first. A `percent_ftp` value is resolved to watts first, then banded: 85 % of a 250 W FTP is now sent as 202-224 W instead of 213-213 W. Bands are capped at the KRD schema maxima (5000 W, 300 bpm, 300 rpm) and floored at 0, and zero or negative values and zone targets are passed through unchanged. Reading such a workout back from Garmin gives a `range` (the band), so a single value no longer round-trips exactly.
