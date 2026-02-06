---
"@kaiord/core": minor
---

Add support for FIT ACTIVITY and COURSE file types

Implement Phase 2.2 to support FIT ACTIVITY (ID 4) and COURSE (ID 6) file types in addition to WORKOUT (ID 5). This enables:

- Reading/writing recorded activities with GPS and sensor data
- Reading/writing route/course files for navigation  
- File type detection and routing for bidirectional conversion
- Extended KRD metadata schema with fileType field

**Breaking changes**: None - backward compatible with existing workout files

**New features**:
- FIT file type enum with 18 standard file types
- Activity message validation and creation
- Course schemas and coordinate conversion utilities
- Automatic file type detection from FIT messages
