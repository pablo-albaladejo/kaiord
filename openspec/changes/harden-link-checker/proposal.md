## Why

The CI "Link checker" job broke silently on 2026-04-24 when the `taiki-e/install-action@v2` action started installing `lychee@0.24.0`, which changed `include_fragments` from a boolean to a string enum. Because the check is NOT in the required-status-check set and the repo's `enforce_admins` is `false`, the regression (a) did not block any PR merge and (b) hid in the "other checks" section of the GitHub UI where it is easy to miss. PR #342 was admin-bypassed past it.

Two structural weaknesses let this happen:

1. The lychee CLI version floats — every CI run installs the latest lychee, so any new lychee release can break internal-link checking without a PR.
2. "Link checker" is an optional check. A broken link checker does not block merge, so documentation can drift silently when the guard itself is silenced.

The doc-drift-prevention spec already states "Broken links SHALL fail the build" but does not say that the check itself is a required gate, nor that the tool is pinned. That loophole is what this change closes.

## What Changes

- **Pin lychee to a MAJOR.MINOR** in `.github/workflows/ci.yml` via `taiki-e/install-action`'s version-specifier form (`tool: lychee@0.24`). Bumps arrive as PRs (via dependabot on github-actions), not as surprise CI failures.
- **Always run Link checker**, not only when `detect-changes.should-test == 'true'`. Lychee is offline and runs in ~10 s — there is no meaningful cost to always running it, and a docs-only PR (where `should-test` may be `false`) is exactly when link-checking matters most.
- **Promote "Link checker" to a required status check** on `main` via branch protection.
- **Enable `enforce_admins`** on `main` so that a regression in any required check cannot be admin-bypassed. The repo is a one-maintainer repo; emergency reverts can temporarily disable protection for the ~30 seconds they need.
- **Update `doc-drift-prevention/spec.md`** to capture the three new invariants (pinned lychee, always-runs, required check).

## Capabilities

### Modified Capabilities

- `doc-drift-prevention`: extended with three new requirements (pinned lychee version, always-run Link checker, required-status-check gate) and a modified existing requirement ("CI link checker" becomes a required gate rather than an informational check).

## Impact

- **Package**: none (CI / branch protection only)
- **Layer**: CI infrastructure + OpenSpec
- **Files**:
  - `.github/workflows/ci.yml` — remove the `if:` gate on `check-links`, pin lychee version
  - `lychee.toml` — add a clarifying comment about `include_fragments` being omitted intentionally (value type changed in 0.24; default is fine here)
  - `openspec/specs/doc-drift-prevention/spec.md` — update via delta
  - Branch protection — administrative `gh api` calls after merge (documented in tasks)
- **No runtime impact**, no public API changes, no changeset required.

## Risks & rollback

- Making Link checker required means any lychee misconfig blocks merges. Mitigation: the version is pinned (0.24) so the only way it breaks is a config change in-repo, which is reviewable in the same PR.
- `enforce_admins: true` blocks the one-maintainer workflow in emergencies. Rollback: `gh api -X DELETE repos/.../branches/main/protection/enforce_admins` restores current behavior in one command.
- If dependabot is not already updating github-actions, a new lychee release would not be auto-proposed. Verify `.github/dependabot.yml` has `package-ecosystem: github-actions`; if not, this change adds it.
