<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# fixtures

## Purpose

JSON fixtures consumed by repo-wide lint guards under `scripts/`. The
expectations are version-controlled so that adding or removing a
privacy-relevant surface in an extension requires a deliberate update of
the fixture (and code review).

## Key Files

| File                          | Description                                                                                                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bridge-privacy-surface.json` | Allow-listed Chrome-extension privacy surface (host permissions, content-script matches, `web_accessible_resources`) used by `check-bridge-privacy-surface.mjs`. |

## For AI Agents

### Working In This Directory

- **Don't edit a fixture to make a lint guard pass** — first determine
  whether the new surface is actually intended; if so, update the spec
  (under `openspec/specs/`) AND the fixture in the same PR.
- Fixture entries map 1:1 to manifest keys. Keep them ordered consistently
  with the consuming guard.

### Testing Requirements

The fixture is exercised by the consuming guard's `*.test.mjs`
(`check-bridge-privacy-surface.test.mjs`) and during full lint
(`pnpm lint:packages` / `pnpm lint`).

### Common Patterns

- JSON only; no comments.
- One fixture file per guard.

## Dependencies

### Internal

Consumed by `scripts/check-bridge-privacy-surface.mjs`. Referenced by
`openspec/specs/{garmin-bridge,train2go-bridge}/spec.md`.

<!-- MANUAL: -->
