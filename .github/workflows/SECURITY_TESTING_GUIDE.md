# Security Audit Workflow Testing Guide

This guide provides instructions for testing the Security Audit workflow to ensure it correctly detects vulnerabilities, reports them, and creates issues when needed.

## Overview

The Security Audit workflow (`security.yml`) performs the following:

1. Runs `pnpm audit` to detect vulnerabilities
2. Categorizes vulnerabilities by severity (info, low, moderate, high, critical)
3. Creates PR comments when vulnerabilities are detected
4. Creates GitHub issues for high/critical vulnerabilities (non-PR runs)
5. Fails the workflow if high/critical vulnerabilities are found
6. Passes with warning for moderate/low vulnerabilities

## Test Scenarios

### Scenario 1: Manual Trigger (No Vulnerabilities)

**Purpose:** Verify the workflow runs successfully when no vulnerabilities exist.

**Steps:**

1. Navigate to Actions → Security Audit
2. Click "Run workflow" → "Run workflow"
3. Wait for completion

**Expected Results:**

- ✅ Workflow completes successfully
- ✅ Audit summary shows 0 vulnerabilities
- ✅ Status: "Passed - No vulnerabilities detected"
- ✅ No GitHub issue created
- ✅ Workflow does not fail

### Scenario 2: Manual Trigger (With Vulnerabilities)

**Purpose:** Verify vulnerability detection and issue creation.

**Steps:**

1. Temporarily add a package with known vulnerabilities to `package.json`:
   ```json
   "devDependencies": {
     "lodash": "4.17.15"
   }
   ```
2. Run `pnpm install`
3. Commit and push changes
4. Navigate to Actions → Security Audit
5. Click "Run workflow" → "Run workflow"
6. Wait for completion

**Expected Results:**

- ✅ Workflow detects vulnerabilities
- ✅ Audit summary displays vulnerability counts by severity
- ✅ If high/critical: GitHub issue is created with details
- ✅ If high/critical: Workflow fails with exit code 1
- ✅ If moderate/low only: Workflow passes with warning
- ✅ Issue includes remediation steps and workflow run link

**Cleanup:**

```bash
# Remove the vulnerable package
pnpm remove lodash
git add package.json pnpm-lock.yaml
git commit -m "test: remove test vulnerability"
git push
```

### Scenario 3: PR with Dependency Changes

**Purpose:** Verify PR comment creation when dependencies change.

**Steps:**

1. Create a new branch:

   ```bash
   git checkout -b test/security-audit-pr
   ```

2. Add a package with known vulnerabilities:

   ```json
   "devDependencies": {
     "lodash": "4.17.15"
   }
   ```

3. Run `pnpm install`

4. Commit and push:

   ```bash
   git add package.json pnpm-lock.yaml
   git commit -m "test: add vulnerable dependency"
   git push origin test/security-audit-pr
   ```

5. Create a pull request

6. Wait for Security Audit workflow to run

**Expected Results:**

- ✅ Workflow runs automatically on PR
- ✅ PR comment is created with vulnerability summary
- ✅ Comment includes severity breakdown table
- ✅ Comment includes remediation steps
- ✅ If high/critical: Warning message in comment
- ✅ If moderate/low: Info message in comment
- ✅ No GitHub issue created (PR context)

**Cleanup:**

```bash
# Close the PR and delete the branch
git checkout main
git branch -D test/security-audit-pr
git push origin --delete test/security-audit-pr
```

### Scenario 4: Weekly Scheduled Run

**Purpose:** Verify the scheduled run configuration.

**Note:** This cannot be tested directly without waiting for the schedule. Instead, verify the configuration.

**Verification Steps:**

1. Open `.github/workflows/security.yml`
2. Verify schedule configuration:
   ```yaml
   schedule:
     - cron: "0 9 * * 1" # Mondays at 9 AM UTC
   ```
3. Verify the schedule is enabled (not commented out)

**Expected Configuration:**

- ✅ Schedule runs every Monday at 9 AM UTC
- ✅ Workflow has `workflow_dispatch` for manual testing
- ✅ Workflow has `pull_request` trigger for dependency changes

### Scenario 5: Vulnerability Severity Handling

**Purpose:** Verify correct handling of different severity levels.

**Test Matrix:**

| Severity Level     | Expected Behavior           |
| ------------------ | --------------------------- |
| Info only          | Pass, no issue, no warning  |
| Low only           | Pass with warning, no issue |
| Moderate only      | Pass with warning, no issue |
| High               | Fail, create issue          |
| Critical           | Fail, create issue          |
| Mixed (high + low) | Fail, create issue          |

**Testing Approach:**

Use the manual trigger test (Scenario 2) with different vulnerable packages to test each severity level.

## Test Execution Checklist

- [ ] **Scenario 1:** Manual trigger with no vulnerabilities
- [ ] **Scenario 2:** Manual trigger with vulnerabilities
- [ ] **Scenario 3:** PR with dependency changes
- [ ] **Scenario 4:** Verify scheduled run configuration
- [ ] **Scenario 5:** Test different severity levels

## Verification Commands

### Check Current Vulnerabilities

```bash
# Run audit locally
pnpm audit

# Run audit with JSON output
pnpm audit --json

# Run audit with specific level
pnpm audit --audit-level=moderate
```

### View Workflow Runs

```bash
# Using GitHub CLI
gh run list --workflow=security.yml

# View specific run
gh run view <run-id>

# View run logs
gh run view <run-id> --log
```

### Check Created Issues

```bash
# List security-related issues
gh issue list --label security

# View specific issue
gh issue view <issue-number>
```

## Common Issues and Troubleshooting

### Issue: Workflow doesn't trigger on PR

**Cause:** PR doesn't modify dependency files

**Solution:** Ensure PR changes `package.json` or `pnpm-lock.yaml`

### Issue: No vulnerabilities detected when expected

**Cause:** Dependencies may have been patched

**Solution:** Use a specific old version with known vulnerabilities (e.g., `lodash@4.17.15`)

### Issue: GitHub issue not created

**Cause:** May be running in PR context or no high/critical vulnerabilities

**Solution:** Verify:

- Not running from a PR
- High or critical vulnerabilities exist
- Workflow has `issues: write` permission

### Issue: Audit command fails

**Cause:** pnpm audit may exit with non-zero code

**Solution:** Workflow uses `continue-on-error: true` to handle this

## Test Results Documentation

After completing tests, document results:

```markdown
## Security Audit Workflow Test Results

**Date:** YYYY-MM-DD
**Tester:** [Your Name]

### Test Summary

| Scenario                    | Status  | Notes                   |
| --------------------------- | ------- | ----------------------- |
| Manual trigger (no vulns)   | ✅ Pass |                         |
| Manual trigger (with vulns) | ✅ Pass | Issue created correctly |
| PR with dependencies        | ✅ Pass | Comment added to PR     |
| Scheduled run config        | ✅ Pass | Cron verified           |
| Severity handling           | ✅ Pass | All levels tested       |

### Issues Found

- None

### Recommendations

- None
```

## Requirements Coverage

This testing guide covers the following requirements:

- **7.1:** npm audit execution on PRs and schedule
- **7.2:** High/critical vulnerability detection and workflow failure
- **7.3:** Moderate/low vulnerability detection with warning
- **7.4:** Vulnerability summary display in workflow output
- **7.5:** Weekly scheduled runs on Mondays at 9 AM UTC

## Next Steps

After completing all test scenarios:

1. Document test results
2. Update this guide with any findings
3. Mark task 22 as complete in `tasks.md`
4. Proceed to Phase 10 tasks
