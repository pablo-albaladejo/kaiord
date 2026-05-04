## Context

`scripts/` holds ~95 files. The proposal classified each one. This design covers HOW the cleanup runs: ordering of deletions, the user-decision interaction, the README rewrite, and the new orphan-lint script.

The change is pure tooling — no production code, no public API. The only "architecture" decision is the orphan-lint design, which lives outside any hexagonal layer (it's a build-time guard, like the other `scripts/check-*.mjs` siblings).

## Goals / Non-Goals

**Goals:**

- Every file deletion is verified by a grep sweep before it lands.
- The user explicitly approves each DECIDE-tier file before it is deleted.
- After this change, `scripts/README.md` matches reality.
- A mechanical guard prevents this orphan accumulation from recurring.

**Non-Goals:**

- No behavior change to any `@kaiord/*` runtime package.
- No change to the release pipeline (`release.yml`, Trusted Publishing).
- No re-organization of remaining scripts (no renames, no folder moves).
- No changes to git history of removed files (regular `git rm`, not BFG/filter-repo).

## Decisions

### D1 — Single PR

The deletion lands as one PR. Every file in the proposal table that is not load-bearing is deleted. Default-when-unsure is DELETE — anything we hesitate on becomes a deletion. The PR contains: file removals, `scripts/README.md` rewrite, `test-ci-workflows.sh` reference removal in `DEPLOYMENT.md` and `docs/deployment.md`, root `package.json` cleanup (`setup:npm*`), and the new orphan-lint script.

**Alternative considered:** two batches gated by user-decision questions. Rejected — the user's policy is "if you're not sure, delete it," which collapses the decision surface to zero. One PR is faster to review and has a single rollback target.

### D2 — Verification protocol per deletion

For every file `F` being deleted, the apply step MUST run:

```
grep -rEn "<basename of F>" \
  --include='*.json' --include='*.yml' --include='*.yaml' \
  --include='*.sh' --include='*.mjs' --include='*.js' \
  --include='*.ts' --include='*.tsx' --include='*.md' \
  --exclude-dir=node_modules --exclude-dir=.git \
  --exclude-dir='openspec/changes/archive' \
  .
```

If anything outside `scripts/<F itself>`, `scripts/README.md`, or `openspec/changes/cleanup-scripts-folder/` matches, the deletion is paused and the reference is investigated. This is the same verify-before-delete pattern used in past archive cleanups.

### D3 — README rewrite shape

The new `scripts/README.md` is a single-page index, not a tutorial. Sections:

1. One-line purpose statement.
2. **Active scripts** table: name, one-line purpose, wiring point. One row per script. Pulled from the proposal table.
3. **Manual maintainer tools** subsection: scripts that exist but are not auto-invoked (e.g., `create-release.sh`, `sync-fonts.sh` if kept). Each row carries a "When to run" sentence — this is what the orphan lint reads as the allowlist.
4. **Authoring guide for new scripts**: the existing 5-bullet block kept verbatim.

The narrative duplicating `DEPLOYMENT.md` (release flow, changelog format, etc.) is removed — `DEPLOYMENT.md` is the single source.

### D4 — Orphan lint (`check-scripts-orphans.mjs`)

A new lint script. The reachability set is computed by:

1. Read root `package.json` and every `packages/*/package.json` `scripts.*` value; tokenize on whitespace and `&&`; collect any token matching `scripts/<name>` or `./scripts/<name>` or just `<name>` invoked via `node|bash|sh`.
2. Read every `.github/workflows/*.yml` and any `.github/actions/**/action.yml`; collect strings matching `scripts/<name>`.
3. Read every `.husky/*` file; same matching.
4. Read `.claude/settings.json`; same matching.
5. Read every `scripts/*.{mjs,js,sh}` for transitive imports/sources of other scripts.
6. Parse `scripts/README.md`'s **Manual maintainer tools** subsection (delimited by `<!-- manual-tools:start -->` / `<!-- manual-tools:end -->` markers, mirroring the `arch-vocab` pattern in `architecture-hexagonal/SKILL.md`); each listed filename joins the allowlist.

The lint enumerates every file under `scripts/` (excluding `*.test.mjs`, the README itself, the `lib/`, `cws-api/`, and `fixtures/` subfolders, and the `prompts/` folder if kept). For each, fail if it appears in none of the six sets.

**Rule ID:** `R-ScriptsNoOrphans`. Wired into `pnpm test:scripts` and surfaced via `pnpm lint`.

**Alternatives considered:**

- _Simple substring grep without markers._ Rejected: too easy to false-positive on commit messages or unrelated mentions in the README. The marker approach makes the allowlist deliberate.
- _Static-analysis import graph (parse JS/TS)._ Rejected: most invocation sites are YAML and shell, not JS imports. Substring matching against the well-known pattern `scripts/<name>` is sufficient and doesn't need an AST parser.
- _Skip the orphan lint and rely on review._ Rejected: this whole change exists because review didn't catch the accumulation. Mechanical > AI/manual review for deterministic invariants.

### D5 — Local-machine cleanup (out of repo scope)

Deleting `autonomous-loop.sh` and `com.kaiord.autonomous.plist` from the repo does not unload the LaunchAgent that may still be loaded on the user's Mac. The PR description notes this as a one-time manual step:

```
launchctl unload ~/Library/LaunchAgents/com.kaiord.autonomous.plist || true
rm -f ~/Library/LaunchAgents/com.kaiord.autonomous.plist
```

Not enforced by the change; surfaced as a reminder.

### D6 — OpenSpec sync follow-up

After the change archives, run `/opsx-sync` to refresh domain specs against the new repo state. The sync pass is mandatory because (a) `scripts/README.md` is rewritten and (b) the new `R-ScriptsNoOrphans` rule lands. The pre-flight check in tasks.md confirms no existing spec under `openspec/specs/` references any deleted file — but `/opsx-sync` is the system-wide audit and runs unconditionally.

### D7 — Spec scope

The new `scripts-folder-hygiene` capability documents one requirement: orphans are forbidden. It does **not** prescribe what each script must do — that's covered by the existing capability specs (`hexagonal-arch`, `cws-auto-publish`, `extension-store-publish`, etc.) and by `scripts/README.md`.

## Risks / Trade-offs

- [The orphan lint false-positives on a script invoked via a path I didn't think of] → Mitigation: the lint reports the candidate orphans before failing, so a contributor can either wire the script through one of the six legitimate channels or add it to the allowlist marker block. The marker block is the explicit escape hatch.
- [Deleting `setup:npm*` and the legacy scripts removes a path back to token-based publishing if Trusted Publishing breaks] → Mitigation: token-based publishing is documented in npm's official docs and can be reconstructed from `git log` if ever needed; the legacy bash files have low informational value beyond a one-time bootstrap.
- [The README rewrite drops content some contributor relied on] → Mitigation: nothing in the dropped sections is wired to anything. `DEPLOYMENT.md` retains the release narrative. The rewrite is reviewed in PR-A.
- [`generate-{brand,store,train2go-store}-assets.mjs` may be needed when re-generating committed assets] → Mitigation: the rendered assets are committed to the repo; if regeneration is ever needed, the scripts are recoverable from `git log`. None of them is referenced from any tooling, so deletion is verifiable.
- [Autonomous-loop deletion strands a personal LaunchAgent on the user's Mac] → Mitigation: the PR description carries a one-line `launchctl unload` reminder (D5). The repo-side deletion is unconditional; the local cleanup is the user's responsibility.
- [`/opsx-sync` after archive surfaces drift the audit missed] → Mitigation: that's the point of running it. Any drift becomes a follow-up commit, not a regression in this change.
