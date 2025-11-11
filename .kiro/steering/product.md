Kaiord is an open-source toolkit for structured workout data. It provides a unified JSON-based format (.krd) and conversion tools for popular fitness file formats (FIT, TCX, PWX).

The project consists of two main packages:

- `@kaiord/core`: TypeScript library for reading/writing workout files
- `@kaiord/cli`: Command-line tool for format conversion

Key principles:

- Round-trip safe conversions between formats
- Schema validation using AJV
- Clean architecture with fully typed API
- Spec-driven development workflow
