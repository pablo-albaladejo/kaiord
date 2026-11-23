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
| `site-links-scan.mjs`         | Walks the built site (`*.html`, `*.md`, `llms*.txt`, `sitemap*.xml`, `robots.txt`) and the App sources that ship a link, for `check-site-links.mjs`, and counts what it checked; covered by `check-site-links.test.mjs`.               |
| `site-csp-policy.mjs`         | The landing, docs and App content security policy, one source list per directive, each remote origin traced to the code that calls it.                                                                                                 |
| `site-csp.mjs`                | Writes that policy into a page as a `<meta>` first in `<head>`, with the sha256 of each inline script. Used by `assemble-site.mjs` and the SPA dev server (`vite.config.ts`).                                                          |
| `site-csp-read.mjs`           | Reads a policy and the executable scripts back out of a served page for `check-site-csp.mjs`; shares no code with the injector. Covered by `check-site-csp.test.mjs`.                                                                  |
| `sw-manifest.mjs`             | The emitter's half of the App service worker: the precached files of `app/`, each revision and cache key, and the version. Used by `emit-spa-service-worker.mjs`. Covered by its sibling `*.test.mjs`.                                 |
| `sw-precache-audit.mjs`       | The guard's half: where a served `app/` tree and its manifest disagree, and what unfits a kill worker. Used by `check-spa-service-worker.mjs`; shares no code with `sw-manifest.mjs`. Covered by its sibling `*.test.mjs`.             |
| `guard-failure.mjs`           | The failing tail of a guard: a summary with the count, the first 3 problems, how many more, an optional remediation; exits 1. Used by the exact-origin, security-audit, security-policy and site-CSP guards.                           |
| `app-origins.mjs`             | The Kaiord App origin and the two Vite dev origins for the Node-side guards (`check-bridge-exact-origin.mjs`, the docs `check-privacy-policy.mjs`); its test holds them equal to the copy in `_shared/bridge-core/bridge-envelope.js`. |
| `bridge-manifest-origins.mjs` | The manifest half of `check-bridge-exact-origin.mjs`: the allowed `externally_connectable` and announce match patterns per manifest. Covered by `check-bridge-exact-origin.test.mjs`.                                                  |
| `bridge-origin-scan.mjs`      | The source half of `check-bridge-exact-origin.mjs`: walks each bridge's shipped files and flags a partial test of the App origin outside `bridge-envelope.js`. Covered by `check-bridge-exact-origin.test.mjs`.                        |
| `security-audit-rules.mjs`    | The trigger and job rules of `check-security-audit-required.mjs`. Covered by `check-security-audit-required.test.mjs`.                                                                                                                 |
| `claims-text.mjs`             | How the claims guard compares text: whitespace collapsed, HTML character references decoded. Used by the units readers. Covered by its sibling `*.test.mjs`.                                                                           |
| `claims-units.mjs`            | The units of text a reader sees on a registered surface: Markdown blocks (HTML inside read as HTML), HTML pages with their JSON-LD, JSON keys or values. Covered by its sibling `*.test.mjs`.                                          |
| `claims-html.mjs`             | The units of an HTML page: text nodes, text alternatives and placeholders, shown metas, a `<pre>` as one unit. Covered by its sibling `*.test.mjs`.                                                                                    |
| `claims-jsonld.mjs`           | The strings a search engine shows from a page's JSON-LD (names, descriptions, answers, feature lists). Covered by its sibling `*.test.mjs`.                                                                                            |
| `claims-json.mjs`             | The units of a JSON surface: the text at named keys, or every string value of a keyless translation file. Covered by its sibling `*.test.mjs`.                                                                                         |
| `claims-owners.mjs`           | Which register file owns each claim id, whole file, section or key. Covered by its sibling `*.test.mjs`.                                                                                                                               |
| `claims-shape.mjs`            | The fields of a register entry by kind (claim, `label`, `external`), `count`, and when an external reading goes stale. Covered by its sibling `*.test.mjs`.                                                                            |
| `claims-proof.mjs`            | Whether one proof (file pin, running test, endpoint) still holds. Covered by its sibling `*.test.mjs`.                                                                                                                                 |
| `claims-strength.mjs`         | Whether a claim's proofs say what it says: a running test or a pin of 16+ characters outside its own surfaces; a label needs none. Covered by its sibling `*.test.mjs`.                                                                |
| `claims-test-runs.mjs`        | Whether a test file holds a test that really runs under a title: not in a comment or string, not skipped, todo, conditional or `.only`-excluded. Covered by its sibling `*.test.mjs`.                                                  |
| `claims-register.mjs`         | The checks of one register file: surfaces read, units registered as many times as they appear, each claim's proofs. Returns the units; mutates nothing. Covered by its sibling `*.test.mjs`.                                           |
| `js-mask.mjs`                 | A JS/TS source with comments, strings, templates and regex bodies blanked (same length), and the list of its literals. Covered by its sibling `*.test.mjs`.                                                                            |
| `method-pipeline-words.mjs`   | A method-note command split into pipeline stages of words without a shell, and the options refused by name. Covered by its sibling `*.test.mjs`.                                                                                       |
| `method-pipeline.mjs`         | Whether a method-note command is an allowed pipeline: git rev-list/log/ls-tree with the note's options, then grep and wc on their input. Covered by its sibling `*.test.mjs`.                                                          |
| `method-pipeline-run.mjs`     | Runs an allowed pipeline with no shell, stage by stage, git with a clean environment and no user or system config. Covered by its sibling `*.test.mjs`.                                                                                |
| `model-price-entry.mjs`       | The checks of one `model-prices.json` entry for `check-model-prices.mjs`: prices or an unpriced reason, `readOn` within 120 days, and a quote holding every price once renewed. Covered by its sibling `*.test.mjs`.                   |
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
