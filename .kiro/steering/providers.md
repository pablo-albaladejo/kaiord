# Providers & Dependency Injection

Goal: replace `.fit`/`.tcx`/`.pwx` providers without touching business code.

Contracts (ports)

- `FitReader.readToKRD(buf: Uint8Array): Promise<KRD>`
- `FitWriter.writeFromKRD(krd: KRD): Promise<Uint8Array>`
- Equivalent pairs for TCX & PWX

Implementations (adapters)

- `adapters/fit/garmin-fitsdk.ts` uses `@garmin/fitsdk`
- Alternatives must implement the same contracts

Composition (application/providers.ts)

- Wire defaults here; allow optional overrides

Golden rule

- Provider switch = **edit 1 file** (`application/providers.ts`)
