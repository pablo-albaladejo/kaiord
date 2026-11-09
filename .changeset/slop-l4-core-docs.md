---
"@kaiord/core": patch
---

Rewrite the README and `docs/` examples to the real `fromBinary`/`toBinary`/`fromText`/`toText` API (every code block now compiles against the published types), fix the stale `@example`s in the FIT/TCX/ZWO error classes, mark the 25 unconsumed `@kaiord/core/test-utils` round-trip constants `@deprecated` (removed in the next major), and drop the dead fixture generators. A core patch also bumps its dependents' patch versions through `updateInternalDependencies`.
