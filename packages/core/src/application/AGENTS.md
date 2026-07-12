<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# application

## Purpose

Hexagonal application layer. Holds the four strategy-pattern conversion use cases (`fromBinary`, `fromText`, `toBinary`, `toText`) that drive a caller-supplied `BinaryReader`/`BinaryWriter`/`TextReader`/`TextWriter` port and run `validateKrd` on the result. Contains NO format-specific code and NO adapter implementations.

## Key Files

| File             | Description                                                                                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `from-format.ts` | Defines `fromBinary(buffer, reader, logger?)` and `fromText(text, reader, logger?)` — reads via the injected port, then validates the produced KRD against `krdSchema`. |
| `to-format.ts`   | Defines `toBinary(krd, writer, logger?)` and `toText(krd, writer, logger?)` — validates KRD first, then writes via the injected port.                                   |

## For AI Agents

### Working In This Directory

- MUST NOT import any external lib (only domain types/validators from `../domain/...` and port types from `../ports/...`). No `zod` import, no `fs`, no adapter packages.
- The use cases are intentionally thin (~10 lines each) — they just log → invoke port → validate → log. If you find yourself adding format logic here, that logic belongs in an adapter package.
- The `Logger` parameter is OPTIONAL on every use case; downstream callers may omit it. Use `logger?.info(...)` (optional-chained call) — never assume it exists.
- Read direction: `fromBinary` validates AFTER reading; write direction: `toBinary` validates BEFORE writing. Both wrap the strict `validateKrd` (which throws `KrdValidationError`).

### Testing Requirements

- Coverage target: 80%. Tests in `from-format.test.ts` and `to-format.test.ts` use mock readers/writers (the port types are just functions) and assert log calls + validation behaviour.
- Follow AAA + `should ` title invariants.

### Common Patterns

- **Strategy pattern via function types.** `BinaryReader = (buffer: Uint8Array) => Promise<KRD>`; the application doesn't know or care which format the reader handles.
- **Validate at the boundary.** Always call `validateKrd` so a misbehaving adapter cannot leak a malformed KRD upward.

## Dependencies

### Internal

- `../domain/schemas/krd` — `KRD` type.
- `../domain/validation/validate-krd` — `validateKrd`.
- `../ports/format-strategy` — `BinaryReader`, `BinaryWriter`, `TextReader`, `TextWriter`.
- `../ports/logger` — `Logger`.

### External

None.

<!-- MANUAL: -->
