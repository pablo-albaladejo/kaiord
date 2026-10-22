> Tasks: 5 completed, 0 deferred

# Tasks

- [x] 1. Red first: with the `tanita-bridge` arm lowered to 50 and the `cli` branches threshold lowered to 65 in the working tree, `node scripts/check-coverage-floors-ratchet.mjs` exits 1 and names each lowered floor; reverted, it exits 0.
- [x] 2. Write `scripts/check-coverage-floors-ratchet.mjs`: extract the ci.yml arms (resolved per package, counted only while the call passes `$THRESHOLD`), vitest `thresholds`, codecov status targets and tolerances, and the checker default; compare against the merge base; fail closed on a missing base or an empty source.
- [x] 3. Write `scripts/check-coverage-floors-ratchet.test.mjs` against throwaway git repositories: equal, raised and added, bridge moved to the default arm (pass); lowered, removed, codecov tolerance raised, status made informational, hard-coded checker argument (fail); base ref missing, empty source (fail closed); an exported `GIT_DIR`, as inside a git hook, does not redirect the guard (it drops inherited `GIT_*` variables).
- [x] 4. Wire `lint:coverage-floors` into `lint:parallel`; document the guard in `CLAUDE.md` and `scripts/README.md`.
- [x] 5. Sync the requirement into `openspec/specs/spa-quality-gates/spec.md` and refresh the archive index.
