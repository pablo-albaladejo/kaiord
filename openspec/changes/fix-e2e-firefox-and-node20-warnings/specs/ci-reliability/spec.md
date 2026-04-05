# Spec: CI Reliability — E2E locator fix and action upgrade

## Requirements

### REQ-1: Cross-browser E2E accordion expansion

The `expandFileUpload()` helper SHALL use `page.getByRole("button", ...)` to
locate the accordion toggle button, ensuring reliable click behavior across all
Playwright browser engines (Chromium, Firefox, WebKit) and mobile device
emulations.

The locator MUST match the `<button>` element in `ManualCreateSection.tsx` that
contains the text "Or create manually / import a file".

The helper MUST NOT use `page.getByText()` to locate interactive elements, as
text locators may resolve to non-interactive child elements.

### REQ-2: Node.js 24-compatible CI actions

All GitHub Actions workflow files SHALL use `pnpm/action-setup@v5` (or later)
which supports Node.js 24 natively.

This MUST apply to every file containing `pnpm/action-setup` references:

- `.github/actions/setup-pnpm/action.yml` (also used transitively by `ci.yml`)
- `.github/workflows/workout-spa-editor-e2e.yml`
- `.github/workflows/eval.yml`
- `.github/workflows/security.yml`
- `.github/workflows/deploy-spa-editor.yml`
- `.github/workflows/deploy-infra.yml`
- `.github/workflows/release.yml`

Additionally, `actions/github-script@v7` SHALL be upgraded to `@v8` in:

- `.github/workflows/changeset-bot.yml` (2 occurrences)

After the upgrade, CI MUST NOT produce Node.js deprecation warnings related to
`pnpm/action-setup` or `actions/github-script`.

> **Note:** `.github/workflows/ci.yml` does not directly reference
> `pnpm/action-setup` — it uses the composite action at
> `.github/actions/setup-pnpm/action.yml`, so it is covered transitively.

## Scenarios

### Scenario 1: Firefox E2E accordion click

```
Given the workout SPA editor is loaded in Firefox
When expandFileUpload() is called
Then the accordion button is clicked (not the inner span)
And the file input becomes visible within 5 seconds
```

### Scenario 2: Mobile E2E accordion click

```
Given the workout SPA editor is loaded in Mobile Chrome
When expandFileUpload() is called
Then the accordion button is clicked reliably
And the file input becomes visible within 5 seconds
```

### Scenario 3: Chromium E2E remains unaffected

```
Given the workout SPA editor is loaded in Chromium
When expandFileUpload() is called
Then behavior is identical to before (no regression)
```

### Scenario 4: CI runs without Node.js deprecation warnings

```
Given all workflow files use pnpm/action-setup@v5 and actions/github-script@v8
When any CI workflow runs
Then no "Node.js 20 actions are deprecated" annotations appear
```

### Scenario 5: No stale action versions remain

```
Given all upgrades are applied
When running grep -r "action-setup@v4" .github/
And running grep -r "github-script@v7" .github/
Then both commands return zero results
```
