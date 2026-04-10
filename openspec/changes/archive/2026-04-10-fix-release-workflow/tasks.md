# Tasks: fix-release-workflow

## 1. Workflow YAML

- [x] 1.1 Replace the `Check for pending changesets`, `Version packages`, and `Publish to npm with provenance` steps with a single `changesets/action@v1` step. Use `version` and `publish` inputs per design D1. Set step id to `changesets`.
- [x] 1.2 Remove the `if: "!contains(...)"` guard on the job (design D2)
- [x] 1.3 Update `permissions`: add `pull-requests: write`, downgrade `issues: write` to `issues: read` (design D3)

## 2. Workflow Steps (post-action)

- [x] 2.1 Update the `Create GitHub Releases` step: pass `PUBLISHED_PACKAGES: ${{ steps.changesets.outputs.publishedPackages }}` as env var, set `if: steps.changesets.outputs.published == 'true'`
- [x] 2.2 Rewrite the `Summary` step to iterate over `publishedPackages` JSON array instead of per-package conditionals. Set `if: steps.changesets.outputs.published == 'true'`
- [x] 2.3 Update the `No changes` step condition to `if: steps.changesets.outputs.published != 'true'`

## 3. GitHub Releases Script

- [x] 3.1 Refactor `create-github-releases.js` to accept `PUBLISHED_PACKAGES` env var: parse JSON array of `{ name, version }` when set. Add a `dir` property derived from the package name (strip `@kaiord/` prefix). Validate path with `fs.existsSync` before changelog extraction. Fall back to hardcoded list of all 9 publishable packages when env var is not set. Wrap `JSON.parse` in try/catch, falling back to `getPackagesFromDisk()` on parse failure
- [x] 3.2 Update the `Create GitHub Releases` workflow step: pass `PUBLISHED_PACKAGES: ${{ steps.changesets.outputs.publishedPackages }}` as env var, set `if: steps.changesets.outputs.published == 'true'`

## 4. Summary & Cleanup

- [x] 4.1 Rewrite the `Summary` step to iterate over `publishedPackages` JSON array instead of per-package conditionals. Set `if: steps.changesets.outputs.published == 'true'`
- [x] 4.2 Update the `No changes` step condition to `if: steps.changesets.outputs.published != 'true'` (keep the step — it provides useful feedback in the step summary when no release occurs, matching the spec's "No packages published" scenario)

## 5. Verification

- [x] 5.1 Dry-run: `act` or manual review of YAML syntax (no live test possible without merging to main)
- [x] 5.2 Verify `create-github-releases.js` handles: set env var, unset env var, malformed JSON
- [x] 5.3 Confirm all 9 publishable packages listed in fallback: core, fit, tcx, zwo, garmin, garmin-connect, cli, mcp, ai
