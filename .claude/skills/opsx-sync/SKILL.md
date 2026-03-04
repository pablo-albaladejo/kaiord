---
name: opsx-sync
description: Synchronize domain specs with the current codebase state. Run after significant refactors.
---

Keep domain specs aligned with the implementation.

## Steps

1. List all specs in `openspec/specs/`
2. For each spec, find the corresponding source files in `packages/`
3. Read the source code and compare against spec requirements
4. Flag requirements that no longer match the code:
   - Requirements for removed features
   - Scenarios that no longer pass
   - Missing requirements for new capabilities
5. Update spec files to reflect current behavior
6. Present a summary of changes to the user for approval

## Rules

- Only modify files in `openspec/specs/`
- Do NOT modify source code — this syncs specs TO code, not code TO specs
- Preserve the SHALL/MUST/SHOULD/MAY requirement format
- Preserve the Given/When/Then scenario format
- Add `> Synced: YYYY-MM-DD` at the top of updated specs
