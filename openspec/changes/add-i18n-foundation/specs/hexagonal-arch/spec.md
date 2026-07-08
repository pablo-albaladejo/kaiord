## MODIFIED Requirements

### Requirement: Package Dependencies

Each package SHALL respect the following dependency rules:

| Package                                                       | Allowed Dependencies                                                                                        |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `@kaiord/core`                                                | No workspace deps (root of the graph)                                                                       |
| `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`, `@kaiord/garmin` | `@kaiord/core` only                                                                                         |
| `@kaiord/garmin-connect`                                      | `@kaiord/core`, `@kaiord/garmin`                                                                            |
| `@kaiord/ai`                                                  | `@kaiord/core` only (+ `ai` as peer dependency)                                                             |
| `@kaiord/i18n`                                                | No workspace deps (framework-agnostic i18n mechanism; wraps `i18next` only)                                 |
| `@kaiord/mcp`                                                 | `@kaiord/core` + all format adapters + `@kaiord/garmin-connect`                                             |
| `@kaiord/cli`                                                 | `@kaiord/core` + all adapters + `@kaiord/garmin-connect`                                                    |
| `@kaiord/workout-spa-editor`                                  | `@kaiord/core`, `@kaiord/ai`, `@kaiord/fit`, `@kaiord/garmin`, `@kaiord/i18n`, `@kaiord/tcx`, `@kaiord/zwo` |
| `@kaiord/docs`                                                | `@kaiord/core` + all adapters + `@kaiord/garmin-connect` + `@kaiord/cli` + `@kaiord/mcp`                    |
| `@kaiord/landing`                                             | `@kaiord/core`                                                                                              |
| `@kaiord/garmin-bridge`                                       | No workspace deps (Chrome extension, communicates via `externally_connectable`)                             |
| `@kaiord/train2go-bridge`                                     | No workspace deps (Chrome extension, communicates via `externally_connectable`)                             |
| `@kaiord/whoop`                                               | `@kaiord/core`                                                                                              |
| `@kaiord/whoop-bridge`                                        | No workspace deps (Chrome extension, communicates via `externally_connectable`)                             |

#### Scenario: Core declares no workspace dependencies

- **GIVEN** `packages/core/package.json`
- **WHEN** its `dependencies` block is inspected
- **THEN** no `@kaiord/*` workspace package appears

#### Scenario: i18n package declares no workspace dependencies

- **GIVEN** `packages/i18n/package.json`
- **WHEN** its `dependencies` block is inspected
- **THEN** no `@kaiord/*` workspace package appears (only `i18next`)

#### Scenario: SPA editor may depend on the i18n package

- **GIVEN** `packages/workout-spa-editor/package.json`
- **WHEN** its `dependencies` block is inspected
- **THEN** `@kaiord/i18n` is an allowed workspace dependency
