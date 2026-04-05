# Tasks: Fix E2E Firefox/mobile failures and Node.js 20 warnings

## Issue 1: E2E locator fix

- [ ] Update `packages/workout-spa-editor/e2e/helpers/expand-file-upload.ts`:
      change `page.getByText(/create manually.*import/i)` to
      `page.getByRole("button", { name: /create manually.*import/i })`
- [ ] Run E2E tests locally on Firefox to verify the fix:
      `pnpm --filter @kaiord/workout-spa-editor test:e2e --project=firefox`
- [ ] Run E2E tests locally on Chromium to verify no regression:
      `pnpm --filter @kaiord/workout-spa-editor test:e2e --project=chromium`
- [ ] Run E2E tests locally on Mobile Chrome to verify mobile fix:
      `pnpm --filter @kaiord/workout-spa-editor test:e2e --project="Mobile Chrome"`

## Issue 2: Upgrade pnpm/action-setup to v5

- [ ] Update `.github/actions/setup-pnpm/action.yml`:
      `pnpm/action-setup@v4` -> `pnpm/action-setup@v5`
- [ ] Update `.github/workflows/workout-spa-editor-e2e.yml` (2 occurrences):
      `pnpm/action-setup@v4` -> `pnpm/action-setup@v5`
- [ ] Update `.github/workflows/eval.yml`:
      `pnpm/action-setup@v4` -> `pnpm/action-setup@v5`
- [ ] Update `.github/workflows/security.yml`:
      `pnpm/action-setup@v4` -> `pnpm/action-setup@v5`
- [ ] Update `.github/workflows/deploy-spa-editor.yml`:
      `pnpm/action-setup@v4` -> `pnpm/action-setup@v5`
- [ ] Update `.github/workflows/deploy-infra.yml`:
      `pnpm/action-setup@v4` -> `pnpm/action-setup@v5`
- [ ] Update `.github/workflows/release.yml`:
      `pnpm/action-setup@v4` -> `pnpm/action-setup@v5`

## Issue 3: Upgrade actions/github-script to v8

- [ ] Update `.github/workflows/changeset-bot.yml` (2 occurrences):
      `actions/github-script@v7` -> `actions/github-script@v8`

## Verification

- [ ] Run `grep -r "action-setup@v4" .github/` — must return zero results
- [ ] Run `grep -r "github-script@v7" .github/` — must return zero results
- [ ] Run `pnpm lint` to ensure no linting issues
- [ ] Verify CI passes on the PR (Firefox + mobile E2E jobs, no Node.js warnings)

> **Note:** No changeset needed — no published package changes (E2E tests and CI config only).
