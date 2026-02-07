# Complete Workflow Example - From Start to Main

This guide shows a complete, real-world example of using Claude Code with the installed plugins, from opening the terminal to getting code merged into `main`.

---

## Scenario

**Task**: Add a new utility function to validate workout power zones in the Kaiord core package.

**What we'll do**:

1. Open Claude Code
2. Discuss and plan the feature
3. Write the code with Claude's help
4. Test the implementation
5. Use plugins to review and commit
6. Create and merge a PR

**Time estimate**: 15-30 minutes

---

## Step 1: Open Claude Code

### Terminal Commands

```bash
# Navigate to the Kaiord project
cd ~/development/personal/kaiord

# Start Claude Code
claude
```

### What You'll See

```
╭─ Claude Code ─────────────────────────────────────────╮
│                                                        │
│  Welcome to Claude Code!                              │
│  Project: kaiord                                       │
│  Branch: main                                          │
│                                                        │
╰────────────────────────────────────────────────────────╯

You: _
```

**Note**: The `explanatory-output-style` plugin activates automatically at session start, so Claude will provide educational insights throughout.

---

## Step 2: Describe What You Want

### Your Message

```
I need to add a utility function to validate power zones for workouts.

Requirements:
- Function should validate that power zones are between 1-7
- Should work with both FTP percentage and absolute watts
- Should throw descriptive errors for invalid zones
- Follow Kaiord's code style (max 40 lines, pure function)
- Include tests with AAA pattern

Location: packages/core/src/domain/validators/power-zone-validator.ts
```

### Claude's Response

Claude will:

1. Acknowledge the task
2. Show an **educational insight** about where this fits in hexagonal architecture
3. Ask clarifying questions if needed

**Example insight you'll see**:

```
`★ Insight ─────────────────────────────────────`
This validator belongs in domain/ because:
1. Pure validation logic with no external dependencies
2. Represents a domain rule (power zones 1-7)
3. Can be used by both adapters and application layers
Following hexagonal architecture, domain has zero dependencies.
`─────────────────────────────────────────────────`
```

---

## Step 3: Plan the Implementation

### Your Follow-up

```
Sounds good! Please implement this:
1. Create the validator file
2. Add comprehensive tests
3. Make sure it follows all CLAUDE.md guidelines
```

### What Happens

Claude enters **plan mode** (if needed) and:

1. Reads existing validators to match patterns
2. Plans the implementation
3. Identifies files to create/modify

You'll see Claude use tools like:

- `Read` - Reading existing validators
- `Glob` - Finding similar files
- `Grep` - Searching for patterns

---

## Step 4: Code Implementation

### Claude Creates the Validator

**File**: `packages/core/src/domain/validators/power-zone-validator.ts`

```typescript
import { z } from "zod";

export type PowerZone = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const powerZoneSchema = z
  .number()
  .int("Power zone must be an integer")
  .min(1, "Power zone must be between 1 and 7")
  .max(7, "Power zone must be between 1 and 7")
  .transform((val) => val as PowerZone);

export type PowerValue =
  | { type: "ftp_percent"; value: number }
  | { type: "watts"; value: number };

export function validatePowerZone(zone: number): PowerZone {
  return powerZoneSchema.parse(zone);
}

export function validatePowerValue(power: PowerValue): PowerValue {
  if (power.type === "ftp_percent" && (power.value < 0 || power.value > 300)) {
    throw new Error("FTP percentage must be between 0 and 300");
  }

  if (power.type === "watts" && power.value < 0) {
    throw new Error("Power in watts must be non-negative");
  }

  return power;
}
```

**Line count**: 32 lines ✅ (under 40 limit)

### What You'll Notice

**Security check**: If Claude accidentally uses `eval()` or other dangerous patterns, the `security-guidance` plugin will **block** the operation and show a warning.

**Architecture check**: Your existing hooks will verify this file is in the correct layer (domain/).

**File size check**: After writing, hooks verify it's under 100 lines.

---

## Step 5: Add Tests

### Claude Creates Test File

