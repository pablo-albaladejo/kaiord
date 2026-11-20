<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# fixtures

## Purpose

Rosie factory builders for the KRD envelope + child collections and the workout domain (workout, step, repetition block, duration, target) plus READMEs for the binary fixture folders. The actual `.fit`/`.tcx`/`.zwo`/`.krd` binary fixtures live in the monorepo-root `test-fixtures/`; the `krd-files/`, `tcx-files/`, `zwift-files/` directories here only contain READMEs explaining the layout.

## Key Files

| File        | Description                                                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| `README.md` | Top-level explanation of the fixture layout (rosie factories vs. binary fixtures, where each lives, how to regenerate). |

## Subdirectories

| Directory      | Purpose                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `krd/`         | Rosie factories for the KRD envelope and each child schema (event, lap, metadata, record, session) (see `krd/AGENTS.md`) |
| `workout/`     | Rosie factories for `Workout`, `WorkoutStep`, `RepetitionBlock`, `Duration` and `Target` (see `workout/AGENTS.md`)       |
| `krd-files/`   | README only — actual `.krd` files live at the monorepo root `test-fixtures/krd/` (see `krd-files/AGENTS.md`)             |
| `tcx-files/`   | README only — actual `.tcx` files live at the monorepo root `test-fixtures/tcx/` (see `tcx-files/AGENTS.md`)             |
| `zwift-files/` | README only — actual `.zwo` files live at the monorepo root `test-fixtures/zwo/` (see `zwift-files/AGENTS.md`)           |

## For AI Agents

### Working In This Directory

- Rosie factories MUST type their `Factory<T>` generic against the domain TYPE (e.g., `Factory<Workout>`, `Factory<KRDLap>`) so changes to the underlying Zod schema break the factory at compile time.
- Faker calls inside `.attr(...)` are deterministic ONLY when the seed is fixed at the test-runner level. Don't add Faker seeding inside the factory itself — let the consumer seed if they need determinism.
- For discriminated unions (Duration, Target), use the `.after()` hook pattern: pick the discriminator first via `faker.helpers.arrayElement`, then build the matching shape via a `Record<discriminator, () => T>` lookup. See `workout/duration.fixtures.ts` and `workout/target.fixtures.ts`.
- Numeric literals in factories (max steps, max watts, max bpm) should pull from `../../test-utils/tolerance-constants.ts` when they're shared across factories. New magic numbers go in `tolerance-constants.ts` first.

<!-- MANUAL: -->
