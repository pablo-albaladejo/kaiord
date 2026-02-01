# ⏱️ Kaiord — Structured Workout Data Toolkit

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)

[![CI](https://github.com/pablo-albaladejo/kaiord/actions/workflows/ci.yml/badge.svg)](https://github.com/pablo-albaladejo/kaiord/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/pablo-albaladejo/kaiord/branch/main/graph/badge.svg)](https://codecov.io/gh/pablo-albaladejo/kaiord)
[![npm version](https://badge.fury.io/js/@kaiord%2Fcore.svg)](https://www.npmjs.com/package/@kaiord/core)
[![npm version](https://badge.fury.io/js/@kaiord%2Fcli.svg)](https://www.npmjs.com/package/@kaiord/cli)

**Kaiord** is an open-source toolkit for structured workout data.

It provides:

- `@kaiord/core`: a TypeScript library to read/write **.fit**, **.tcx**, **.zwo** and **.krd** (Kaiord) files.
- `@kaiord/cli`: a command-line tool to convert between formats.
- **[Workout SPA Editor](https://pablo-albaladejo.github.io/kaiord)**: a web application to create and edit workout files visually.

---

## ✨ Features

- **[Visual Workout Editor](https://pablo-albaladejo.github.io/kaiord)** - Create and edit workouts in your browser
- Unified JSON-based format `.krd` (Kaiord Representation Definition)
- Schema validation (AJV)
- Round-trip safe conversions between FIT / TCX / ZWO / KRD
- Clean architecture & fully typed API

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

| Layer           | Tooling               |
| --------------- | --------------------- |
| Core            | TypeScript, tsup, AJV |
| CLI             | yargs                 |
| Testing         | Vitest                |
| Package manager | pnpm                  |

---

## 🏗 Monorepo Layout

```
kaiord/
├─ packages/
│  ├─ core/                → library (schema + converters)
│  ├─ cli/                 → command-line interface
│  └─ workout-spa-editor/  → web application (https://pablo-albaladejo.github.io/kaiord)
├─ docs/   → documentation
├─ LICENSE
├─ README.md
└─ pnpm-workspace.yaml
```

---

## 🚀 Quick Start

### Try the Web App

**[Launch Workout Editor →](https://pablo-albaladejo.github.io/kaiord)**

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

- **Automated Testing**: Multi-version testing on Node.js 20.x and 22.x
- **Code Quality**: ESLint, Prettier, and TypeScript strict mode validation
- **Release Automation**: Changesets for version management and npm publishing
- **Security**: Weekly dependency vulnerability audits

For complete CI/CD documentation, deployment guides, and npm publishing instructions, see **[Deployment](./docs/deployment.md)**.

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

## 📜 License

MIT © 2025 Pablo Albaladejo
See [LICENSE](./LICENSE) for details.