**File**: `packages/core/src/domain/validators/power-zone-validator.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import type { PowerValue } from "./power-zone-validator.js";
import {
  validatePowerZone,
  validatePowerValue,
  powerZoneSchema,
} from "./power-zone-validator.js";

describe("validatePowerZone", () => {
  it("should accept valid power zones (1-7)", () => {
    // Arrange
    const validZones = [1, 2, 3, 4, 5, 6, 7];

    // Act & Assert
    validZones.forEach((zone) => {
      expect(() => validatePowerZone(zone)).not.toThrow();
      expect(validatePowerZone(zone)).toBe(zone);
    });
  });

  it("should reject power zones below 1", () => {
    // Arrange
    const invalidZone = 0;

    // Act & Assert
    expect(() => validatePowerZone(invalidZone)).toThrow(
      "Power zone must be between 1 and 7"
    );
  });

  it("should reject power zones above 7", () => {
    // Arrange
    const invalidZone = 8;

    // Act & Assert
    expect(() => validatePowerZone(invalidZone)).toThrow(
      "Power zone must be between 1 and 7"
    );
  });

  it("should reject non-integer power zones", () => {
    // Arrange
    const invalidZone = 3.5;

    // Act & Assert
    expect(() => validatePowerZone(invalidZone)).toThrow(
      "Power zone must be an integer"
    );
  });
});

describe("validatePowerValue", () => {
  it("should accept valid FTP percentage (0-300)", () => {
    // Arrange
    const power: PowerValue = { type: "ftp_percent", value: 95 };

    // Act
    const result = validatePowerValue(power);

    // Assert
    expect(result).toEqual(power);
  });

  it("should accept valid watts", () => {
    // Arrange
    const power: PowerValue = { type: "watts", value: 250 };

    // Act
    const result = validatePowerValue(power);

    // Assert
    expect(result).toEqual(power);
  });

  it("should reject negative FTP percentage", () => {
    // Arrange
    const power: PowerValue = { type: "ftp_percent", value: -10 };

    // Act & Assert
    expect(() => validatePowerValue(power)).toThrow(
      "FTP percentage must be between 0 and 300"
    );
  });

  it("should reject FTP percentage above 300", () => {
    // Arrange
    const power: PowerValue = { type: "ftp_percent", value: 350 };

    // Act & Assert
    expect(() => validatePowerValue(power)).toThrow(
      "FTP percentage must be between 0 and 300"
    );
  });

  it("should reject negative watts", () => {
    // Arrange
    const power: PowerValue = { type: "watts", value: -50 };

    // Act & Assert
    expect(() => validatePowerValue(power)).toThrow(
      "Power in watts must be non-negative"
    );
  });

  it("should accept zero watts", () => {
    // Arrange
    const power: PowerValue = { type: "watts", value: 0 };

    // Act
    const result = validatePowerValue(power);

    // Assert
    expect(result).toEqual(power);
  });
});

describe("powerZoneSchema", () => {
  it("should validate and transform valid zones", () => {
    // Arrange
    const validZone = 5;

    // Act
    const result = powerZoneSchema.parse(validZone);

    // Assert
    expect(result).toBe(5);
  });
});
```

**Key points**:

- ✅ AAA pattern (Arrange, Act, Assert)
- ✅ Blank lines between sections
- ✅ Tests exempt from line limits
- ✅ Edge cases covered (0, negatives, boundaries)

---

## Step 6: Run Tests

### Your Message

```
Can you run the tests to make sure everything works?
```

### What Happens

Claude uses the `test` skill (Vitest MCP):

```bash
# Claude runs internally:
pnpm --filter @kaiord/core test power-zone-validator
```

### Test Results

```
✓ packages/core/src/domain/validators/power-zone-validator.test.ts (11)
  ✓ validatePowerZone (4)
    ✓ should accept valid power zones (1-7)
    ✓ should reject power zones below 1
    ✓ should reject power zones above 7
    ✓ should reject non-integer power zones
  ✓ validatePowerValue (6)
    ✓ should accept valid FTP percentage (0-300)
    ✓ should accept valid watts
    ✓ should reject negative FTP percentage
    ✓ should reject FTP percentage above 300
    ✓ should reject negative watts
    ✓ should accept zero watts
  ✓ powerZoneSchema (1)
    ✓ should validate and transform valid zones

Test Files  1 passed (1)
Tests  11 passed (11)
Duration  245ms
```

