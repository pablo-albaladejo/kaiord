<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# lib

## Purpose

Shared helpers used by mechanical lint guards under `scripts/`. Pulled out
of individual guards so common scanning/parsing logic is unit-testable in
one place.

## Key Files

| File                          | Description                                                                                                                                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `find-package-files.mjs`      | Enumerate files under `packages/**` honoring `.gitignore` and `node_modules` exclusion. Used by every guard that walks the workspace.                                                                                                  |
| `strip-jsonc.mjs`             | Strip comments/trailing commas so `JSON.parse` can consume `.json` files that have JSONC syntax (e.g. `tsconfig.json`, `.changeset/config.json`).                                                                                      |
| `site-links-resolve.mjs`      | GitHub Pages path resolution and link extraction for `check-site-links.mjs`. Split out to keep the guard under 100 lines; covered by `check-site-links.test.mjs`.                                                                      |
| `site-links-scan.mjs`         | Walks the built site (`*.html`, `*.md`, `llms*.txt`, `sitemap*.xml`, `robots.txt`) for `check-site-links.mjs` and counts what it checked; covered by `check-site-links.test.mjs`.                                                      |
| `site-csp-policy.mjs`         | The landing, docs and App content security policy, one source list per directive, each remote origin traced to the code that calls it.                                                                                                 |
| `site-csp.mjs`                | Writes that policy into a page as a `<meta>` first in `<head>`, with the sha256 of each inline script. Used by `assemble-site.mjs` and the SPA dev server (`vite.config.ts`).                                                          |
| `site-csp-read.mjs`           | Reads a policy and the executable scripts back out of a served page for `check-site-csp.mjs`; shares no code with the injector. Covered by `check-site-csp.test.mjs`.                                                                  |
| `guard-failure.mjs`           | The failing tail of a guard: a summary with the count, the first 3 problems, how many more, an optional remediation; exits 1. Used by the exact-origin, security-audit, security-policy and site-CSP guards.                           |
| `app-origins.mjs`             | The Kaiord App origin and the two Vite dev origins for the Node-side guards (`check-bridge-exact-origin.mjs`, the docs `check-privacy-policy.mjs`); its test holds them equal to the copy in `_shared/bridge-core/bridge-envelope.js`. |
| `bridge-manifest-origins.mjs` | The manifest half of `check-bridge-exact-origin.mjs`: the allowed `externally_connectable` and announce match patterns per manifest. Covered by `check-bridge-exact-origin.test.mjs`.                                                  |
| `bridge-origin-scan.mjs`      | The source half of `check-bridge-exact-origin.mjs`: walks each bridge's shipped files and flags a partial test of the App origin outside `bridge-envelope.js`. Covered by `check-bridge-exact-origin.test.mjs`.                        |
| `security-audit-rules.mjs`    | The trigger and job rules of `check-security-audit-required.mjs`. Covered by `check-security-audit-required.test.mjs`.                                                                                                                 |
| `claims-units.mjs`            | The units of text a reader sees on a registered claims surface (Markdown blocks, locale messages). Covered by `check-claims.test.mjs`.                                                                                                 |
| `claims-proof.mjs`            | Whether a claim's proof (file, test, endpoint) still exists. Covered by `check-claims.test.mjs`.                                                                                                                                       |
| `clean-git-env.mjs`           | `process.env` minus every `GIT_*` variable. Pass as `env` when a test spawns git (or a script that does): a hook's inherited `GIT_DIR` otherwise rewrites the shared `.git/config`.                                                    |

## For AI Agents

### Working In This Directory

- Helpers MUST stay pure and dependency-free (Node stdlib only).
- A helper is "shared" only when ≥2 guards consume it. Otherwise inline.
- Every helper file MUST have a sibling `*.test.mjs` exercising the public
  contract.

### Testing Requirements

- `node --test scripts/lib/*.test.mjs` is part of `pnpm test:scripts`.
- 100% statement coverage is the de-facto target for this folder (helpers
  are tiny and high-leverage).

### Common Patterns

- Exports are plain functions; no factory wrappers.
- File-system reads accept an optional root for testability.

## Dependencies

### Internal

Consumed by sibling `../check-*.mjs` guards.

### External

Node 22 stdlib only.

<!-- MANUAL: -->
