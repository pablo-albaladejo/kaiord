---
name: opsx-verify
description: Verify an implemented change against its spec scenarios and acceptance criteria.
---

Verify that the implementation matches the spec.

## Steps

1. Read `openspec/changes/<slug>/specs/` for all requirements and scenarios
2. Read `openspec/changes/<slug>/tasks.md` — confirm all checkboxes are `[x]`
3. For each scenario in the spec:
   - Find the corresponding test file
   - Verify the test covers the Given/When/Then conditions
   - Flag any scenario without a matching test
4. Run full test suite: `pnpm -r test`
5. Run build: `pnpm -r build`
6. Run lint: `pnpm lint`

## Report Format

```
## Verification: <change-name>

### Spec Coverage
- [x] Scenario: <name> — covered by <test-file>
- [ ] Scenario: <name> — MISSING TEST

### Quality Gates
- Tests: PASS/FAIL
- Build: PASS/FAIL
- Lint: PASS/FAIL

### Tasks Completion
- X/Y tasks completed in tasks.md

### Verdict
PASS — ready for PR / FAIL — issues listed above
```