✅ **All tests pass!**

---

## Step 7: Review the Code (Using Plugins)

### Your Message

```
Great! Now let's review this code before committing.
```

### What Happens

Claude automatically uses the `pr-review-toolkit` agents:

#### 7a. Code Reviewer Agent

```
File: packages/core/src/domain/validators/power-zone-validator.ts
Severity: 15/100 (Low)
Category: Quality
Issue: Consider exporting PowerZone from a types file
Suggestion: For consistency with project structure, consider co-locating
types in domain/types/ if this type will be used across multiple modules.
```

#### 7b. Type Design Analyzer

```
Type: PowerZone (power-zone-validator.ts:3)

Domain Concept: Workout power training zones (1-7)

Ratings:
├─ Encapsulation: 8/10
├─ Invariant Expression: 9/10
├─ Usefulness: 9/10
└─ Invariant Enforcement: 8/10

Overall: 34/40 (Excellent)

Suggestions:
- Consider branded type for extra safety:
  type PowerZone = number & { readonly __brand: 'PowerZone' }
```

#### 7c. Test Analyzer

```
File: power-zone-validator.ts
Tests: power-zone-validator.test.ts

Well-Tested Areas:
✅ Boundary conditions (0, 1, 7, 8)
✅ Type validation (integer vs float)
✅ Both FTP and watts validation
✅ Negative values and edge cases

No critical gaps found. Coverage: Excellent
```

#### 7d. Silent Failure Hunter

```
No silent failures detected.
✅ All errors throw with descriptive messages
✅ No empty catch blocks
✅ No console.log error handling
```

### Educational Insight

```
`★ Insight ─────────────────────────────────────`
The review found only minor suggestions, which is good!
Key strengths of this implementation:
1. Pure function design (no side effects)
2. Clear error messages for debugging
3. Comprehensive test coverage including edge cases
4. Type-safe with literal union (1|2|3|4|5|6|7)
`─────────────────────────────────────────────────`
```

---

## Step 8: Commit the Changes (Using Plugin)

### Your Message

```
Perfect! Let's commit these changes.
/commit
```

### What Happens Behind the Scenes

The `commit-commands` plugin:

1. **Analyzes git status**:

   ```bash
   git status
   # Shows:
   # new file: packages/core/src/domain/validators/power-zone-validator.ts
   # new file: packages/core/src/domain/validators/power-zone-validator.test.ts
   ```

2. **Reviews the diff**:

   ```bash
   git diff HEAD
   ```

3. **Checks recent commits** to match style:

   ```bash
   git log --oneline -10
   ```

4. **Stages files**:

   ```bash
   git add packages/core/src/domain/validators/power-zone-validator.ts
   git add packages/core/src/domain/validators/power-zone-validator.test.ts
   ```

5. **Creates commit with proper message**:

   ```bash
   git commit -m "$(cat <<'EOF'
   feat(core): add power zone validator for workout validation

   - Add validatePowerZone function (zones 1-7)
   - Add validatePowerValue for FTP% and watts
   - Include Zod schema with type-safe transformations
   - Add comprehensive tests with AAA pattern
   - Validates boundaries and edge cases

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   EOF
   )"
   ```

### What You See

```
✅ Commit created successfully!

Commit: feat(core): add power zone validator for workout validation
Files: 2 files changed, 150 insertions(+)

SHA: a1b2c3d
```

---

## Step 9: Build and Lint

### Your Message

```
Let's make sure everything builds and lints correctly before creating a PR.
```

### What Happens

```bash
# Claude runs:
pnpm -r build && pnpm -r test && pnpm lint:fix
```

### Output

```
> @kaiord/core@0.1.0 build
> tsc && tsc-alias

✓ Build completed

> @kaiord/core@0.1.0 test
✓ 215 tests passed

> kaiord@0.1.0 lint:fix
✓ No linting errors
✓ Code formatted with Prettier
```

✅ **Everything passes!**

---

## Step 10: Create Pull Request (Using Plugin)

### Your Message

```
Excellent! Now let's create a PR.
/commit-push-pr
```

### What Happens

The `commit-commands` plugin executes:

#### Step 10a: Create Changeset

```bash
pnpm exec changeset
```

