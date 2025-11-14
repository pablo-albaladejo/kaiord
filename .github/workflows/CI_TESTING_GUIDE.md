# CI Workflow Testing Guide

This guide provides step-by-step instructions for testing the CI workflow with different change scenarios to verify intelligent change detection and conditional job execution.

## Overview

The CI workflow uses intelligent change detection to optimize build times by only testing and building affected packages. This guide covers four key test scenarios:

1. **Core package changes** - Verify both core and cli are tested
2. **CLI package changes** - Verify only cli is tested
3. **Documentation changes** - Verify no tests run
4. **Root dependency changes** - Verify all packages are tested

## Prerequisites

- Git repository with the CI workflow configured
- GitHub repository with Actions enabled
- Write access to create branches and pull requests

## Test Scenario 1: Core Package Changes

**Requirement:** When files change in `packages/core/`, both `@kaiord/core` and `@kaiord/cli` should be tested and built because CLI depends on core.

### Steps

1. **Create test branch:**

   ```bash
   git checkout -b test/ci-core-changes
   ```

2. **Make a change to core package:**

   ```bash
   # Add a comment to a core file
   echo "// Test change for CI workflow" >> packages/core/src/index.ts
   ```

3. **Commit and push:**

   ```bash
   git add packages/core/src/index.ts
   git commit -m "test: verify CI workflow with core package changes"
   git push origin test/ci-core-changes
   ```

4. **Create pull request:**

   ```bash
   gh pr create --title "Test: CI workflow with core package changes" \
     --body "Testing CI workflow change detection for core package modifications.

   **Expected behavior:**
   - ✅ detect-changes job should set core-changed=true
   - ✅ detect-changes job should set cli-changed=true (due to dependency)
   - ✅ detect-changes job should set should-test=true
   - ✅ Both core and cli should be tested
   - ✅ Both core and cli should be built
   - ✅ Coverage reports should be generated for both packages
   - ✅ Round-trip tests should run for both packages"
   ```

### Expected Results

**Change Detection Output:**

```
Core changed: true
CLI changed: true
Should test: true
```

**Jobs Executed:**

- ✅ `detect-changes` - Completes successfully
- ✅ `lint` - Runs on Node 20.x and 22.x
- ✅ `typecheck` - Runs once
- ✅ `test` - Runs for both core and cli on Node 20.x and 22.x
- ✅ `build` - Builds both packages
- ✅ `round-trip` - Tests both packages

**Artifacts Generated:**

- Coverage reports for core (Node 20.x and 22.x)
- Coverage reports for cli (Node 20.x and 22.x)
- Build artifacts for both packages
- Round-trip test results for both packages

### Verification Checklist

- [ ] PR shows all required checks
- [ ] Change detection correctly identifies core changes
- [ ] Both packages are tested in matrix
- [ ] Coverage uploaded to Codecov for both packages
- [ ] Build artifacts contain both packages
- [ ] Workflow completes in < 5 minutes

### Cleanup

```bash
# After verification, close PR and delete branch
gh pr close test/ci-core-changes --delete-branch
git checkout main
git branch -D test/ci-core-changes
```

---

## Test Scenario 2: CLI Package Changes

**Requirement:** When files change only in `packages/cli/`, only `@kaiord/cli` should be tested and built.

### Steps

1. **Create test branch:**

   ```bash
   git checkout -b test/ci-cli-changes
   ```

2. **Make a change to CLI package only:**

   ```bash
   # Add a comment to a CLI file
   echo "// Test change for CI workflow" >> packages/cli/src/index.ts
   ```

3. **Commit and push:**

   ```bash
   git add packages/cli/src/index.ts
   git commit -m "test: verify CI workflow with CLI package changes"
   git push origin test/ci-cli-changes
   ```

4. **Create pull request:**

   ```bash
   gh pr create --title "Test: CI workflow with CLI package changes" \
     --body "Testing CI workflow change detection for CLI package modifications.

   **Expected behavior:**
   - ✅ detect-changes job should set core-changed=false
   - ✅ detect-changes job should set cli-changed=true
   - ✅ detect-changes job should set should-test=true
   - ✅ Only cli should be tested
   - ✅ Only cli should be built
   - ✅ Coverage report should be generated only for cli
   - ✅ Round-trip tests should run only for cli"
   ```

