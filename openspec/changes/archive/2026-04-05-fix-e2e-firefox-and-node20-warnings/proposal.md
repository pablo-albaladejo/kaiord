> Completed: 2026-04-05

# Proposal: Fix E2E Firefox/mobile test failures and Node.js 20 deprecation warnings

## Problem

Two CI issues are degrading pipeline reliability:

1. **Firefox E2E test failures (and mobile timeouts):** The E2E helper
   `expandFileUpload()` uses `page.getByText(/create manually.*import/i)` which
   resolves to the inner `<span>` inside the accordion `<button>` in
   `ManualCreateSection.tsx`. In Firefox and mobile browsers, clicking the inner
   `<span>` does not reliably propagate to the parent `<button>`'s `onClick`
   handler, causing a 5-second timeout waiting for the file input. This cascades
   across all 14 spec files that import the helper, causing the entire Firefox
   matrix job to fail and mobile jobs to hit the 15-minute timeout.

2. **Node.js 20 deprecation warnings:** GitHub Actions annotations warn that
   `pnpm/action-setup@v4` runs on Node.js 20, which will be force-upgraded to
   Node.js 24 on June 2, 2026. This creates noisy CI output and a future
   breakage risk.

## Solution

1. **E2E helper fix:** Replace `page.getByText(...)` with
   `page.getByRole("button", { name: /create manually.*import/i })` in
   `packages/workout-spa-editor/e2e/helpers/expand-file-upload.ts`. This targets
   the `<button>` element directly, which is the Playwright-recommended locator
   strategy and works reliably across all browser engines.

2. **CI action upgrade:** Upgrade `pnpm/action-setup@v4` to
   `pnpm/action-setup@v5` in all workflow files and the composite action.

## Affected Packages

- `@kaiord/workout-spa-editor` — E2E test helper fix (no source code changes)
- CI/CD infrastructure — GitHub Actions workflow files

## Breaking Changes

None. No public API, domain, or adapter changes.

## Constraints

- Architecture layer(s): none (E2E tests and CI config only)
- Referenced specs: none (no domain/port/adapter changes)
- Risk: low — single-line locator change in a shared helper; action version bump
