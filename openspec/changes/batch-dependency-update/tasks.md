# Tasks: Batch Dependency Update

## 1. CI Actions — Update straggler workflows

- [x] Update `eval.yml`: checkout v4→v6, setup-node v4→v6, upload-artifact v4→v7
- [x] Update `metrics-gate.yml`: upload-artifact v6→v7
- [x] Update `ci.yml`: remaining upload-artifact v6→v7

## 2. Dev Dependencies — Update package.json files

- [x] Update `esbuild` ^0.25.0→^0.27.0 in `packages/infra/package.json`
- [x] Update `storybook` ^10.2.13→^10.2.17 in `packages/workout-spa-editor/package.json`
- [x] Update `autoprefixer` ^10.4.24→^10.4.27 in `packages/workout-spa-editor/package.json`
- [x] Update `@changesets/cli` ^2.29.8→^2.30.0 in root `package.json`
- [x] Update `dependency-cruiser` ^16.0.0→^17.0.0 in root `package.json`

## 3. Lockfile & Config

- [x] Run `pnpm install` to update lockfile
- [x] Verify `.dependency-cruiser.cjs` compatibility with v17 (fix if needed)

## 4. Verification

- [x] `pnpm -r build` passes (especially infra Lambda bundle)
- [x] `pnpm -r test` passes
- [x] `pnpm lint` passes (dependency-cruiser v17 config)
- [ ] Push branch and verify all CI workflows pass

## 5. Cleanup

- [ ] Close Dependabot PRs: #169, #170, #171, #172, #173, #174, #175, #176
- [ ] Close resolved CI failure issues if applicable