### Expected Results

**Change Detection Output:**

```
Core changed: false
CLI changed: true
Should test: true
```

**Jobs Executed:**

- ✅ `detect-changes` - Completes successfully
- ✅ `lint` - Runs on Node 20.x and 22.x
- ✅ `typecheck` - Runs once
- ✅ `test` - Runs ONLY for cli on Node 20.x and 22.x
- ✅ `build` - Builds ONLY cli package
- ✅ `round-trip` - Tests ONLY cli package

**Jobs Skipped:**

- ⏭️ Core tests skipped (should-test-package=false)
- ⏭️ Core build skipped
- ⏭️ Core round-trip tests skipped

**Artifacts Generated:**

- Coverage reports for cli only (Node 20.x and 22.x)
- Build artifacts for cli only
- Round-trip test results for cli only

### Verification Checklist

- [ ] PR shows all required checks
- [ ] Change detection correctly identifies CLI-only changes
- [ ] Core tests are skipped in matrix
- [ ] Only CLI coverage uploaded to Codecov
- [ ] Build artifacts contain only CLI package
- [ ] Workflow completes faster than full suite (< 3 minutes)

### Cleanup

```bash
gh pr close test/ci-cli-changes --delete-branch
git checkout main
git branch -D test/ci-cli-changes
```

---

## Test Scenario 3: Documentation Changes

**Requirement:** When only documentation files change, no tests or builds should run. Workflow should complete in < 30 seconds.

### Steps

1. **Create test branch:**

   ```bash
   git checkout -b test/ci-docs-changes
   ```

2. **Make changes to documentation only:**

   ```bash
   # Update README
   echo "" >> README.md
   echo "## Test Documentation Change" >> README.md
   echo "This is a test change to verify CI workflow skips tests for docs-only changes." >> README.md

   # Update a markdown file in docs
   echo "Test content" >> docs/NEW_FIELDS.md
   ```

3. **Commit and push:**

   ```bash
   git add README.md docs/NEW_FIELDS.md
   git commit -m "docs: verify CI workflow skips tests for documentation changes"
   git push origin test/ci-docs-changes
   ```

4. **Create pull request:**

   ```bash
   gh pr create --title "Test: CI workflow with documentation changes" \
     --body "Testing CI workflow change detection for documentation-only modifications.

   **Expected behavior:**
   - ✅ detect-changes job should set core-changed=false
   - ✅ detect-changes job should set cli-changed=false
   - ✅ detect-changes job should set should-test=false
   - ✅ No tests should run
   - ✅ No builds should run
   - ✅ Workflow should complete in < 30 seconds"
   ```

### Expected Results

**Change Detection Output:**

```
Core changed: false
CLI changed: false
Should test: false
```

**Jobs Executed:**

- ✅ `detect-changes` - Completes successfully

**Jobs Skipped:**

- ⏭️ `lint` - Skipped (should-test=false)
- ⏭️ `typecheck` - Skipped (should-test=false)
- ⏭️ `test` - Skipped (should-test=false)
- ⏭️ `build` - Skipped (should-test=false)
- ⏭️ `round-trip` - Skipped (should-test=false)

**Performance:**

- Total workflow duration: < 30 seconds
- Only change detection runs

### Verification Checklist

- [ ] PR shows minimal checks (only detect-changes)
- [ ] Change detection correctly identifies docs-only changes
- [ ] All test/build jobs are skipped
- [ ] No artifacts generated
- [ ] Workflow completes in < 30 seconds
- [ ] PR can still be merged (no required checks blocked)

### Cleanup

```bash
gh pr close test/ci-docs-changes --delete-branch
git checkout main
git branch -D test/ci-docs-changes
```

---

## Test Scenario 4: Root Dependency Changes

**Requirement:** When root-level dependencies change (`package.json` or `pnpm-lock.yaml`), all packages should be tested and built.

### Steps

1. **Create test branch:**

   ```bash
   git checkout -b test/ci-root-deps-changes
   ```

2. **Make a change to root dependencies:**

   ```bash
   # Add a dev dependency (or update existing one)
   pnpm add -D -w prettier@latest

   # This will update both package.json and pnpm-lock.yaml
   ```

