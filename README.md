# ⏱️ Kaiord — Structured Workout Data Toolkit

[![Kiroween Hackathon](https://img.shields.io/badge/Kiroween-Hackathon-orange?style=flat&logo=devpost)](https://kiroween.devpost.com/)
[![Built with Kiro](https://img.shields.io/badge/Built%20with-Kiro-blueviolet?style=flat)](https://kiro.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)

[![CI](https://github.com/pablo-albaladejo/kaiord/actions/workflows/ci.yml/badge.svg)](https://github.com/pablo-albaladejo/kaiord/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/pablo-albaladejo/kaiord/branch/main/graph/badge.svg)](https://codecov.io/gh/pablo-albaladejo/kaiord)
[![npm version](https://badge.fury.io/js/@kaiord%2Fcore.svg)](https://www.npmjs.com/package/@kaiord/core)
[![npm version](https://badge.fury.io/js/@kaiord%2Fcli.svg)](https://www.npmjs.com/package/@kaiord/cli)

> 👻 **Built for [Kiroween Hackathon](https://kiroween.devpost.com/)** - Showcasing AI-assisted development with [Kiro](https://kiro.dev)

**Kaiord** is an open-source toolkit for structured workout data.

It provides:

- `@kaiord/core`: a TypeScript library to read/write **.fit**, **.tcx**, **.zwo** and **.krd** (Kaiord) files.
- `@kaiord/cli`: a command-line tool to convert between formats.

---

## ✨ Features

- Unified JSON-based format `.krd` (Kaiord Representation Definition)
- Schema validation (AJV)
- Spec-driven development with [Kiro](https://kiro.dev)
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

### Testing Deployment Locally

Before pushing changes that affect the SPA deployment, test the CI workflow locally:

```bash
# Make script executable (first time only)
chmod +x scripts/test-ci-workflows.sh

# Run all CI tests
./scripts/test-ci-workflows.sh
```

This simulates the GitHub Actions deployment workflow and validates:

- Core package builds successfully
- SPA builds with core dependency
- Build artifacts are correct
- Base path configuration is valid

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment documentation.

---

## 🚀 CI/CD Pipeline

Kaiord uses GitHub Actions for continuous integration and deployment. The pipeline includes:

### Automated Testing

- **Multi-version testing**: Tests run on Node.js 20.x and 22.x
- **Intelligent change detection**: Only affected packages are tested
- **Coverage reporting**: Automatic coverage reports with Codecov
- **Round-trip validation**: Ensures lossless format conversions

### Code Quality

- **Linting**: ESLint and Prettier checks on every PR
- **Type checking**: TypeScript strict mode validation
- **Security scanning**: Weekly dependency vulnerability audits

### Release Automation

- **Changesets**: Automated version management and changelog generation
- **npm Publishing**: Automatic package publishing on release
- **GitHub Releases**: Automated release notes from changesets

### Contributing

To contribute to Kaiord:

1. **Fork and clone** the repository
2. **Create a feature branch**: `git checkout -b feature/my-feature`
3. **Make your changes** following the code style guidelines
4. **Add a changeset**: `pnpm exec changeset` (for version-worthy changes)
5. **Test locally**: `pnpm -r test` and `pnpm -r build`
6. **Test workflows**: Use `act` to test GitHub Actions locally (see [TESTING_WORKFLOWS.md](./.github/TESTING_WORKFLOWS.md))
7. **Submit a PR**: All checks must pass before merging

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

### Publishing to npm

For maintainers publishing packages to npm:

**🎉 Recommended: Trusted Publishing (No Tokens!)**

1. **Publish manually once:**

   ```bash
   npm login
   pnpm -r build
   pnpm --filter @kaiord/core publish --access public
   ```

2. **Configure on npm:** Go to package settings and add GitHub Actions as trusted publisher

3. **Done!** Future releases publish automatically with cryptographic provenance.

See [Trusted Publishing Guide](./.github/NPM_TRUSTED_PUBLISHING.md) for details.

**Alternative: Token-Based (Legacy)**

```bash
pnpm setup:npm  # Automated token setup
```

See [Setup Checklist](./.github/SETUP_CHECKLIST.md) for all options.

---

## 📦 Releases

Kaiord uses **package-scoped release tags** to clearly identify which package is being released in our monorepo.

### Tag Format

Each release tag includes the package name and version:

```
@kaiord/core@1.2.3
@kaiord/cli@0.5.0
```

This format provides clear traceability and makes it easy to identify which package a release belongs to.

### Viewing Releases

**View all releases:**

```bash
git tag
```

**View releases for a specific package:**

```bash
# Core package releases
git tag -l "@kaiord/core@*"

# CLI package releases
git tag -l "@kaiord/cli@*"
```

**View latest release for a package:**

```bash
# Core package
git tag -l "@kaiord/core@*" | sort -V | tail -n 1

# CLI package
git tag -l "@kaiord/cli@*" | sort -V | tail -n 1
```

### GitHub Releases

Each package has its own GitHub releases with package-specific changelogs:

- **Core releases**: Filter by `@kaiord/core` in the [Releases page](https://github.com/pablo-albaladejo/kaiord/releases)
- **CLI releases**: Filter by `@kaiord/cli` in the [Releases page](https://github.com/pablo-albaladejo/kaiord/releases)

Each GitHub release includes:

- Package-specific changelog entries
- Direct link to the npm package
- Version comparison links

### Release Process

Releases are automated using [Changesets](https://github.com/changesets/changesets):

1. **Add a changeset**: `pnpm exec changeset`
2. **Merge "Version Packages" PR**: Changesets creates a PR with version bumps
3. **Automatic publishing**: Merging the PR triggers:
   - Package-scoped tag creation (e.g., `@kaiord/core@1.2.3`)
   - npm package publishing
   - GitHub release creation with changelog

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed release guidelines.

---

## 📚 Documentation

- [NEW_FIELDS.md](./docs/NEW_FIELDS.md) - Detailed guide to new field support with examples
- [CHANGELOG.md](./CHANGELOG.md) - Version history and release notes
- [KRD Format Specification](./.kiro/steering/krd-format.md) - Complete KRD format documentation
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines and workflow
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide for GitHub Pages
- [CI/CD Workflows](./.github/workflows/README.md) - Complete CI/CD documentation
- [Testing Workflows Locally](./.github/TESTING_WORKFLOWS.md) - Guide to testing GitHub Actions with `act`

---

## 📚 References & Resources

### Format Specifications

- [Garmin FIT SDK (JavaScript)](https://github.com/garmin/fit-javascript-sdk) - Official FIT protocol implementation
- [FIT Workout Files Cookbook](https://developer.garmin.com/fit/cookbook/encoding-workout-files/) - Guide to encoding workout files
- [FIT File Types: Workout](https://developer.garmin.com/fit/file-types/workout/) - Workout file type specification
- [Training Center XML (TCX)](https://en.wikipedia.org/wiki/Training_Center_XML) - Garmin's XML-based format
- [TCX Schema (XSD)](https://www8.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd) - Official Garmin TCX schema definition
- [Zwift Workout Format (ZWO)](https://zwift.com) - Zwift's XML-based workout format

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
- **GitHub MCP** → direct GitHub integration for PR/issue management.

All configuration lives under `.kiro/` and is version-controlled for reproducibility.

### GitHub MCP Setup

Kaiord uses the GitHub MCP server to enable direct GitHub interactions from Kiro:

```bash
# Run the automated setup script
./scripts/setup-github-mcp.sh
```

This configures:

- GitHub Personal Access Token authentication
- Docker-based MCP server
- Automatic PR/issue management capabilities

See [GitHub MCP Integration](./.kiro/steering/github-mcp.md) for complete documentation.
