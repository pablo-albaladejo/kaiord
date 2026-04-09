## 1. Workflow Permissions & Triggers

- [ ] 1.1 Update permissions block: add `pull-requests: write`, downgrade `issues: write` to `issues: read`
- [ ] 1.2 Remove the infinite-loop guard (`if: "!contains(...)"`on the job), relying on the action's internal changeset detection instead
- [ ] 1.3 Verify `workflow_dispatch` trigger is preserved

## 2. Changesets Action Integration

- [ ] 2.1 Replace the entire `Version packages` step with `changesets/action@v1`. This removes: `changeset version`, `pnpm install --no-frozen-lockfile`, the 9 individual `pnpm --filter` build commands, the before/after version diffing, and the `git commit` + `git push`. Assign `id: changesets` to the step. Pass `version: pnpm exec changeset version && pnpm install --no-frozen-lockfile` (to keep `pnpm-lock.yaml` in sync in the Version Packages PR) and `publish: pnpm -r build && pnpm exec changeset publish` (build is needed because most packages lack `prepublishOnly` scripts — without it, `dist/` would be missing from published tarballs). Set `GITHUB_TOKEN` and `NPM_CONFIG_PROVENANCE: true` in env
- [ ] 2.2 Remove the `Check for pending changesets` step — the action handles detection internally
- [ ] 2.3 Remove the `Publish to npm with provenance` step — publish is now handled by the action's `publish` input

## 3. GitHub Releases Script

- [ ] 3.1 Refactor `create-github-releases.js` to accept `PUBLISHED_PACKAGES` env var: parse JSON array of `{ name, version }` when set (deriving package directory from name by stripping `@kaiord/` prefix, e.g., `@kaiord/core` → `packages/core` for changelog extraction; validate derived path with `fs.existsSync` before attempting changelog extraction, log a warning if directory is missing), fall back to hardcoded list of all 9 publishable packages (core, fit, tcx, zwo, garmin, garmin-connect, cli, mcp, ai) reading each `package.json` for versions when not set. Wrap `JSON.parse` in try/catch, falling back to `getPackagesFromDisk()` on parse failure
- [ ] 3.2 Update the `Create GitHub Releases` workflow step: pass `PUBLISHED_PACKAGES: ${{ steps.changesets.outputs.publishedPackages }}` as env var, set `if: steps.changesets.outputs.published == 'true'`

## 4. Summary & Cleanup

- [ ] 4.1 Rewrite the `Summary` step to iterate over `publishedPackages` JSON array instead of per-package conditionals. Set `if: steps.changesets.outputs.published == 'true'`
- [ ] 4.2 Remove or replace the `No changes` step — update its condition to `if: steps.changesets.outputs.published != 'true'` or remove if the action's PR already communicates the state

## 5. Verification

- [ ] 5.1 Validate the workflow YAML: (a) step ID `changesets` exists on the action step, (b) `if` conditionals reference `steps.changesets.outputs.published`, (c) permissions match D3 (contents write, pull-requests write, issues read, id-token write), (d) no remnants of old version-diffing or manual publish steps, (e) `workflow_dispatch` trigger preserved
- [ ] 5.2 Create changeset for this fix
