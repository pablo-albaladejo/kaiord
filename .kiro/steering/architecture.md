# Architecture — Hexagonal & DI

Layers:

- **domain/** — pure KRD types & rules
- **application/** — use-cases; depends on `ports/` only
- **ports/** — I/O contracts (Fit/Tcx/Pwx Reader/Writer)
- **adapters/** — concrete implementations (e.g., @garmin/fitsdk, XML parsers)
- **cli/** — end-user commands; depends on `application`

Rules:

- `domain` depends on no one
- `application` MUST NOT import external libs nor `adapters/`
- `adapters` implement `ports` and may use external libs
- Default wiring lives in `application/providers.ts` (single swap point)
