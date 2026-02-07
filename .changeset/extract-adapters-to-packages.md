---
"@kaiord/core": major
"@kaiord/fit": major
"@kaiord/tcx": major
"@kaiord/zwo": major
"@kaiord/all": major
"@kaiord/cli": major
---

Extract format adapters from @kaiord/core into separate packages for modular installation.

Breaking changes:
- `createDefaultProviders()` now accepts an optional `AdapterProviders` parameter
- Provider properties for adapters are now optional (undefined when adapter not installed)
- Format adapter code moved from `@kaiord/core` to `@kaiord/fit`, `@kaiord/tcx`, `@kaiord/zwo`

New packages:
- `@kaiord/fit` - FIT format adapter with Garmin FIT SDK
- `@kaiord/tcx` - TCX format adapter with fast-xml-parser
- `@kaiord/zwo` - ZWO format adapter with fast-xml-parser and XSD validation
- `@kaiord/all` - Meta-package for backward compatibility (includes all adapters)

Migration: Replace `@kaiord/core` with `@kaiord/all` for identical behavior, or install adapters selectively for smaller bundles.
