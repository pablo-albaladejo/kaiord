<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# types

## Purpose

TypeScript definitions for Garmin FIT SDK. Provides type stubs for external SDK classes and interfaces not natively typed, enabling safe TypeScript usage of the SDK.

## Key Files

| File                 | Description                                                                         |
| -------------------- | ----------------------------------------------------------------------------------- |
| `garmin-fitsdk.d.ts` | TypeScript type definitions for Garmin FIT SDK (Stream, Decoder, Encoder, Profile). |

## Subdirectories

None.

## For AI Agents

### Working In This Directory

- **Type stubs:** `garmin-fitsdk.d.ts` declares types for `@garmin/fitsdk` module (not natively typed).
- **Declarations:** Stream.fromByteArray, Decoder, Decoder.read(), Encoder, Encoder.writeMesg, Encoder.close(), Profile (enums).
- **Module augmentation:** Declares `declare module "@garmin/fitsdk"` for ambient typing.

### Testing Requirements

- No runtime tests needed; types are compile-time safe.
- TypeScript strict mode ensures compatibility.

### Common Patterns

- **Type declarations:** `class`, `static`, return types, constructor signatures.

## Dependencies

### Internal

None.

### External

- `@garmin/fitsdk` - The module being typed.

<!-- MANUAL: -->
