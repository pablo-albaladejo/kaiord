---
"@kaiord/ai": patch
---

The workout parser prompt (1.3.0) now shows the explicit heart-rate and power `range` forms (`{ "unit": "range", "min": 130, "max": 150 }`, and `"basis": "percent_ftp"` for a % FTP range) and states that `bpm`, `percent_max`, `watts` and `percent_ftp` take a single value. A heart-rate `range` is always bpm, and a % max HR range is given as a single `percent_max` value (the midpoint). A coached "88-93% FTP" or "130-150 bpm" step was otherwise answered as `{ "unit": "percent_ftp", "min": 88, "max": 93 }`, which strict validation rejects, costing a retry or failing the conversion. The structured-output wire schema now carries `basis` too, so a % FTP range is no longer stripped to a bare range and read as watts.
