<!-- opsx-ship: chunking
PR 1 (cleanup): §1, §2, §3, §4, §5, §6
Post-archive (out-of-PR): §7 — /opsx-sync invocation
-->

## 1. Pre-flight verification

- [ ] 1.1 For each DELETE entry in proposal.md, run the D2 grep sweep and record matches; pause if any match falls outside `scripts/<file>`, `scripts/README.md`, `DEPLOYMENT.md`, `docs/deployment.md`, `.github/docs/autonomous-setup.md`, or this change folder
- [ ] 1.2 Confirm `scripts/test-ci-workflows.sh` does not exist on disk and capture the list of stale references in `DEPLOYMENT.md` and `docs/deployment.md`
- [ ] 1.3 Confirm `scripts/publishing/detect-package-changes.sh` and `scripts/publishing/generate-changesets.sh` do not exist on disk
- [ ] 1.4 Confirm no file under `openspec/specs/` references any of the to-be-deleted scripts; if any does, escalate before deletion (the audit indicated none, but verify)

## 2. Orphan-lint script (TDD)

- [ ] 2.1 Write `scripts/check-scripts-orphans.test.mjs` with failing cases: orphan rejected, wired-via-package-json passes, wired-via-workflow passes, wired-via-husky passes, wired-via-claude-settings passes, allowlist entry passes, missing marker block fails, allowlist entry without "When to run" fails
- [ ] 2.2 Implement `scripts/check-scripts-orphans.mjs` until all cases pass; export `findOrphans()` for testability per scripts/README authoring rules
- [ ] 2.3 Wire into root `package.json` so `pnpm test:scripts` runs the test, and add `lint:scripts-orphans` invoked from `pnpm lint`
- [ ] 2.4 Update `scripts/README.md` table with the new script row + invocation column

## 3. README rewrite

- [ ] 3.1 Replace `scripts/README.md` with the index shape from D3: purpose, active-scripts table, manual-maintainer-tools section delimited by `<!-- manual-tools:start -->` / `<!-- manual-tools:end -->`, authoring guide
- [ ] 3.2 Populate the active-scripts table from the proposal KEEP rows
- [ ] 3.3 Seed the manual-tools allowlist with `create-release.sh`, `parse-release-tag.sh`, `validate-package.sh` (the only manual maintainer tools surviving this cleanup)
- [ ] 3.4 Remove every `test-ci-workflows.sh` reference from `DEPLOYMENT.md` (5 hits) and `docs/deployment.md` (3 hits)

## 4. Deletions

- [ ] 4.1 `git rm scripts/generate-brand-assets.mjs`
- [ ] 4.2 `git rm scripts/generate-extension-icons.mjs`
- [ ] 4.3 `git rm scripts/generate-store-assets.mjs`
- [ ] 4.4 `git rm scripts/generate-train2go-store-assets.mjs`
- [ ] 4.5 `git rm scripts/quick-setup-npm-cli.sh`
- [ ] 4.6 `git rm scripts/quick-setup-npm.sh`
- [ ] 4.7 `git rm scripts/setup-npm-publishing.sh`
- [ ] 4.8 `git rm scripts/setup-trusted-publishing-cli.sh`
- [ ] 4.9 `git rm scripts/sync-fonts.sh`
- [ ] 4.10 `git rm scripts/validate-links.sh`
- [ ] 4.11 `git rm scripts/autonomous-loop.sh scripts/com.kaiord.autonomous.plist`
- [ ] 4.12 `git rm -r scripts/prompts/`
- [ ] 4.13 `git rm -r scripts/publishing/`
- [ ] 4.14 `git rm .github/docs/autonomous-setup.md`
- [ ] 4.15 Remove `setup:npm` and `setup:npm:full` keys from root `package.json`

## 5. PR landing

- [ ] 5.1 Run `pnpm lint && pnpm test:scripts && pnpm -r test && pnpm -r build` locally; expect orphan lint green
- [ ] 5.2 No changeset (this PR is internal-only — no consumer-visible artifact changes)
- [ ] 5.3 Open PR: `chore(scripts): drop orphans + add scripts-folder-hygiene guard`
- [ ] 5.4 PR description reminds the user to run `launchctl unload ~/Library/LaunchAgents/com.kaiord.autonomous.plist && rm -f ~/Library/LaunchAgents/com.kaiord.autonomous.plist` on their Mac (one-time local cleanup, not a CI concern)

## 6. Validate and archive

- [ ] 6.1 Run `pnpm exec openspec validate cleanup-scripts-folder --strict` and fix any spec-format issues
- [ ] 6.2 After PR lands on main, run `/opsx-archive` to move this change under `openspec/changes/archive/YYYY-MM-DD-cleanup-scripts-folder/`

## 7. OpenSpec sync (post-archive)

- [ ] 7.1 Run `/opsx-sync` to refresh every domain spec under `openspec/specs/` against the new repo state; the pass is mandatory because `scripts/README.md` is rewritten and `R-ScriptsNoOrphans` lands
- [ ] 7.2 If `/opsx-sync` finds drift, land the resulting spec edits as a separate `chore(specs): sync after scripts cleanup` commit
