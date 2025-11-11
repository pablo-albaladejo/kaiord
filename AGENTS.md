# AGENTS.md — Kaiord

> Guidance for AI/code agents (Kiro, GPT, Claude…). Short, strict, and actionable.

## Non‑negotiables

- **Hexagonal architecture** (domain/application/ports/adapters/cli)
- **Dependency injection** (no external libs in inner layers)
- **KRD** as canonical format; MIME `application/vnd.kaiord+json`
- **Round‑trip safety** and **AJV validation**
- **Spec‑driven** changes: update `.kiro/specs/**` first
- **Typed API**: no implicit `any`

## Ports & adapters (example: FIT)

- **Ports** (`ports/fit.ts`): `FitReader.readToKRD(buf)`, `FitWriter.writeFromKRD(krd)`
- **Adapters** (`adapters/fit/garmin-fitsdk.ts`): map to/from KRD using `@garmin/fitsdk`
- **Binding** (`application/providers.ts`): single place to switch providers

## Public API surface

```ts
toKRD(input: Uint8Array | string, opts: { type: "fit"|"tcx"|"pwx"|"krd" }): Promise<KRD>
fromKRD(krd: KRD, opts: { type: "fit"|"tcx"|"pwx"|"krd" }): Promise<Uint8Array>
```

## Testing

- Unit for pure mappers/validators
- Golden for representative KRD
- Round‑trip (FIT/TCX/PWX ↔ KRD) with tolerances: time ±1s, power ±1W or ±1%FTP, HR ±1bpm, cadence ±1rpm
- CLI smoke: `kaiord convert --in sample.krd --out out.tcx`

## Contribution flow

1. Add/adjust SPEC (`.kiro/specs/<feature>/`)
2. Implement domain/application/ports → adapters
3. Add mirrored tests + golden + round‑trip
4. Run local Kiro hooks (manual where needed)
5. Update docs if public API changes
