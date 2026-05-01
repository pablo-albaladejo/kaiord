---
name: architecture-hexagonal
description: Read this guideline when placing new code in a layer, reviewing imports, designing a new package, adding I/O, or when files are under packages/core/src/, packages/fit/, packages/tcx/, packages/zwo/, packages/garmin/, packages/garmin-connect/, packages/cli/, packages/mcp/.
---

# Hexagonal Architecture — Kaiord

## Layer graph

```
domain ← ports ← application ← adapters
```

No rightward imports. Enforced by `check-architecture.js` pre-commit hook.
Canonical reference: `openspec/specs/hexagonal-arch/spec.md`.

| Layer          | Lives in                                         | Depends on          | Rules                                                        |
| -------------- | ------------------------------------------------ | ------------------- | ------------------------------------------------------------ |
| `domain/`      | `packages/core/src/domain/`                      | nothing             | pure TypeScript types + Zod schemas only; no external libs   |
| `ports/`       | `packages/core/src/ports/`                       | domain only         | pure interfaces/type aliases; no runtime code                |
| `application/` | `packages/core/src/application/`                 | domain + ports      | use cases; no external libs; no adapter imports              |
| adapters       | `packages/<fit\|tcx\|zwo\|garmin>/src/adapters/` | `@kaiord/core` only | MAY use external libs; MUST NOT import other format adapters |

**Decision rule for new code:**

- Types/Zod schemas → `domain/`
- Interfaces → `ports/`
- Orchestration → `application/`
- I/O or format parsing → adapter package

## Package dependency table

Full normative table: `openspec/specs/hexagonal-arch/spec.md`, Requirement: Package Dependencies.

Summary:

- `@kaiord/core` — no workspace deps (root of the graph)
- `@kaiord/fit`, `tcx`, `zwo`, `garmin` — `@kaiord/core` only; never each other
- `@kaiord/garmin-connect` — `@kaiord/core` + `@kaiord/garmin`
- `@kaiord/ai` — `@kaiord/core` only (+ `ai` as peer)
- `@kaiord/mcp` — `@kaiord/core` + all format adapters + `@kaiord/garmin-connect`
- `@kaiord/cli` — `@kaiord/core` + all adapters + `@kaiord/garmin-connect`
- `@kaiord/workout-spa-editor` — `@kaiord/core`, `@kaiord/ai`, `@kaiord/fit`, `@kaiord/garmin`, `@kaiord/tcx`, `@kaiord/zwo`
- `@kaiord/garmin-bridge`, `@kaiord/train2go-bridge` — no workspace deps (Chrome extensions)

## Public API (core)

```typescript
fromBinary(buffer: Uint8Array, reader: BinaryReader, logger?: Logger): Promise<KRD>
fromText(text: string,         reader: TextReader,   logger?: Logger): Promise<KRD>
toBinary(krd: KRD,             writer: BinaryWriter, logger?: Logger): Promise<Uint8Array>
toText(krd: KRD,               writer: TextWriter,   logger?: Logger): Promise<string>
```

**Strategy injection is non-negotiable.** Use cases MUST accept reader/writer as parameters and MUST NOT hard-code any adapter. See hexagonal-arch spec, Requirement: Strategy Injection.

Adapters export dual forms:

```typescript
import { fitReader } from "@kaiord/fit"; // pre-built
import { createFitReader } from "@kaiord/fit"; // factory(logger?)
```

## KRD as canonical format

All conversions MUST pass through KRD. Direct format-to-format (e.g., FIT → TCX) is forbidden.

## Browser extension adapters

`garmin-bridge` and `train2go-bridge` are Chrome extensions with no workspace deps. They communicate via `externally_connectable`. Contract: background SW + content script + path/method allowlist; response shape `{ ok, protocolVersion?, data?, error? }`. No credential storage in extension. Full contract: `openspec/specs/adapter-contracts/spec.md`.

## Package/folder layout

```
packages/
├── core/src/
│   ├── domain/{types,schemas}/    # pure types + Zod
│   ├── ports/                     # interfaces only
│   ├── application/               # use cases
│   └── adapters/{logger,analytics}/  # only built-in adapters in core (see arch-vocab below)
├── fit|tcx|zwo|garmin/src/adapters/
├── garmin-connect/src/            # Garmin Connect HTTP client
├── ai/src/                        # AI adapter
├── cli/src/
├── mcp/src/
├── garmin-bridge/                 # Chrome extension
├── train2go-bridge/               # Chrome extension
├── workout-spa-editor/            # React SPA
├── docs/
└── landing/
```

Zod schemas: `packages/core/src/domain/schemas/`, exported via `@kaiord/core`.
Test fixtures: import from `@kaiord/core/test-utils` — do not re-implement.

## Core adapter allowlist (mechanically enforced)

`packages/core/src/adapters/` MAY contain only the subfolders below. The
allowlist lives in `scripts/architecture.vocab.mjs` (`CORE_ADAPTER_ALLOWLIST`)
and is enforced by `scripts/check-architecture.mjs` under rule
`R-ArchCoreAdapterAllowlist`. The test in
`scripts/check-architecture.test.mjs` parses this block and asserts
array-equality (order-sensitive) against the vocab module — drift fails CI.

<!-- arch-vocab:start -->

analytics
logger

<!-- arch-vocab:end -->

Both are infrastructure-free, zero-runtime-dependency adapters that ship
with `@kaiord/core` for ergonomic defaults. Any new adapter category
MUST live in its own `@kaiord/<name>` package.

## Enforcement

The layer rules in this guideline are enforced by `scripts/check-architecture.mjs`
(rules `R-ArchLeftward`, `R-ArchPortPure`, `R-ArchAppPure`, `R-ArchDomainExt`,
`R-ArchAdapterCross`, `R-ArchCoreAdapterAllowlist`, `R-ArchCoreAmbientTypes`)
and `scripts/check-package-deps.mjs` (rule `R-ArchPackageDeps`). Both run via
`pnpm test:scripts`, the husky `pre-commit` hook, and `pnpm lint`.
