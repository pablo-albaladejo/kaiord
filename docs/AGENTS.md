<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# docs

## Purpose

Repo-level documentation that targets contributors and operators. Distinct
from `packages/docs/` (the public VitePress site at kaiord.com). Houses
architecture explainers, format specs, contributor guides, plans, and
production runbooks.

## Key Files

| File                                          | Description                                                |
| --------------------------------------------- | ---------------------------------------------------------- |
| `README.md`                                   | Overview of what's in this folder                          |
| `architecture.md`                             | Hexagonal architecture deep-dive (ports/adapters layering) |
| `krd-format.md`                               | Canonical KRD format specification                         |
| `getting-started.md`                          | Contributor on-ramp                                        |
| `testing.md`                                  | Testing strategy (unit, integration, round-trip, e2e)      |
| `deployment.md`                               | Deployment overview (npm, CWS, Pages, docs)                |
| `specs.md`                                    | OpenSpec workflow primer                                   |
| `roadmap-fit-implementation.md`               | Roadmap for FIT-adapter feature coverage                   |
| `plan-phase2-lap-implementation.md`           | Phase-2 lap-support plan                                   |
| `plan-phase2.2-activity-course-file-types.md` | Phase-2.2 activity/course file-type plan                   |
| `mcp-lambda-chat.md`                          | Notes on MCP-server deployment as a Lambda chat backend    |
| `cws-credentials-setup.md`                    | Chrome Web Store credentials setup (companion to runbook)  |
| `garmin-bridge-migration.md`                  | Migration notes for garmin-bridge changes                  |
| `npm-trusted-publishing.md`                   | NPM trusted-publishing / OIDC notes                        |
| `NPM_OPTIMIZATION_GUIDE.md`                   | Bundle-size / dependency optimization checklist            |
| `SETUP-NPM-PUBLISHING.md`                     | One-time NPM publishing setup                              |
| `ci-bypass-fix.md`                            | Incident notes on a past CI-bypass issue                   |
| `PLUGINS.md`                                  | Repo Claude-Code plugin inventory                          |
| `PLUGINS-COMPLETE-WORKFLOW-EXAMPLE.md`        | Worked example: plugin workflow end-to-end                 |
| `PLUGINS-INSTALLATION-SUMMARY.md`             | Plugin install summary                                     |
| `PLUGINS-QUICK-REFERENCE.md`                  | Quick-reference card for repo plugins                      |

## Subdirectories

| Directory   | Purpose                                                                            |
| ----------- | ---------------------------------------------------------------------------------- |
| `runbooks/` | Operational runbooks for production-impacting workflows (see `runbooks/AGENTS.md`) |

## For AI Agents

### Working In This Directory

- This folder is for **contributor/operator** docs. Public end-user docs
  (kaiord.com/docs) live in `packages/docs/`.
- Prefer updating the canonical doc rather than creating a new file. Most
  topics already have a home.
- Architecture and KRD specs MUST stay synchronized with the code under
  `packages/core/`. If the architecture changes, update `architecture.md`
  in the same PR.
- `mdast` link checking runs via `pnpm lint:links` (`lychee.toml` at root);
  fix broken internal links rather than ignoring them.

### Testing Requirements

This folder ships no code, so it has no test suite. Static checks:

- `pnpm lint:links` — link integrity (lychee).
- `pnpm lint:specs` / `pnpm lint:archive` — adjacent spec/archive invariants.
- Prettier formatting via `pnpm format`.

### Common Patterns

- Plans live as `plan-*.md`; once executed they get moved into an OpenSpec
  archive entry, not deleted.
- Runbooks live in `runbooks/` and are referenced by name from CI workflows
  and incident docs.

## Dependencies

### Internal

- Heavily references `openspec/specs/` and `packages/*` source.

### External

None at runtime — Markdown only.

<!-- MANUAL: -->
