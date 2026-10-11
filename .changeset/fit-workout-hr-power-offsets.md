---
"@kaiord/fit": patch
---

FIT workouts now use the profile's heart-rate and power offsets (absolute bpm + 100, absolute watts + 1000) for custom HR and power target ranges, for `hrLessThan`/`powerLessThan`/`powerGreaterThan` conditions and for repeat-until HR and power conditions. Before this fix, the writer emitted these values without the offset, so a Garmin device read a 200-250 W range as 200-250 % FTP and a 130 bpm condition as 130 %. The reader kept the raw value for HR ranges and every HR and power condition, so Garmin's `hrLessThan` 225 was read as 225 bpm instead of 125 bpm. A repeat-until step's `targetValue` holds its repeat condition, and the reader no longer reads that value as a target.
