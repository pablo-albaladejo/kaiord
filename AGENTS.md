# AGENTS.md — Kaiord

> Guidance for AI/code agents (GPT, Claude, etc.). Short, strict, and actionable.

## Non‑negotiables

- **Hexagonal architecture** (domain/application/ports/adapters/cli)
- **Dependency injection** (no external libs in inner layers)
- **KRD** as canonical format; MIME `application/vnd.kaiord+json`
- **Round‑trip safety** with Zod validation (JSON Schema via AJV for external consumers)
- **Typed API**: no implicit `any`

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

1. Implement domain/application/ports → adapters (hexagonal order)
2. Add tests (unit + round‑trip)
3. Run: `pnpm -r build && pnpm -r test && pnpm lint:fix`
4. Add changeset if version-worthy: `pnpm exec changeset`
5. Update docs if public API changes
