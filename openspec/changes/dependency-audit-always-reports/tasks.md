## 1. Workflow

- [x] 1.1 `security.yml`: unfiltered `pull_request`, push to `main`; the scope decided by a step inside the one named job
- [x] 1.2 Fail on a high or critical finding and on a missing report; retry a registry outage twice
- [x] 1.3 Pin `tj-actions/changed-files` to the v47.0.0 commit in `security.yml` and `ci.yml`

## 2. Guard

- [x] 2.1 `scripts/check-security-audit-required.test.mjs` (red first), then the guard, wired as `pnpm lint:security-audit-required`

## 3. Quality gates

- [x] 3.1 `pnpm test:scripts` and `pnpm lint` pass

## 4. Maintainer

- [ ] 4.1 Add `Dependency Security Audit` to the required status checks of `main` (repo setting, run by the maintainer)
