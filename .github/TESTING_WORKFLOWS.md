# Testing GitHub Actions Workflows Locally

This guide explains how to test GitHub Actions workflows locally using the `act` tool before pushing to GitHub.

## Prerequisites

### Install act

**macOS (Homebrew):**

```bash
brew install act
```

**Linux:**

```bash
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

**Windows (Chocolatey):**

```bash
choco install act-cli
```

For other installation methods, see: https://github.com/nektos/act

### Install Docker

`act` requires Docker to run workflows in containers. Install Docker Desktop from: https://www.docker.com/products/docker-desktop

## Basic Usage

### List Available Jobs

View all jobs in the CI workflow:

```bash
act pull_request -l
```

Output:

```
Stage  Job ID          Job name        Workflow name  Workflow file  Events
0      detect-changes  detect-changes  CI             ci.yml         pull_request,push
1      lint            lint            CI             ci.yml         pull_request,push
1      typecheck       typecheck       CI             ci.yml         pull_request,push
1      test            test            CI             ci.yml         pull_request,push
1      round-trip      round-trip      CI             ci.yml         pull_request,push
1      build           build           CI             ci.yml         pull_request,push
```

### Run Specific Jobs

**Test the round-trip job:**

```bash
act pull_request -j round-trip --container-architecture linux/amd64
```

**Test the lint job:**

```bash
act pull_request -j lint --container-architecture linux/amd64
```

**Test the typecheck job:**

```bash
act pull_request -j typecheck --container-architecture linux/amd64
```

**Test the test job:**

```bash
act pull_request -j test --container-architecture linux/amd64
```

**Test the build job:**

```bash
act pull_request -j build --container-architecture linux/amd64
```

### Run All Jobs

Run the entire CI workflow:

```bash
act pull_request --container-architecture linux/amd64
```

**Note:** On Apple M-series chips, always use `--container-architecture linux/amd64` to avoid compatibility issues.

## Advanced Usage

### Dry Run (Show What Would Execute)

Preview what would run without actually executing:

```bash
act pull_request -n
```

### Verbose Output

Get detailed logs for debugging:

```bash
act pull_request -j round-trip -v
```

### Use Specific Event

Test different GitHub events:

```bash
# Test push event
act push -j build

# Test pull_request event
act pull_request -j test
```

### Set Environment Variables

Pass custom environment variables:

```bash
act pull_request -j test --env NODE_ENV=test
```

### Use Secrets

Create a `.secrets` file (add to `.gitignore`):

```
CODECOV_TOKEN=your-token-here
```

Then run:

```bash
act pull_request --secret-file .secrets
```

## Testing Workflow Changes

### Recommended Testing Flow

1. **Make changes to workflow files**

   ```bash
   vim .github/workflows/ci.yml
   ```

2. **Test specific job locally**

   ```bash
   act pull_request -j round-trip --container-architecture linux/amd64
   ```

3. **Fix any issues and re-test**

   ```bash
   act pull_request -j round-trip --container-architecture linux/amd64
   ```

4. **Test full workflow (optional)**

   ```bash
   act pull_request --container-architecture linux/amd64
   ```

5. **Commit and push**
   ```bash
   git add .github/
   git commit -m "feat(ci): update workflow"
   git push
   ```

## Common Issues and Solutions

### Issue: "Error: Container architecture not specified"

**Solution:** Add `--container-architecture linux/amd64` flag (required for Apple M-series chips)

```bash
act pull_request -j test --container-architecture linux/amd64
```

### Issue: "Error: Cannot connect to Docker daemon"

**Solution:** Ensure Docker Desktop is running

```bash
# Check Docker status
docker ps

