---
"@kaiord/core": patch
---

Improve code quality and developer experience in @kaiord/core:

- Add proper Zod validation for workout data extraction in FIT converter (replaces unsafe type assertions)
- Make messages validator stricter: throws by default on missing critical FIT messages (configurable via options)
- Add truncation behavior option for notes field (configurable via notesTruncation parameter)
- Document cadence SPM/RPM conversion rationale in TCX and Zwift converters
- Remove unused isWorkoutStep type guard
- Add warning when manufacturer falls back to default value
- Add comprehensive edge case tests for duration converters (negative values, large numbers, NaN, Infinity)
- Add tests for messages validator strict mode
