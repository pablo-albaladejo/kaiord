<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# specs

## Purpose

Canonical domain specifications. Each subdirectory is one capability spec
following the shape in `../SPEC_TEMPLATE.md`. These are the durable contract
the codebase MUST satisfy; proposals in `../changes/` produce delta-spec
patches that update these files when merged.

## Subdirectories

Each entry is `<capability>/spec.md` (plus any delta records). Categories
roughly: architecture, format/domain contracts, CI/release pipelines,
extension contracts, SPA editor capabilities.

### Architecture & quality

| Spec                      | Scope                                                             |
| ------------------------- | ----------------------------------------------------------------- |
| `hexagonal-arch/`         | Hexagonal layering rules: domain → application → ports → adapters |
| `adapter-contracts/`      | Contract every format adapter (FIT/TCX/ZWO/GCN) must satisfy      |
| `domain-conversions/`     | KRD ↔ format conversion semantics and tolerances                  |
| `krd-format/`             | KRD JSON Schema, MIME, versioning                                 |
| `test-conventions/`       | `R-ItTitleShould` + `R-ItBodyAAA` invariants                      |
| `scripts-folder-hygiene/` | Rules for `scripts/` (co-located tests, no orphans)               |
| `doc-drift-prevention/`   | Doc-vs-code drift guards                                          |

### CI / release

| Spec                       | Scope                                         |
| -------------------------- | --------------------------------------------- |
| `ci-build-fanout/`         | Fan-out invariants for the build matrix       |
| `ci-failure-bot/`          | CI-failure bot behavior                       |
| `ci-release/`              | Changesets-driven release workflow            |
| `archive-followups-guard/` | `lint:archive-followups` invariants           |
| `extension-store-publish/` | Generic Chrome Web Store publishing contract  |
| `cws-auto-publish/`        | Auto-publish flow for garmin-bridge           |
| `cws-train2go-listing/`    | CWS listing for the train2go-bridge extension |
| `branding/`                | Brand-asset contract (logo, icons, OG images) |
| `landing-page/`            | Landing-page (kaiord.com) capability          |
| `docs-site/`               | Public VitePress site capability              |
| `privacy-policy/`          | Privacy-policy content + parity guards        |

### Extension / bridge protocols

| Spec                        | Scope                                               |
| --------------------------- | --------------------------------------------------- |
| `bridge-runtime-discovery/` | How the SPA discovers an installed bridge extension |
| `garmin-bridge/`            | garmin-bridge capability contract                   |
| `train2go-bridge/`          | train2go-bridge capability contract                 |
| `analytics-port/`           | Analytics port contract (consumed by SPA + landing) |
| `train2go-zones-sync/`      | Train2Go training-zones sync                        |

### Workout SPA Editor

| Spec                           | Scope                                                     |
| ------------------------------ | --------------------------------------------------------- |
| `spa-ai-batch/`                | AI batch workout generation flow                          |
| `spa-bridge-protocol/`         | postMessage protocol between SPA and bridges              |
| `spa-calendar/`                | Calendar view capability                                  |
| `spa-coaching-integration/`    | Coaching plan integration (Train2Go)                      |
| `spa-editor-context-menu/`     | Editor context-menu actions                               |
| `spa-editor-focus-management/` | Focus / keyboard nav in the editor                        |
| `spa-editor-focus-telemetry/`  | Telemetry around editor focus                             |
| `spa-garmin-extension/`        | SPA ↔ garmin-bridge interaction                           |
| `spa-persistence-port/`        | Dexie persistence port contract (one query per page)      |
| `spa-quality-gates/`           | PII, dual-mount, write-through mechanical guards          |
| `spa-routing/`                 | Route map + library single-mount rule                     |
| `spa-session-match/`           | Session-match id-shape contract (`R-SessionMatchIdShape`) |
| `spa-train2go-extension/`      | SPA ↔ train2go-bridge interaction                         |
| `spa-user-preferences/`        | User preferences store                                    |
| `spa-workout-state-machine/`   | Workout draft/published state machine                     |

## For AI Agents

### Working In This Directory

- **`spec.md` files MUST conform to `../SPEC_TEMPLATE.md`** — every section
  populated, no `<...>` placeholders.
- **Changing a spec**: do it through `../changes/<slug>/delta-specs/` (a
  proposal), not by direct edit. Domain specs change only when a merged
  proposal patches them.
- **Naming**: `<capability-slug>/spec.md`. Lowercase kebab.
- **Lint locally**: `pnpm lint:specs` runs `check-spec-format.mjs` + the
  `openspec validate --specs` step. CI runs the same.

### Testing Requirements

`pnpm lint:specs` (structural + content) is the enforcement. Specs do not
ship runtime code, so there are no unit tests in this directory.

### Common Patterns

- One capability per directory.
- A spec is a CONTRACT — invariants and acceptance scenarios first; rationale
  later. The README/proposal carries the narrative.

## Dependencies

### Internal

Specs reference `packages/*` source and `scripts/*.mjs` mechanical guards.

### External

- `@fission-ai/openspec` (validation tool).

<!-- MANUAL: -->
