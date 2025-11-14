# Branch Protection Configuration

This document describes the branch protection rules configured for the `main` branch.

## Overview

Branch protection ensures that all code merged to `main` meets quality standards by requiring:

1. **Required status checks** - All CI workflow jobs must pass
2. **Up-to-date branches** - PRs must be rebased/merged with latest main
3. **Code review** - At least 1 approving review required

## Required Status Checks

The following status checks from the CI workflow must pass before merging:

| Check Name       | Purpose                                          | Workflow File |
| ---------------- | ------------------------------------------------ | ------------- |
| `detect-changes` | Analyzes changed files to optimize CI runs       | `ci.yml`      |
| `lint`           | Runs ESLint and Prettier checks                  | `ci.yml`      |
| `typecheck`      | Validates TypeScript types                       | `ci.yml`      |
| `test`           | Runs unit and integration tests with coverage    | `ci.yml`      |
| `build`          | Verifies packages build successfully             | `ci.yml`      |
| `round-trip`     | Validates round-trip conversions with tolerances | `ci.yml`      |

## Configuration

### Automated Configuration

Run the configuration script to set up branch protection:

```bash
.github/scripts/configure-branch-protection.sh
```

**Prerequisites:**

- GitHub CLI (`gh`) installed and authenticated
- Repository admin permissions

### Manual Configuration

Alternatively, configure via GitHub UI:

1. Go to **Settings** → **Branches**
2. Click **Add rule** or edit existing rule for `main`
3. Enable **Require status checks to pass before merging**
4. Check **Require branches to be up to date before merging**
5. Search and select these status checks:
   - `detect-changes`
   - `lint`
   - `typecheck`
   - `test`
   - `build`
   - `round-trip`
6. Save changes

### Verification

Verify the configuration:

```bash
# Check if status checks are required
gh api repos/pablo-albaladejo/kaiord/branches/main/protection/required_status_checks

# View full branch protection settings
gh api repos/pablo-albaladejo/kaiord/branches/main/protection
```

## Requirements Mapping

This configuration satisfies the following requirements from `.kiro/specs/github-actions-cicd/requirements.md`:

- **Requirement 9.4**: "THE Protected Branch SHALL require the 'CI' status check to pass before allowing merge"
  - ✅ Implemented via required status checks for all CI jobs
- **Requirement 9.5**: "THE Protected Branch SHALL require the 'CI' status check to be up-to-date with the base branch"
  - ✅ Implemented via `strict: true` setting

## Workflow Integration

### How It Works

1. **Developer opens PR** → CI workflow triggers
2. **CI runs all jobs** → Each job reports status to GitHub
3. **GitHub checks status** → Verifies all required checks pass
4. **Branch up-to-date check** → Ensures PR includes latest main commits
5. **Merge allowed** → Only if all checks pass and branch is current

### Status Check Names

Status check names correspond to job IDs in `.github/workflows/ci.yml`:

```yaml
jobs:
  detect-changes:# ← Status check:
    "detect-changes"
    # ...

  lint:# ← Status check:
    "lint"
    # ...

  typecheck:# ← Status check:
    "typecheck"
    # ...

  test:# ← Status check:
    "test"
    # ...

  build:# ← Status check:
    "build"
    # ...

  round-trip:# ← Status check:
    "round-trip"
    # ...
```

## Troubleshooting

### Status Check Not Appearing

If a status check doesn't appear in the branch protection UI:

1. **Trigger the workflow** - Status checks only appear after running at least once
2. **Check job name** - Must match exactly (case-sensitive)
3. **Wait for completion** - GitHub updates available checks after workflow completes

### PR Can't Be Merged

Common reasons:

1. **Status checks failing** - Fix the failing tests/builds
2. **Branch not up-to-date** - Click "Update branch" button or rebase
3. **Missing approvals** - Request review from a maintainer
4. **Checks still running** - Wait for all checks to complete

### Updating Required Checks

If CI workflow jobs are renamed or added:

1. Update the `REQUIRED_CHECKS` array in `configure-branch-protection.sh`
2. Run the script to apply changes
3. Verify with `gh api` command

## Best Practices

### For Contributors

- **Run tests locally** before pushing to catch issues early
- **Keep PRs up-to-date** by regularly merging/rebasing with main
- **Monitor CI status** in the PR checks section
- **Address failures promptly** to unblock reviews

### For Maintainers

- **Review CI logs** when checks fail to understand issues
- **Update branch protection** when adding new CI jobs
- **Document exceptions** if temporarily disabling checks
- **Monitor workflow performance** to keep CI fast

## Security Considerations

### Admin Bypass

Branch protection rules apply to all users, including admins. To enforce for admins:

1. Go to **Settings** → **Branches** → Edit rule
2. Enable **Include administrators**
3. Save changes

**Note**: This is optional but recommended for consistency.

### Required Reviews

Current configuration requires:

- **1 approving review** minimum
- **Stale reviews dismissed** when new commits pushed
- **Code owner reviews** not required (can be enabled if needed)

## References

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Required Status Checks API](https://docs.github.com/en/rest/branches/branch-protection#update-status-check-protection)
- [CI Workflow](.github/workflows/ci.yml)
- [Requirements Document](.kiro/specs/github-actions-cicd/requirements.md)