3. **Commit and push:**

   ```bash
   git add package.json pnpm-lock.yaml
   git commit -m "test: verify CI workflow with root dependency changes"
   git push origin test/ci-root-deps-changes
   ```

4. **Create pull request:**

   ```bash
   gh pr create --title "Test: CI workflow with root dependency changes" \
     --body "Testing CI workflow change detection for root dependency modifications.

   **Expected behavior:**
   - ✅ detect-changes job should set core-changed=true
   - ✅ detect-changes job should set cli-changed=true
   - ✅ detect-changes job should set should-test=true
   - ✅ All packages should be tested
   - ✅ All packages should be built
   - ✅ Full coverage report should be generated
   - ✅ All round-trip tests should run"
   ```

### Expected Results

**Change Detection Output:**

```
Core changed: true
CLI changed: true
Should test: true
```

**Jobs Executed:**

- ✅ `detect-changes` - Completes successfully
- ✅ `lint` - Runs on Node 20.x and 22.x
- ✅ `typecheck` - Runs once
- ✅ `test` - Runs for both core and cli on Node 20.x and 22.x
- ✅ `build` - Builds both packages
- ✅ `round-trip` - Tests both packages

**Artifacts Generated:**

- Coverage reports for both packages (all Node versions)
- Build artifacts for both packages
- Round-trip test results for both packages

### Verification Checklist

- [ ] PR shows all required checks
- [ ] Change detection correctly identifies root dependency changes
- [ ] Both packages are tested in matrix
- [ ] Full coverage uploaded to Codecov
- [ ] Build artifacts contain both packages
- [ ] Workflow completes in < 5 minutes

### Cleanup

```bash
# Revert the dependency change if it was just for testing
gh pr close test/ci-root-deps-changes --delete-branch
git checkout main
git branch -D test/ci-root-deps-changes
```

---

## Automated Testing Script

For convenience, you can use this script to run all test scenarios automatically:

```bash
#!/bin/bash
# test-ci-workflow.sh

set -e

echo "🧪 Testing CI Workflow with Different Scenarios"
echo "================================================"

# Test 1: Core package changes
echo ""
echo "📦 Test 1: Core package changes"
git checkout -b test/ci-core-changes
echo "// Test change $(date)" >> packages/core/src/index.ts
git add packages/core/src/index.ts
git commit -m "test: core package changes"
git push origin test/ci-core-changes
gh pr create --title "Test: Core package changes" --body "Automated test" --draft
echo "✅ PR created for core package changes"
echo "   View at: $(gh pr view --json url -q .url)"

# Wait for user confirmation
read -p "Press enter to continue to next test..."

# Test 2: CLI package changes
echo ""
echo "📦 Test 2: CLI package changes"
git checkout main
git checkout -b test/ci-cli-changes
echo "// Test change $(date)" >> packages/cli/src/index.ts
git add packages/cli/src/index.ts
git commit -m "test: CLI package changes"
git push origin test/ci-cli-changes
gh pr create --title "Test: CLI package changes" --body "Automated test" --draft
echo "✅ PR created for CLI package changes"
echo "   View at: $(gh pr view --json url -q .url)"

# Wait for user confirmation
read -p "Press enter to continue to next test..."

# Test 3: Documentation changes
echo ""
echo "📦 Test 3: Documentation changes"
git checkout main
git checkout -b test/ci-docs-changes
echo "Test change $(date)" >> README.md
git add README.md
git commit -m "docs: documentation changes"
git push origin test/ci-docs-changes
gh pr create --title "Test: Documentation changes" --body "Automated test" --draft
echo "✅ PR created for documentation changes"
echo "   View at: $(gh pr view --json url -q .url)"

# Wait for user confirmation
read -p "Press enter to continue to next test..."

# Test 4: Root dependency changes
echo ""
echo "📦 Test 4: Root dependency changes"
git checkout main
git checkout -b test/ci-root-deps-changes
pnpm add -D -w prettier@latest
git add package.json pnpm-lock.yaml
git commit -m "test: root dependency changes"
git push origin test/ci-root-deps-changes
gh pr create --title "Test: Root dependency changes" --body "Automated test" --draft
echo "✅ PR created for root dependency changes"
echo "   View at: $(gh pr view --json url -q .url)"

echo ""
echo "🎉 All test PRs created!"
echo ""
echo "Next steps:"
echo "1. Review each PR and verify the CI workflow behavior"
echo "2. Check the Actions tab for workflow runs"
echo "3. Verify change detection outputs"
echo "4. Close and delete branches when done"
```

