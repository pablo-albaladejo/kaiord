## 1. Workflow Permissions & Triggers

- [ ] 1.1 Update permissions block: add `pull-requests: write`, downgrade `issues: write` to `issues: read`
- [ ] 1.2 Remove the infinite-loop guard (`if: "!contains(...)"`on the job), relying on the action's internal changeset detection instead
- [ ] 1.3 Verify `workflow_dispatch` trigger is preserved

## 2. Changesets Action Integration

- [ ] 2.1 Replace the entire `Version packages` step with `changesets/action@v1`. This removes: `changeset version`, `pnpm install --no-frozen-lockfile`, the 9 individual `pnpm --filter` build commands, the before/after version diffing, and the `git commit` + `git push`. Assign `id: changesets` to the step. Pass `version: pnpm exec changeset version && pnpm install --no-frozen-lockfile` (to keep `pnpm-lock.yaml` in sync in the Version Packages PR) and `publish: pnpm -r build && pnpm exec changeset publish` (build is needed because most packages lack `prepublishOnly` scripts — without it, `dist/` would be missing from published tarballs). Set `GITHUB_TOKEN` and `NPM_CONFIG_PROVENANCE: true` in env. Keep `fetch-depth: 0` on the checkout step — the action needs full git history for tag creation during publish
- [ ] 2.2 Remove the `Check for pending changesets` step — the action handles detection internally
- [ ] 2.3 Remove the `Publish to npm with provenance` step — publish is now handled by the action's `publish` input

## 3. GitHub Releases Script

- [ ] 3.1 Refactor `create-github-releases.js` to accept `PUBLISHED_PACKAGES` env var: parse JSON array of `{ name, version }` when set. Add a `dir` property derived from the package name (strip `@kaiord/` prefix). Validate path with `fs.existsSync` before changelog extraction. Fall back to hardcoded list of all 9 publishable packages when env var is not set. Wrap `JSON.parse` in try/catch, falling back to `getPackagesFromDisk()` on parse failure
- [ ] 3.2 Update the `Create GitHub Releases` workflow step: pass `PUBLISHED_PACKAGES: ${{ steps.changesets.outputs.publishedPackages }}` as env var, set `if: steps.changesets.outputs.published == 'true'`

## 4. Summary & Cleanup

- [ ] 4.1 Rewrite the `Summary` step to iterate over `publishedPackages` JSON array instead of per-package conditionals. Set `if: steps.changesets.outputs.published == 'true'`
- [ ] 4.2 Update the `No changes` step condition to `if: steps.changesets.outputs.published != 'true'` (keep the step — it provides useful feedback in the step summary when no release occurs, matching the spec's "No packages published" scenario)

## 5. Verification

- [ ] 5.1 Validate the workflow YAML: (a) step ID `changesets` exists on the action step, (b) `if` conditionals reference `steps.changesets.outputs.published`, (c) permissions match D3 (contents write, pull-requests write, issues read, id-token write), (d) no remnants of old version-diffing or manual publish steps, (e) `workflow_dispatch` trigger preserved, (f) `fetch-depth: 0` on checkout step
- [ ] 5.2 Verify the fallback `dirs` array in `create-github-releases.js` contains exactly 9 entries matching all publishable packages (core, fit, tcx, zwo, garmin, garmin-connect, cli, mcp, ai)
- [ ] 5.3 Create changeset for this fix
