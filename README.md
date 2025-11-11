# 🧬 Kaiord Monorepo

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