## Monitoring Workflow Runs

### Using GitHub UI

1. Go to **Actions** tab in your repository
2. Filter by workflow: **CI**
3. Click on a workflow run to see details
4. Check job outputs for change detection results

### Using GitHub CLI

```bash
# List recent workflow runs
gh run list --workflow=ci.yml --limit 10

# View specific run
gh run view <run-id>

# Watch a run in real-time
gh run watch <run-id>

# View logs for a specific job
gh run view <run-id> --log --job=<job-id>
```

## Validation Criteria

For each test scenario, verify the following:

### Change Detection

- [ ] `detect-changes` job completes successfully
- [ ] Output variables are set correctly
- [ ] Change detection logic matches expected behavior

### Job Execution

- [ ] Correct jobs run based on changes
- [ ] Unnecessary jobs are skipped
- [ ] Matrix strategy works as expected

### Performance

- [ ] Full suite completes in < 5 minutes
- [ ] Docs-only changes complete in < 30 seconds
- [ ] Cache hit rate > 80%

### Artifacts

- [ ] Coverage reports generated for tested packages
- [ ] Build artifacts contain correct packages
- [ ] Round-trip test results available

### Integration

- [ ] Codecov receives coverage reports
- [ ] Status checks appear on PR
- [ ] Branch protection rules work correctly

## Troubleshooting

### Change Detection Not Working

If change detection doesn't work as expected:

1. **Check file patterns in workflow:**

   ```yaml
   files_yaml: |
     core:
       - 'packages/core/**'
     cli:
       - 'packages/cli/**'
   ```

2. **Verify git history:**

   ```bash
   git log --oneline --graph --all
   git diff origin/main...HEAD --name-only
   ```

3. **Check workflow logs:**
   - Look for "Detect changed files" step output
   - Verify file paths match patterns

### Jobs Not Skipping

If jobs run when they should be skipped:

1. **Check conditional logic:**

   ```yaml
   if: needs.detect-changes.outputs.should-test == 'true'
   ```

2. **Verify output variables:**

   - Check `detect-changes` job outputs
   - Ensure boolean values are strings ('true'/'false')

3. **Review matrix exclusions:**
   ```yaml
   exclude:
     - package: cli
       node-version: "22.x"
   ```

### Performance Issues

If workflow takes too long:

1. **Check cache hit rate:**

   - Look for "Cache restored" messages
   - Verify cache keys are correct

2. **Review parallel execution:**

   - Ensure independent jobs don't have `needs` dependencies
   - Check matrix strategy is optimal

3. **Analyze job durations:**
   - Identify slowest jobs
   - Consider splitting or optimizing

## Best Practices

1. **Test in draft PRs first** - Use `--draft` flag to avoid triggering notifications
2. **Clean up test branches** - Delete branches after verification
3. **Document findings** - Note any unexpected behavior
4. **Monitor performance** - Track workflow duration trends
5. **Update documentation** - Keep this guide current with workflow changes

## Reporting Issues

If you find issues with the CI workflow:

1. **Gather information:**

   - Workflow run URL
   - Expected vs actual behavior
   - Relevant logs and outputs

2. **Create an issue:**

   ```bash
   gh issue create --title "CI: [Brief description]" \
     --body "**Workflow Run:** [URL]

     **Expected Behavior:**
     [Description]

     **Actual Behavior:**
     [Description]

     **Logs:**
     \`\`\`
     [Relevant logs]
     \`\`\`"
   ```

3. **Label appropriately:**
   - `ci` - CI/CD related
   - `bug` - If it's a bug
   - `enhancement` - If it's an improvement

## Conclusion

This testing guide ensures the CI workflow behaves correctly for all change scenarios. Regular testing helps maintain workflow reliability and catch regressions early.

For questions or improvements to this guide, please open an issue or submit a pull request.
