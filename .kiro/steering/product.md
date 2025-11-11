# Product

**Kaiord** is an open-source toolkit for structured workout data.  
It provides a unified JSON-based format (**.krd**) and conversion tools for popular fitness file formats (**FIT**, **TCX**, **PWX**).

## Packages

- **@kaiord/core** — TypeScript library for reading/writing workouts
- **@kaiord/cli** — Command-line tool for converting between formats

## Principles

- **Round-trip safety** between all supported formats
- **Schema validation** with AJV for consistent data contracts
- **Typed, hexagonal architecture** with clear ports/adapters
- **Spec-driven development** with Kiro (steering, specs, hooks)
