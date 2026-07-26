# Kaiord — Open-Source Health & Fitness Data Framework

**[kaiord.com](https://kaiord.com)** | [Editor](https://kaiord.com/editor/) | [npm](https://www.npmjs.com/org/kaiord)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)

[![CI](https://github.com/pablo-albaladejo/kaiord/actions/workflows/ci.yml/badge.svg)](https://github.com/pablo-albaladejo/kaiord/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/pablo-albaladejo/kaiord/branch/main/graph/badge.svg)](https://codecov.io/gh/pablo-albaladejo/kaiord)
[![npm version](https://badge.fury.io/js/@kaiord%2Fcore.svg)](https://www.npmjs.com/package/@kaiord/core)
[![npm version](https://badge.fury.io/js/@kaiord%2Fcli.svg)](https://www.npmjs.com/package/@kaiord/cli)
[![MCP Registry](https://img.shields.io/badge/MCP_Registry-io.github.pablo--albaladejo%2Fkaiord-8A2BE2)](https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.pablo-albaladejo/kaiord)
[![Glama MCP server](https://glama.ai/mcp/servers/@pablo-albaladejo/kaiord/badges/score.svg)](https://glama.ai/mcp/servers/@pablo-albaladejo/kaiord)
[![Sponsor](https://img.shields.io/badge/Sponsor-❤️-pink?logo=github-sponsors)](https://github.com/sponsors/pablo-albaladejo)

**Kaiord** is an open-source framework for creating, converting, and managing health & fitness data.

It provides:

- `@kaiord/core`: a TypeScript library with format adapters for **.fit**, **.tcx**, **.zwo**, and **.krd** (Kaiord) files, plus Garmin Connect API integration.
- `@kaiord/cli`: a command-line tool to convert, validate, and compare files across formats.
- `@kaiord/mcp`: an MCP server exposing Kaiord tools to AI agents (Claude Desktop, Claude Code, etc.). Published in the [official MCP registry](https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.pablo-albaladejo/kaiord) as `io.github.pablo-albaladejo/kaiord`.
- **[Workout Editor](https://kaiord.com/editor/)**: a web application to create and edit workout files visually.

---

## ✨ Features

- **[Visual Workout Editor](https://kaiord.com/editor/)** - Create and edit workouts in your browser
- Unified JSON-based format `.krd` (Kaiord Representation Definition)
- Schema validation (Zod)
- Round-trip safe conversions between FIT / TCX / ZWO / GCN / KRD
- Hexagonal architecture & fully typed API

### Supported FIT Fields

#### Workout Metadata

- **Sub-sport categorization**: Detailed sport types (trail running, indoor cycling, lap swimming, etc.)
- **Pool dimensions**: Pool length and unit for swimming workouts

#### Workout Steps

- **Coaching notes**: Instructional text for each step (max 256 characters)
- **Swimming equipment**: Fins, kickboard, paddles, pull buoy, snorkel

#### Duration Types

- **Time & distance**: Standard interval durations
- **Calorie-based**: Steps ending after burning specified calories
- **Power-based**: Steps ending based on power thresholds (watts)
- **Heart rate conditionals**: Steps ending based on HR thresholds (bpm)
- **Repeat conditionals**: Repeat blocks until time/distance/calories/HR/power targets reached

### Known Limitations

- **Training Stress Score (TSS)**: The `training_peaks_tss` duration type is not yet implemented in the FIT converter. This is a TrainingPeaks-specific metric that requires additional mapping logic. Contributions welcome!

---

## 🔒 Local-first architecture

Kaiord is local-first: your data lives on your device, because there is no Kaiord server to send it to. There are no accounts and no backend.

- **Storage is your browser's IndexedDB.** The [Workout Editor](https://kaiord.com/editor/) persists every workout, template, profile, and setting in a local Dexie.js / IndexedDB database (`new KaiordDatabase()` in [`dexie-database.ts`](./packages/workout-spa-editor/src/adapters/dexie/dexie-database.ts)), and the UI reads it reactively through `useLiveQuery`. Nothing is written to a remote database — see the "Persisted data → Dexie" rule in [State Management](./CLAUDE.md).
- **Conversions run entirely on your machine.** FIT / TCX / ZWO / GCN ↔ KRD conversion happens in-process — client-side in the editor ([`import-workout-formats.ts`](./packages/workout-spa-editor/src/utils/import-workout-formats.ts), [`export-workout-formats.ts`](./packages/workout-spa-editor/src/utils/export-workout-formats.ts)) or locally in the [`@kaiord/cli`](./packages/cli). Files never leave your device to be converted.
- **Sync is opt-in and goes to _your_ cloud.** Data leaves the device only if you connect Google Drive. The [cloud-sync adapter](./packages/workout-spa-editor/src/adapters/cloud-sync) uses the Google Identity Services `drive.appdata` scope, so synced data lands in your own Drive's app folder; the access token lives only in memory for the session and is never persisted by Kaiord.
- **Integrations use _your_ logged-in session — no credential proxy.** Garmin, WHOOP, and Train2Go connect through browser-extension "bridges" ([`garmin-bridge`](./packages/garmin-bridge), [`whoop-bridge`](./packages/whoop-bridge), [`train2go-bridge`](./packages/train2go-bridge)) that piggyback on your existing browser session. Per [`openspec/specs/adapter-contracts/spec.md`](./openspec/specs/adapter-contracts/spec.md), a bridge "SHALL NOT store, transmit, or manage user credentials"; authentication is "delegated entirely to the browser's cookie jar." No third-party server proxies your credentials or your data.
- **Works offline.** Because all logic and storage are client-side, the editor keeps working with no network connection once loaded.

---

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[Getting Started](./docs/getting-started.md)** - Installation, basic usage, and quick examples for both library and CLI
- **[Architecture](./docs/architecture.md)** - Hexagonal architecture, ports & adapters pattern, and design principles
- **[Testing](./docs/testing.md)** - Testing strategy, TDD workflow, and coverage requirements
- **[Deployment](./docs/deployment.md)** - CI/CD pipeline, GitHub Pages deployment, and npm publishing
- **[Contributing](./CONTRIBUTING.md)** - Contribution guidelines, development workflow, and code standards
- **[KRD Format](./docs/krd-format.md)** - Complete specification of the Kaiord Representation Definition format
- **[AI Agents](./AGENTS.md)** - Guidance for AI-assisted development

---

## 🧩 Tech Stack

| Layer           | Tooling                            |
| --------------- | ---------------------------------- |
| Core            | TypeScript, tsup, Zod              |
| CLI             | yargs                              |
| Web App         | React, Zustand, Tailwind, Radix UI |
| Testing         | Vitest, Playwright                 |
| Package manager | pnpm                               |

---

## 🏗 Monorepo Layout

```
kaiord/
├─ packages/
│  ├─ core/                → domain types, schemas, ports & use cases
│  ├─ fit/                 → Garmin FIT format adapter
│  ├─ tcx/                 → Training Center XML adapter
│  ├─ zwo/                 → Zwift ZWO format adapter
│  ├─ garmin/              → Garmin Connect API adapter
│  ├─ cli/                 → command-line interface
│  ├─ mcp/                 → MCP server for AI/LLM integration
│  └─ workout-spa-editor/  → web application (https://kaiord.com/editor/)
├─ docs/   → documentation
├─ LICENSE
├─ README.md
└─ pnpm-workspace.yaml
```

---

## 🚀 Quick Start

### Try the Web App

**[Launch Workout Editor →](https://kaiord.com/editor/)**

Create and edit workouts visually in your browser. No installation required.

### Use the Library

```bash
pnpm install
pnpm -r build
pnpm -r test

# Example usage
pnpm kaiord --help
```

For detailed installation instructions and usage examples, see the **[Getting Started Guide](./docs/getting-started.md)**.

---

## 🚀 CI/CD Pipeline

Kaiord uses GitHub Actions for continuous integration and deployment:

- **Automated Testing**: Multi-version testing on Node.js 22.x (Maintenance LTS) and 24.x (Active LTS)
- **Code Quality**: ESLint, Prettier, and TypeScript strict mode validation
- **Release Automation**: Changesets for version management and npm publishing
- **Security**: Weekly dependency vulnerability audits, CodeQL static analysis, and automated dependency updates

For complete CI/CD documentation, deployment guides, and npm publishing instructions, see **[Deployment](./docs/deployment.md)**.

### Mechanical invariant guards

Beyond linting, the repo enforces its architecture and conventions with **60+ purpose-built guard scripts** under [`scripts/`](./scripts/README.md), each with its own co-located test suite. They run on every commit (husky pre-commit) and in CI (`pnpm test:scripts`), and cover, among others:

- **Hexagonal architecture** — layer purity, adapter isolation, and the `packages/core/src/` directory allowlist (`check-architecture.mjs`)
- **Package dependency graph** — every `@kaiord/*` dependency must match the spec table (`check-package-deps.mjs`)
- **Test conventions** — `should `-prefixed titles and Arrange/Act/Assert structure on every test (`check-test-title-should.mjs`, `check-test-aaa.mjs`)
- **Privacy** — no runtime values interpolated into toasts or console logs (`check-no-pii-leakage.mjs`)
- **State discipline** — no Zustand store writes persistence directly (`check-no-zustand-writethrough.mjs`)
- **Spec hygiene** — OpenSpec format, archive dates, and auto-generated indexes stay in sync (`check-spec-format.mjs`, `check-archive-*.mjs`)

If a rule matters here, a script enforces it — documentation describes the rules, but the guards are what make them true.

### Contributing

To contribute to Kaiord:

1. **Fork and clone** the repository
2. **Create a feature branch**: `git checkout -b feature/my-feature`
3. **Make your changes** following the code style guidelines
4. **Add a changeset**: `pnpm exec changeset` (for version-worthy changes)
5. **Test locally**: `pnpm -r test` and `pnpm -r build`
6. **Submit a PR**: All checks must pass before merging

For detailed contribution guidelines, development workflow, and code standards, see **[Contributing](./CONTRIBUTING.md)**.

---

## 📚 References & Resources

### Format Specifications

- [Garmin FIT SDK (JavaScript)](https://github.com/garmin/fit-javascript-sdk) - Official FIT protocol implementation
- [FIT Workout Files Cookbook](https://developer.garmin.com/fit/cookbook/encoding-workout-files/) - Guide to encoding workout files
- [FIT File Types: Workout](https://developer.garmin.com/fit/file-types/workout/) - Workout file type specification
- [Training Center XML (TCX)](https://en.wikipedia.org/wiki/Training_Center_XML) - Garmin's XML-based format
- [TCX Schema (XSD)](https://www8.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd) - Official Garmin TCX schema definition
- [Zwift Workout Format (ZWO)](https://zwift.com) - Zwift's XML-based workout format

---

## ❤️ Support

If you find Kaiord useful, consider supporting its development:

- ⭐ **Star this repo** to help others discover it
- 💖 **[Sponsor on GitHub](https://github.com/sponsors/pablo-albaladejo)**
- ☕ **[Buy me a coffee](https://buymeacoffee.com/pabloalbaladejo)**

Your support helps maintain and improve Kaiord for the fitness community!

Built by **[Pablo Albaladejo](https://pabloalbaladejo.com)**

---

## 📜 License

MIT © 2025 Pablo Albaladejo
See [LICENSE](./LICENSE) for details.
