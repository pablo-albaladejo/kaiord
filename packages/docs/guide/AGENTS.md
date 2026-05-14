<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# guide

## Purpose

Long-form guides and tutorial documentation. Covers quick-start, installation, architecture, testing, contributing, and philosophy of Kaiord. Hand-written content aimed at users learning to use or contribute to Kaiord.

## Key Files

- `quick-start.md` — 5-minute introduction: install packages, convert FIT to TCX in 4 lines of code
- `getting-started.md` — Installation and setup instructions
- `architecture.md` — Hexagonal architecture deep-dive, port/adapter pattern, KRD canonical format, package structure
- `testing.md` — Testing strategies: unit tests, integration tests, round-trip tests, coverage expectations, test utilities
- `contributing.md` — Contribution workflow: spec phase, branch naming, testing, changesets, commits
- `why-kaiord.md` — Problem statement and philosophy: why Kaiord solves the fitness data fragmentation problem

## Subdirectories

None. All content is in this directory.

## For AI Agents

### Working In This Directory

Edit hand-written Markdown files directly. Keep content scannable with headers, code blocks, tables, and bullet points.

**Conventions:**

1. Frontmatter: Every .md file needs `title` and `description` (for SEO).
2. Code examples: Use ` ```ts twoslash ``` ` for executable TypeScript; ` ```bash ``` ` for CLI. Include language tags.
3. Links: Use relative links (e.g., `/guide/architecture`, `/api/core/functions/fromBinary`). VitePress resolves them.
4. Cross-references: Link to API docs, other guides, format specs as appropriate.

### Testing Requirements

- **Spelling**: `pnpm --filter @kaiord/docs spellcheck` validates all .md files (excludes api/).
- **Formatting**: `pnpm --filter @kaiord/docs lint:fix` auto-formats with Prettier.
- **Build validation**: `pnpm --filter @kaiord/docs build` must complete without errors. Catches broken links.
- **Link integrity**: Verify internal links (e.g., `/api/core/functions/fromBinary`) exist in the built site.

### Common Patterns

- **Example-driven**: Quick-start shows working code upfront. Testing guide includes copy-paste examples.
- **Architecture clarity**: Architecture guide explains hexagonal pattern, domain/application/adapter layers, and the KRD format as the center.
- **Beginner-friendly**: Getting-started guide assumes Node.js/pnpm familiarity but explains Kaiord from scratch.
- **Spec-linked**: Contributing guide references OpenSpec workflow (`/opsx:explore`, etc.).

## Dependencies

### Internal

- `@kaiord/core`, `@kaiord/fit`, `@kaiord/tcx`, etc. — Used in code examples (indirectly; examples are conceptual)
- `/api/` — Cross-references to API docs
- `openspec/specs/` — Contributing guide references spec workflow

### External

- **VitePress** — Renders Markdown to HTML
- **Shikijs** — Code syntax highlighting

<!-- MANUAL: -->

## Notes for Agents

1. **Quick-start is the hook**: It's the first thing users read. Keep it simple, working, and fast (under 5 minutes).
2. **Architecture guide is authoritative**: It defines the hexagonal pattern and the role of KRD. Keep it in sync with CLAUDE.md.
3. **Testing guide sets expectations**: Coverage thresholds (80% core, 70% frontend) and round-trip tolerances (±1s, ±1W, ±1bpm, ±1rpm) are documented here.
4. **Contributing guide is process-heavy**: It references OpenSpec, changesets, and conventional commits. Update if the contribution workflow changes.
5. **Code examples must work**: Every code block in quick-start and getting-started should run. Test before committing.
