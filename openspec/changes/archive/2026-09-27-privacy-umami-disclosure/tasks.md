# Tasks

## 1. Policy

- [x] 1.1 Replace the "no analytics" sentence in
      `packages/docs/legal/privacy-policy.md` with the approved Umami
      disclosure; keep "We do not use cookies for tracking."; bump
      `Last updated`.

## 2. Guard

- [x] 2.1 Add the Umami disclosure rule to
      `packages/docs/scripts/check-privacy-policy.mjs`.
- [x] 2.2 Add a test that restores the old "no analytics" sentence and asserts
      the Umami rule fails alone; run it against the old policy first and see
      it fail.

## 3. CI

- [x] 3.1 Add the `docs_site` group to `ci.yml` `detect-changes` and to the
      docs-only skip condition.
- [x] 3.2 Keep `scripts/check-ci-fanout-invariants.mjs` and
      `scripts/check-workflow-timeouts.mjs` green.
- [x] 3.3 Prove on a throwaway PR touching only
      `packages/docs/guide/quick-start.md` that `build`, `lint` and `test` run.

## 4. Spec

- [x] 4.1 MODIFY `privacy-policy` "Privacy policy content".
- [x] 4.2 Confirm `ci-build-fanout` does not enumerate the `detect-changes`
      groups (it does not, so it is left unchanged).
