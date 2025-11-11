# Hook: Spec Gate

**Event**: manual  
**Trigger**: `packages/**`

## Steps

1. Check if a SPEC exists in `.kiro/specs/**` for any new parser/writer
2. Verify `tasks.md` has no unchecked items for completed features
3. Warn if implementation exists without corresponding spec

## Commands

```bash
# List all specs
ls -la .kiro/specs/

# Check for unchecked tasks in a spec
grep -n "\[ \]" .kiro/specs/*/tasks.md

# Find parsers/writers without specs
find packages/core/src -name "*parser*" -o -name "*writer*"
```

## Success Criteria

- Every parser/writer has a corresponding spec in `.kiro/specs/`
- All tasks in `tasks.md` are checked for completed features
- No orphaned implementations without design documentation
