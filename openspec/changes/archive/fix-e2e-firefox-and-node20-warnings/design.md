# Design: Fix E2E Firefox/mobile failures and Node.js 20 warnings

## Decision 1: Use `getByRole` instead of `getByText` for interactive elements

**Layer:** E2E tests (outside hexagonal architecture)

**Choice:** Replace `page.getByText(/create manually.*import/i)` with
`page.getByRole("button", { name: /create manually.*import/i })`.

**Rationale:**

- `getByText` matches any DOM element containing the text, which in this case
  resolves to the inner `<span>` rather than the parent `<button>`.
- In Firefox and mobile browsers, clicking a `<span>` inside a `<button>` does
  not always propagate the click event to the button's `onClick` handler.
- `getByRole("button", { name: ... })` is the Playwright-recommended locator
  strategy for interactive elements. It queries the accessibility tree, which
  always resolves to the `<button>` element regardless of internal DOM structure.
- This is a single-line change in one shared helper file, with zero risk of
  side effects since the locator is more specific (not less).

**Alternatives considered:**

- `page.locator("button").filter({ hasText: /.../ })` — works but less
  idiomatic than `getByRole`.
- Adding `data-testid` to the button — unnecessary when `getByRole` works and
  is the preferred approach.
- Wrapping click in a retry loop — treats the symptom, not the cause.

## Decision 2: Upgrade `pnpm/action-setup` from v4 to v5

**Layer:** CI/CD infrastructure (outside hexagonal architecture)

**Choice:** Bump `pnpm/action-setup@v4` to `pnpm/action-setup@v5` in all
workflow files.

**Rationale:**

- `pnpm/action-setup@v4` runs on Node.js 20, which GitHub will force-upgrade
  to Node.js 24 on June 2, 2026.
- `pnpm/action-setup@v5` (released as v5.0.0) natively supports Node.js 24.
- The upgrade is a drop-in replacement with no configuration changes needed.
- The `version` input parameter is still supported in v5.

**Alternatives considered:**

- Pinning to a specific commit SHA — more secure against supply-chain attacks
  but harder to maintain without Dependabot/Renovate. Consider as a follow-up.
- Waiting until June 2026 — risks sudden breakage when GitHub forces the
  Node.js 24 runtime.

## Decision 3: Upgrade `actions/github-script` from v7 to v8

**Layer:** CI/CD infrastructure (outside hexagonal architecture)

**Choice:** Bump `actions/github-script@v7` to `actions/github-script@v8` in
`changeset-bot.yml` (2 occurrences).

**Rationale:**

- `actions/github-script@v7` also runs on Node.js 20 and produces the same
  deprecation warning.
- All other workflows already use `@v8`; `changeset-bot.yml` was missed.
- The upgrade is a drop-in replacement.

## Files to modify

| File                                                            | Change                                    |
| --------------------------------------------------------------- | ----------------------------------------- |
| `packages/workout-spa-editor/e2e/helpers/expand-file-upload.ts` | `getByText` -> `getByRole("button", ...)` |
| `.github/actions/setup-pnpm/action.yml`                         | `pnpm/action-setup@v4` -> `@v5`           |
| `.github/workflows/workout-spa-editor-e2e.yml` (2x)             | `pnpm/action-setup@v4` -> `@v5`           |
| `.github/workflows/eval.yml`                                    | `pnpm/action-setup@v4` -> `@v5`           |
| `.github/workflows/security.yml`                                | `pnpm/action-setup@v4` -> `@v5`           |
| `.github/workflows/deploy-spa-editor.yml`                       | `pnpm/action-setup@v4` -> `@v5`           |
| `.github/workflows/deploy-infra.yml`                            | `pnpm/action-setup@v4` -> `@v5`           |
| `.github/workflows/release.yml`                                 | `pnpm/action-setup@v4` -> `@v5`           |
| `.github/workflows/changeset-bot.yml` (2x)                      | `actions/github-script@v7` -> `@v8`       |

## Dependencies

No new dependencies. `pnpm/action-setup@v5` and `actions/github-script@v8` are
GitHub-hosted actions.

## Follow-up considerations

- **SHA pinning:** All third-party actions use mutable version tags (`@v5`,
  `@v8`). For stronger supply-chain security, consider pinning to commit SHAs
  with Dependabot/Renovate for automated updates. Out of scope for this change.
- **Workflow permissions:** Ensure workflows declare minimal `permissions`
  blocks. Out of scope for this change.