**Interactive prompts**:

```
🦋  What kind of change is this for @kaiord/core?
> minor

🦋  Please enter a summary for this change:
> Add power zone validator with FTP and watts validation

✅ Changeset created: .changeset/brave-lions-sing.md
```

#### Step 10b: Commit Changeset

```bash
git add .changeset/brave-lions-sing.md
git commit -m "chore: add changeset for power zone validator"
```

#### Step 10c: Create Feature Branch

```bash
# We're on main, so create a feature branch
git checkout -b feature/power-zone-validator
```

#### Step 10d: Push to Remote

```bash
git push -u origin feature/power-zone-validator
```

#### Step 10e: Create PR via GitHub CLI

```bash
gh pr create --title "feat(core): add power zone validator" --body "$(cat <<'EOF'
## Summary
- Add `validatePowerZone` function for zones 1-7
- Add `validatePowerValue` for FTP percentage and watts
- Include Zod schema with type-safe transformations
- Comprehensive test coverage with AAA pattern

## Changes
- `packages/core/src/domain/validators/power-zone-validator.ts` (new)
- `packages/core/src/domain/validators/power-zone-validator.test.ts` (new)

## Test Plan
- [x] Unit tests pass (11 tests, all passing)
- [x] Tests follow AAA pattern
- [x] Edge cases covered (boundaries, negatives, non-integers)
- [x] Type safety validated with Zod
- [x] Build successful
- [x] Linting passes

## Architecture
- ✅ Located in `domain/` (pure validation, no dependencies)
- ✅ Follows hexagonal architecture
- ✅ File size: 32 lines (under 40 limit)
- ✅ Function length: all under 10 lines
- ✅ Uses `type` not `interface`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### What You See

```
✅ Pull Request created!

PR #42: feat(core): add power zone validator
URL: https://github.com/pablo-albaladejo/kaiord/pull/42

The PR includes:
- 2 files changed
- 150 lines added
- Changeset for version bump
- Comprehensive description and test plan
```

**Educational Insight**:

```
`★ Insight ─────────────────────────────────────`
The /commit-push-pr command automated several steps:
1. Created changeset (for semantic versioning)
2. Created feature branch from main
3. Pushed to remote
4. Generated PR description from all commits in branch
This saves ~5-10 minutes per PR compared to manual process!
`─────────────────────────────────────────────────`
```

---

## Step 11: View and Review PR

### On GitHub

Navigate to the PR URL: `https://github.com/pablo-albaladejo/kaiord/pull/42`

**What you'll see**:

```markdown
# feat(core): add power zone validator

## Summary

- Add `validatePowerZone` function for zones 1-7
- Add `validatePowerValue` for FTP percentage and watts
- Include Zod schema with type-safe transformations
- Comprehensive test coverage with AAA pattern

## Changes

...

## Test Plan

- [x] Unit tests pass (11 tests, all passing)
      ...

## Architecture

- ✅ Located in `domain/` (pure validation, no dependencies)
  ...

🤖 Generated with Claude Code
```

**Files changed**:

- ✅ `packages/core/src/domain/validators/power-zone-validator.ts`
- ✅ `packages/core/src/domain/validators/power-zone-validator.test.ts`
- ✅ `.changeset/brave-lions-sing.md`

**Checks running**:

- ✅ Build (passing)
- ✅ Tests (passing)
- ✅ Lint (passing)

---

## Step 12: Address Review Feedback (if any)

### Scenario: Reviewer Comments

**Reviewer**: "Great work! Could you add a JSDoc comment to the main function?"

### Your Message to Claude

```
The reviewer asked for JSDoc comments on the main function. Can you add that?
```

### Claude Updates the Code

```typescript
/**
 * Validates that a power zone value is within the valid range (1-7).
 *
 * Power zones represent training intensity levels commonly used in cycling:
 * - Zone 1: Active Recovery
 * - Zone 2: Endurance
 * - Zone 3: Tempo
 * - Zone 4: Lactate Threshold
 * - Zone 5: VO2 Max
 * - Zone 6: Anaerobic Capacity
 * - Zone 7: Neuromuscular Power
 *
 * @param zone - The power zone value to validate (1-7)
 * @returns The validated power zone
 * @throws {ZodError} If the zone is not an integer or outside the 1-7 range
 *
 * @example
 * validatePowerZone(4) // Returns 4
 * validatePowerZone(8) // Throws error: "Power zone must be between 1 and 7"
 * validatePowerZone(3.5) // Throws error: "Power zone must be an integer"
 */
export function validatePowerZone(zone: number): PowerZone {
  return powerZoneSchema.parse(zone);
}
```