# Start Docker Desktop if not running
open -a Docker
```

### Issue: "Error: Job 'X' depends on job 'Y'"

**Solution:** Run the dependency job first or use `--matrix` flag

```bash
# Run detect-changes first, then round-trip
act pull_request -j detect-changes
act pull_request -j round-trip
```

### Issue: Slow execution

**Solution:** Use smaller Docker images or reuse containers

```bash
# Use medium-sized runner image (faster)
act pull_request -j test -P ubuntu-latest=catthehacker/ubuntu:act-latest
```

## Performance Tips

### 1. Test Individual Jobs

Instead of running the entire workflow, test only the job you modified:

```bash
act pull_request -j round-trip --container-architecture linux/amd64
```

### 2. Use Reusable Workflows

Our CI uses a reusable composite action for setup. This reduces duplication and speeds up local testing.

### 3. Cache Dependencies

`act` respects GitHub Actions caching. The first run will be slower, but subsequent runs will be faster.

### 4. Skip Jobs You Don't Need

Use `-j` flag to run only specific jobs:

```bash
# Only test round-trip, skip lint/typecheck/build
act pull_request -j round-trip --container-architecture linux/amd64
```

## Limitations

### What act CAN do:

- ✅ Run jobs locally in Docker containers
- ✅ Test workflow syntax and logic
- ✅ Validate scripts and actions
- ✅ Test matrix strategies
- ✅ Simulate GitHub events

### What act CANNOT do:

- ❌ Upload artifacts to GitHub (simulated locally)
- ❌ Create GitHub releases
- ❌ Comment on PRs
- ❌ Access GitHub secrets (unless provided via `.secrets` file)
- ❌ Perfectly replicate GitHub's runner environment

## CI Workflow Structure

Our CI workflow is optimized for maintainability:

```
.github/
├── workflows/
│   └── ci.yml (285 lines) - Main CI workflow
├── actions/
│   └── setup-pnpm/
│       └── action.yml - Reusable setup action
└── scripts/
    ├── build-affected.sh - Build affected packages
    ├── verify-build.sh - Verify build outputs
    └── check-coverage.js - Coverage threshold validation
```

## Testing Checklist

Before pushing workflow changes:

- [ ] Test affected job locally with `act`
- [ ] Verify scripts are executable (`chmod +x .github/scripts/*.sh`)
- [ ] Check workflow syntax (no diagnostics in IDE)
- [ ] Ensure workflow file is under 300 lines
- [ ] Test on a feature branch first
- [ ] Monitor execution time (optimize if > 5 minutes)

## Resources

- [act Documentation](https://github.com/nektos/act)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)

## Helper Script

We provide a convenient helper script to simplify workflow testing:

```bash
# Show help
./scripts/test-workflow.sh --help

# Test round-trip job
./scripts/test-workflow.sh round-trip

# Test with verbose output
./scripts/test-workflow.sh test --verbose

# Dry run (preview only)
./scripts/test-workflow.sh build --dry-run

# List all available jobs
./scripts/test-workflow.sh --list

# Test all jobs
./scripts/test-workflow.sh all
```

The helper script automatically:

- ✅ Checks if `act` and Docker are installed
- ✅ Uses correct architecture for Apple M-series chips
- ✅ Provides clear error messages
- ✅ Shows colored output for better readability

## Quick Reference

**Using helper script (recommended):**

```bash
./scripts/test-workflow.sh round-trip              # Test round-trip job
./scripts/test-workflow.sh test --verbose          # Test with verbose output
./scripts/test-workflow.sh all --dry-run           # Preview full workflow
./scripts/test-workflow.sh --list                  # List all jobs
```

**Using act directly:**

```bash
act pull_request -l                                # List all jobs
act pull_request -j round-trip                     # Test round-trip job
act pull_request -j round-trip -v                  # Test with verbose output
act pull_request -n                                # Dry run (preview only)
act pull_request                                   # Test all jobs
```

**Note:** The `.actrc` file in the project root configures default settings (architecture, runner image) so you don't need to specify them manually.

---

**Note:** Always test workflows locally before pushing to avoid wasting GitHub Actions minutes and to catch issues early.
