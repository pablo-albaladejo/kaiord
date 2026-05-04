---
---

ci: build packages once per workflow run and fan dist out to consumer jobs.

Refactors `.github/workflows/ci.yml` so the `build` job is the sole producer of
`packages/*/dist/` per CI run; every consumer job (`lint`, `typecheck`, `test`,
`test-cli`, `test-frontend`, `round-trip`, `e2e-frontend`, `e2e-prod-base`) now
downloads the `build-artifacts` artifact via a new
`.github/actions/consume-build-artifacts` composite action instead of running
`pnpm -r build` from scratch. Bundle analysis (`@codecov/vite-plugin`) moved to
its own dedicated `bundle-analysis` job. Branch-protection summary jobs gain
build-awareness so a build failure cannot land on main.

Tooling-only — no package version bumps.