### Commit the Update

```
/commit
```

**Result**:

```bash
git commit -m "docs(core): add JSDoc comments to validatePowerZone

- Add detailed JSDoc with zone descriptions
- Include @param, @returns, @throws tags
- Add usage examples

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### Push the Update

```bash
git push
```

---

## Step 13: Merge to Main

### After Approval

Once the PR is approved (all checks pass, reviewers approve):

**On GitHub**:

1. Click "Squash and merge" (recommended) or "Merge pull request"
2. Confirm merge
3. Delete branch: `feature/power-zone-validator`

**Or via CLI**:

```bash
gh pr merge 42 --squash --delete-branch
```

### What Happens

```
✅ Pull request #42 merged into main
✅ Branch feature/power-zone-validator deleted

Merge commit: d4e5f6g
```

---

## Step 14: Clean Up Locally

### Your Message to Claude

```
The PR is merged! Can you clean up the local branch?
/clean_gone
```

### What Happens

The `commit-commands` plugin runs:

```bash
# Update remote tracking
git fetch --prune

# List branches
git branch -v
# Output:
# * main                    d4e5f6g Merge pull request #42
#   feature/power-zone-validator a1b2c3d [gone] feat(core): add power zone validator

# Clean up gone branches
git branch -D feature/power-zone-validator
```

**Result**:

```
✅ Cleaned up 1 gone branch:
   - feature/power-zone-validator

Local repository is now clean!
```

---

## Step 15: Verify on Main

### Check the Code is on Main

```bash
git checkout main
git pull
```

### Verify the Files Exist

```bash
ls -la packages/core/src/domain/validators/
# Output:
# power-zone-validator.ts
# power-zone-validator.test.ts
```

### Run Tests on Main

```bash
pnpm -r test
```

```
✓ 226 tests passed (including 11 new tests)

✅ All tests passing on main!
```

---

## 🎉 Complete! Code is on Main

### Summary of What We Did

| Step      | Action                 | Tool/Plugin Used           | Time        |
| --------- | ---------------------- | -------------------------- | ----------- |
| 1         | Opened Claude Code     | Terminal                   | 1 min       |
| 2-3       | Planned implementation | Claude + insights          | 2 min       |
| 4         | Wrote validator code   | Claude Code                | 3 min       |
| 5         | Wrote tests            | Claude Code                | 3 min       |
| 6         | Ran tests              | `test` skill (Vitest MCP)  | 1 min       |
| 7         | Code review            | `pr-review-toolkit` agents | 2 min       |
| 8         | Committed changes      | `/commit` plugin           | 1 min       |
| 9         | Build and lint         | Claude + Bash              | 2 min       |
| 10        | Created PR             | `/commit-push-pr` plugin   | 2 min       |
| 11        | Review on GitHub       | Manual                     | 5 min       |
| 12        | Address feedback       | Claude + `/commit`         | 2 min       |
| 13        | Merged to main         | GitHub/CLI                 | 1 min       |
| 14        | Cleaned up             | `/clean_gone` plugin       | 1 min       |
| 15        | Verified               | Manual                     | 1 min       |
| **Total** |                        |                            | **~25 min** |

---

## Key Takeaways

### 🚀 Plugins Saved Time

**Without plugins** (traditional workflow):

- ⏱️ ~45-60 minutes
- 15+ manual git commands
- Manual commit message writing
- Manual PR description writing
- Manual changeset creation

**With plugins** (this example):

- ⏱️ ~25 minutes (40% faster!)
- 3 commands: `/commit`, `/commit-push-pr`, `/clean_gone`
- Auto-generated commit messages
- Auto-generated PR descriptions
- Automated changeset creation

### 🛡️ Security Protection

The `security-guidance` plugin would have blocked if we had:

- Used `eval()` or `new Function()`
- Used `child_process.exec()` without safety
- Used dangerous HTML patterns

### 📚 Educational Insights

The `explanatory-output-style` plugin provided insights about:

- Why validators go in `domain/`
- Hexagonal architecture benefits
- How the plugin workflow saves time

### 🔍 Comprehensive Review

The `pr-review-toolkit` analyzed:

- Code quality (code-reviewer)
- Type design (type-design-analyzer)
- Test coverage (pr-test-analyzer)
- Error handling (silent-failure-hunter)

All automatically!

---

## Common Variations

### If Starting from a Branch

```bash
# Already on a feature branch
git checkout -b feature/my-feature

