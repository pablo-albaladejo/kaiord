<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# `src/application/profile/zones/`

## Purpose

Sport-specific zone editing use cases: switch between auto and manual zone-method, update thresholds (LTHR / FTP / threshold pace), edit sport zones in bulk, and add/remove custom zones. Backs the Zone Editor in the Profile Manager UI.

## Key Files

- `set-zone-method.ts` — toggles a sport's zone method between `auto` and `manual`; recomputes zones from thresholds when switching to auto.
- `update-sport-thresholds.ts` — patch LTHR / FTP / threshold pace; cascades into auto-computed zones.
- `update-sport-zones.ts` — patch manually-edited zones for a sport.
- `add-custom-zone.ts` — append a user-defined zone.
- `remove-custom-zone.ts` — remove a user-defined zone.
- `zone-types.ts` — shared zone-edit input/output types.
- `zones.test.ts` — covers the entire surface.

## For AI Agents

### Working In This Directory

1. **Auto-mode recomputes from thresholds on every threshold change** — see `lib/{hr-methods,power-methods,pace-methods}.ts` for the math.
2. **Manual edits are stored as overrides;** flipping back to auto regenerates and discards the manual values (this is intentional).
3. **Pace zones use mm:ss strings** for Running (`min/km`) and Swimming (`min/100m`).

### Testing Requirements

- `zones.test.ts` covers every use case; new use cases extend that suite.

## Dependencies

### Internal

- `../helpers/sport-zone-updater`.
- `../../../types/sport-zones`, `../../../types/profile`.
- `../../../lib/{hr-methods,power-methods,pace-methods,zone-methods,zone-method-types}` (zone math).

<!-- MANUAL: -->
