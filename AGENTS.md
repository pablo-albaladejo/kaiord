# AGENTS.md — Kaiord

> Guidance for AI/code agents (GPT, Claude, etc.). Short, strict, and actionable.

## Non‑negotiables

- **Hexagonal architecture** (domain/application/ports/adapters/cli)
- **Dependency injection** (no external libs in inner layers)
- **KRD** as canonical format; MIME `application/vnd.kaiord+json`
- **Round‑trip safety** with Zod validation (JSON Schema via AJV for external consumers)
- **Typed API**: no implicit `any`
- **Never relax rules**: If code violates a lint rule, coverage threshold, or quality standard — fix the code, never downgrade the rule. This applies to ALL code, including pre-existing violations not introduced by the current change. Use `pnpm lint:fix` for auto-fixable issues, manual refactoring for the rest.

## Spec Awareness

Before implementing any non-trivial feature or fix:

1. **Check for active spec**: Look in `openspec/changes/` for a matching proposal
2. **Read the spec**: If found, read `proposal.md`, `design.md`, and `tasks.md` before writing code
3. **Read domain specs**: Reference `openspec/specs/` for architecture and format constraints
4. **Implement in spec order**: Follow the hexagonal ordering in `tasks.md`
5. **Update task checkboxes**: Mark `tasks.md` items `[x]` as work progresses
6. **Do not diverge silently**: If the spec is wrong or incomplete, flag it — do not silently implement differently

If no spec exists for a requested non-trivial change, create one with `/opsx:propose` before coding.

## Ports & adapters (example: FIT)

- **Ports** (`ports/fit.ts`): `FitReader.readToKRD(buf)`, `FitWriter.writeFromKRD(krd)`
- **Adapters** (`adapters/fit/garmin-fitsdk.ts`): map to/from KRD using `@garmin/fitsdk`
- **Binding** (`application/providers.ts`): single place to switch providers

## Public API surface

```ts
// Strategy pattern: inject reader/writer directly
fromBinary(buffer: Uint8Array, reader: BinaryReader, logger?: Logger): Promise<KRD>
fromText(text: string, reader: TextReader, logger?: Logger): Promise<KRD>
toBinary(krd: KRD, writer: BinaryWriter, logger?: Logger): Promise<Uint8Array>
toText(krd: KRD, writer: TextWriter, logger?: Logger): Promise<string>
```

## Code style

- Files ≤ 100 lines; functions < 40 LOC (tests exempt)
- Domain schemas: **snake_case** (`indoor_cycling`, `lap_swimming`)
- Adapter schemas: **camelCase** (`indoorCycling`, `lapSwimming`)
- Use `type` not `interface`; separate type imports (`import type { X }`)
- Mappers (`*.mapper.ts`) = simple transformation, no logic, no tests
- Converters (`*.converter.ts`) = complex logic, requires tests
- Access enum values via `.enum`: `subSportSchema.enum.indoor_cycling`

## Testing

- Unit for pure functions/validators
- Round‑trip (FIT/TCX/ZWO ↔ KRD) with tolerances: time ±1s, power ±1W or ±1%FTP, HR ±1bpm, cadence ±1rpm
- CLI smoke: `kaiord convert --in sample.krd --out out.tcx`
- Test utilities: `@kaiord/core/test-utils` exports fixture loaders
- AAA pattern: Arrange, Act, Assert (blank lines between sections)

## Commands

```bash
pnpm -r build && pnpm -r test && pnpm lint:fix  # Before commit
pnpm exec changeset                              # For version-worthy changes
```

## Contribution flow

0. Check `openspec/changes/` for an active spec — if none, run `/opsx:propose`
1. Implement domain/application/ports → adapters (hexagonal order, guided by `tasks.md`)
2. Add tests (unit + round‑trip, verify against spec scenarios)
3. Run: `pnpm -r build && pnpm -r test && pnpm lint:fix`
4. Add changeset if version-worthy: `pnpm exec changeset`
5. Update docs if public API changes
6. After merge: `/opsx:archive` to preserve decisions