# Work on it, then:
/commit              # Commit changes
/commit-push-pr      # Push and create PR (no branch creation needed)
```

### If Tests Fail

```
"The tests are failing. Can you fix them?"

# Claude will:
1. Analyze the failure
2. Fix the code
3. Re-run tests
4. Only proceed when passing
```

### If PR Has Conflicts

```
"The PR has merge conflicts. Can you help resolve them?"

# Claude will:
1. git pull origin main
2. Identify conflicts
3. Resolve them
4. Run tests
5. Commit resolution
```

### If You Want to Review Before Creating PR

```
# Instead of /commit-push-pr immediately:
/commit                          # Commit locally
"Review this before I push"      # Review with agents
/commit-push-pr                  # Push and create PR
```

---

## Tips for Success

### 1. Be Specific in Requests

**Good**:

```
"Add a validator for power zones 1-7 with tests in domain/validators/"
```

**Too vague**:

```
"Add some validation"
```

### 2. Use the Right Plugin Commands

- `/commit` - For local commits during development
- `/commit-push-pr` - When ready to create a PR
- `/clean_gone` - After PRs are merged

### 3. Trust the Reviews

The `pr-review-toolkit` agents are thorough. If they find issues, fix them before merging.

### 4. Read the Insights

Educational insights help you understand _why_ certain decisions are made. This improves your understanding of the codebase over time.

### 5. Let Security Warnings Guide You

If `security-guidance` blocks an operation, read the warning carefully. It's protecting you from vulnerabilities.

---

## Next Example You Could Try

**Easy next task**:

```
"Add a validator for heart rate zones (1-5) following the same pattern
as the power zone validator we just created."
```

This would:

- Reuse the patterns you just learned
- Take ~15 minutes
- Practice the full workflow again
- Build muscle memory for the plugin commands

---

## Troubleshooting

### "gh pr create" fails

**Issue**: GitHub CLI not authenticated

**Solution**:

```bash
gh auth login
# Follow prompts to authenticate
```

### Changeset prompt doesn't appear

**Issue**: Not a version-worthy change

**Solution**: Only create changesets for features/fixes that need versioning. Docs/tests alone don't need changesets.

### Tests fail on CI but pass locally

**Issue**: Different environments

**Solution**:

```
"Tests are failing on CI. Can you check the CI logs and fix the issue?"
```

### Security hook blocks operation

**Issue**: Dangerous pattern detected

**Solution**: Read the warning, understand the risk, fix the code or acknowledge if intentional.

---

## Conclusion

You now have a complete example of using Claude Code with all the installed plugins to:

1. ✅ Plan and implement a feature
2. ✅ Write comprehensive tests
3. ✅ Review code with multiple specialized agents
4. ✅ Commit with auto-generated messages
5. ✅ Create PRs with detailed descriptions
6. ✅ Merge to main
7. ✅ Clean up branches

**Time saved per PR**: ~20-30 minutes

**Quality improvements**:

- Consistent commit messages
- Comprehensive PR descriptions
- Multi-agent code review
- Security checks
- Educational insights

**Ready to try it yourself?** Start with a small feature and follow this guide step-by-step!

---

**For more information**:

- Full plugin guide: [`docs/PLUGINS.md`](./PLUGINS.md)
- Quick reference: [`docs/PLUGINS-QUICK-REFERENCE.md`](./PLUGINS-QUICK-REFERENCE.md)
- Installation summary: [`docs/PLUGINS-INSTALLATION-SUMMARY.md`](./PLUGINS-INSTALLATION-SUMMARY.md)
