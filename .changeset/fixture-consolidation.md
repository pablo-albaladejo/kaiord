---
"@kaiord/core": patch
"@kaiord/fit": patch
"@kaiord/tcx": patch
"@kaiord/zwo": patch
---

Consolidate test fixtures to shared monorepo location

- Moved all test fixtures to `/test-fixtures/` directory
- Updated fixture loaders in @kaiord/core/test-utils
- Removed fixture duplication across adapter packages
- Fixed @kaiord/core to not publish fixtures to npm
- Reduced package sizes by ~120KB
