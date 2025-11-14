# Security Audit Workflow - Quick Reference

## Overview

The Security Audit workflow automatically scans dependencies for vulnerabilities using `pnpm audit`.

## When It Runs

1. **Weekly Schedule:** Every Monday at 9 AM UTC
2. **Pull Requests:** When `package.json` or `pnpm-lock.yaml` changes
3. **Manual Trigger:** Via GitHub Actions UI or CLI

## Quick Commands

### Trigger Manually

```bash
gh workflow run security.yml
```

### View Recent Runs

```bash
gh run list --workflow=security.yml --limit 5
```

### View Specific Run

```bash
gh run view <run-id> --log
```

### Check for Security Issues

```bash
gh issue list --label security
```

### Run Audit Locally

```bash
# Basic audit
pnpm audit

# With specific level
pnpm audit --audit-level=moderate

# JSON output
pnpm audit --json
```

## Behavior by Severity

| Severity | Workflow Status      | GitHub Issue | PR Comment |
| -------- | -------------------- | ------------ | ---------- |
| Critical | ❌ Fail              | ✅ Yes       | ✅ Yes     |
| High     | ❌ Fail              | ✅ Yes       | ✅ Yes     |
| Moderate | ⚠️ Pass with warning | ❌ No        | ✅ Yes     |
| Low      | ⚠️ Pass with warning | ❌ No        | ✅ Yes     |
| Info     | ✅ Pass              | ❌ No        | ❌ No      |

## Workflow Outputs

### On Success (No Vulnerabilities)

- ✅ Workflow passes
- Summary shows 0 vulnerabilities
- No issues or comments created

### On Warning (Moderate/Low)

- ⚠️ Workflow passes with warning
- Summary shows vulnerability breakdown
- PR comment created (if PR context)
- No GitHub issue created

### On Failure (High/Critical)

- ❌ Workflow fails
- Summary shows vulnerability breakdown
- GitHub issue created (non-PR context)
- PR comment created (if PR context)
- Exit code 1

## Remediation Steps

### 1. Review Vulnerabilities

```bash
pnpm audit
```

### 2. Update Dependencies

```bash
# Update all dependencies
pnpm update

# Update specific package
pnpm update <package-name>
```

### 3. Test Changes

```bash
pnpm test
pnpm build
```

### 4. Commit and Push

```bash
git add package.json pnpm-lock.yaml
git commit -m "fix: update dependencies to address security vulnerabilities"
git push
```

## Testing the Workflow

### Run Test Suite

```bash
./.github/workflows/test-security-workflow.sh
```

### Create Test PR

```bash
# Create branch
git checkout -b test/security-audit

# Make dependency change
# Edit package.json

# Install and commit
pnpm install
git add package.json pnpm-lock.yaml
git commit -m "test: security audit workflow"
git push origin test/security-audit

# Create PR and observe workflow
```

## Troubleshooting

### Workflow Not Triggering on PR

**Cause:** PR doesn't modify dependency files  
**Solution:** Ensure PR changes `package.json` or `pnpm-lock.yaml`

### No Issue Created for Critical Vulnerability

**Cause:** Running in PR context  
**Solution:** Issues are only created for non-PR runs (scheduled or manual)

### Audit Command Fails

**Cause:** pnpm audit exits with non-zero code  
**Solution:** Workflow uses `continue-on-error: true` to handle this gracefully

### False Positives

**Cause:** Vulnerability in dev dependency or unused code path  
**Solution:**

1. Verify if vulnerability affects production code
2. Document risk acceptance if safe
3. Consider alternative packages

## Configuration

### Workflow File

`.github/workflows/security.yml`

### Schedule

```yaml
schedule:
  - cron: "0 9 * * 1" # Mondays at 9 AM UTC
```

### Permissions

```yaml
permissions:
  contents: read
  issues: write
  pull-requests: write
```

### Audit Level

```bash
pnpm audit --audit-level=moderate
```

## Related Documentation

- [Security Testing Guide](.github/workflows/SECURITY_TESTING_GUIDE.md)
- [Security Test Summary](.github/workflows/SECURITY_TEST_SUMMARY.md)
- [npm Audit Documentation](https://docs.npmjs.com/cli/v9/commands/npm-audit)
- [pnpm Audit Documentation](https://pnpm.io/cli/audit)

## Support

For issues or questions:

1. Check [Security Testing Guide](.github/workflows/SECURITY_TESTING_GUIDE.md)
2. Review workflow logs: `gh run view <run-id> --log`
3. Create an issue with the `ci/cd` label
