# 🧬 Kaiord Monorepo

[![Kiroween Hackathon](https://img.shields.io/badge/Kiroween-Hackathon-orange?style=flat&logo=devpost)](https://kiroween.devpost.com/)
[![Built with Kiro](https://img.shields.io/badge/Built%20with-Kiro-blueviolet?style=flat)](https://kiro.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)

> 🎃 **Built for [Kiroween Hackathon](https://kiroween.devpost.com/)** - Showcasing AI-assisted development with [Kiro](https://kiro.dev)

**Kaiord** is an open-source toolkit for structured workout data.

It provides:

- `@kaiord/core`: a TypeScript library to read/write **.fit**, **.tcx**, **.pwx** and **.krd** (Kaiord) files.
- `@kaiord/cli`: a command-line tool to convert between formats.

---

## ✨ Features

- Unified JSON-based format `.krd` (Kaiord Representation Definition)
- Schema validation (AJV)
- Spec-driven development with [Kiro](https://kiro.dev)
- Round-trip safe conversions between FIT / TCX / PWX / KRD
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

## 🧩 Tech Stack

| Layer           | Tooling               |
| --------------- | --------------------- |
| Core            | TypeScript, tsup, AJV |
| CLI             | yargs                 |
| Testing         | Vitest                |
| Specs & hooks   | Kiro                  |
| Package manager | pnpm                  |

---

## 🏗 Monorepo Layout

```
kaiord/
├─ packages/
│  ├─ core/ → library (schema + converters)
│  └─ cli/  → command-line interface
├─ .kiro/   → steering docs, specs, hooks
├─ LICENSE
├─ README.md
└─ pnpm-workspace.yaml
```

---

## 🚀 Quick Start

```bash
pnpm install
pnpm -r build
pnpm -r test

# Example usage
pnpm kaiord --help
```

---

## 📚 Documentation

- [NEW_FIELDS.md](./docs/NEW_FIELDS.md) - Detailed guide to new field support with examples
- [CHANGELOG.md](./CHANGELOG.md) - Version history and release notes
- [KRD Format Specification](./.kiro/steering/krd-format.md) - Complete KRD format documentation
- [Testing Workflows Locally](./.github/TESTING_WORKFLOWS.md) - Guide to testing GitHub Actions with `act`

## 📚 References & Resources

### Format Specifications

- [Garmin FIT SDK (JavaScript)](https://github.com/garmin/fit-javascript-sdk) - Official FIT protocol implementation
- [FIT Workout Files Cookbook](https://developer.garmin.com/fit/cookbook/encoding-workout-files/) - Guide to encoding workout files
- [FIT File Types: Workout](https://developer.garmin.com/fit/file-types/workout/) - Workout file type specification
- [Training Center XML (TCX)](https://en.wikipedia.org/wiki/Training_Center_XML) - Garmin's XML-based format
- [PWX (TrainingPeaks)](https://www.trainingpeaks.com/) - TrainingPeaks workout format

### Related Projects

- [Kiro](https://kiro.dev) - AI-powered development environment

---

## 📜 License

MIT © 2025 Pablo Albaladejo  
See [LICENSE](./LICENSE) for details.

---

## 🧭 About Kiro Integration

This project is built using **Kiro** for:

- **Vibe coding** → collaborative code generation with AI.
- **Steering docs** → maintain clean-code and testing principles.
- **Specs** → spec-driven implementation flow.
- **Hooks** → local automated validations (`.kiro/hooks/*`).

All configuration lives under `.kiro/` and is version-controlled for reproducibility.
