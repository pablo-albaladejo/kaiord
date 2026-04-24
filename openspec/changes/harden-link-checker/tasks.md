# Tasks — harden-link-checker

## 1. CI workflow changes

- [x] 1.1 Remove the `if: always() && needs.detect-changes.outputs.should-test == 'true'` conditional on `check-links` in `.github/workflows/ci.yml` so the job always runs (takes ~10 s, offline, zero marginal cost).
- [x] 1.2 Pin lychee to `0.24` via `taiki-e/install-action` in the same workflow: `tool: lychee@0.24`.
- [ ] 1.3 Add an explanatory comment above the `check-links` job noting why it is always on and why lychee is pinned.

## 2. Config hygiene

- [ ] 2.1 Add a comment to `lychee.toml` explaining that `include_fragments` is intentionally omitted — the setting changed from boolean to string enum in lychee 0.24 and the default (no fragment validation) is correct for this repo's offline/internal link check.

## 3. OpenSpec delta

- [x] 3.1 Write `openspec/changes/harden-link-checker/specs/doc-drift-prevention/spec.md` with the modified `CI link checker` requirement and three new requirements (pinned lychee version, always-run, required status check, admin-bypass protection).
- [ ] 3.2 Run `pnpm lint:specs` locally; fix any structural-lint findings.
- [ ] 3.3 Run `npx openspec validate changes/harden-link-checker` if available.

## 4. Post-merge administrative steps (manual, via `gh api`)

These run **after** the PR merges — the PR itself needs to land with the check STILL optional so CI on the PR does not require itself.

- [ ] 4.1 Add `Link checker` to required status checks:
  ```sh
  gh api -X PATCH repos/pablo-albaladejo/kaiord/branches/main/protection/required_status_checks \
    --input - <<'JSON'
  {
    "strict": true,
    "contexts": [
      "detect-changes","lint","typecheck","test","build","round-trip",
      "Check for Changeset","Link checker"
    ]
  }
  JSON
  ```
- [ ] 4.2 Enable `enforce_admins`:
  ```sh
  gh api -X POST repos/pablo-albaladejo/kaiord/branches/main/protection/enforce_admins
  ```
- [ ] 4.3 Verify with:
  ```sh
  gh api repos/pablo-albaladejo/kaiord/branches/main/protection \
    --jq '{required: .required_status_checks.contexts, enforce_admins: .enforce_admins.enabled}'
  ```
  Expected output contains `Link checker` in `required` and `enforce_admins: true`.

## 5. Verification

- [ ] 5.1 Confirm Link checker runs on the PR itself (it will, since removing the `if:` means it always runs).
- [ ] 5.2 Confirm the PR passes CI (all required + Link checker).
- [ ] 5.3 After post-merge steps, open a trivial follow-up test PR and confirm `Link checker` appears under "Required" in the merge box.
