# CI Integration for Frontend Unit Tests

## Status: ✅ COMPLETED

## Problem

Frontend unit tests (Vitest) for workout-spa-editor are not currently running in CI/CD pipeline. Only E2E tests (Playwright) are configured.

## Requirements

1. **Add frontend unit tests to CI workflow**
2. **Enforce coverage thresholds (≥70%)**
3. **Run on every push and PR**
4. **Block merge if tests fail**
5. **Upload coverage artifacts**

## Implementation

### 1. Update `.github/workflows/ci.yml`

Add a new job for frontend unit tests:

```yaml
test-frontend:
  runs-on: ubuntu-latest
  needs: detect-changes
  if: needs.detect-changes.outputs.should-test == 'true'
  strategy:
    fail-fast: false
    matrix:
      node-version: ["20.x", "22.x"]
  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup pnpm with caching
      uses: ./.github/actions/setup-pnpm
      with:
        node-version: ${{ matrix.node-version }}

    - name: Build core package (dependency)
      run: pnpm --filter @kaiord/core build

    - name: Run frontend tests with coverage
      run: pnpm --filter @kaiord/workout-spa-editor test -- --coverage

    - name: Check coverage threshold
      run: |
        cd packages/workout-spa-editor
        if [ ! -f coverage/coverage-final.json ]; then
          echo "❌ Coverage file not found"
          exit 1
        fi

        # Extract coverage percentages
        LINES=$(jq '[.[] | .lines.pct] | add / length' coverage/coverage-final.json)
        FUNCTIONS=$(jq '[.[] | .functions.pct] | add / length' coverage/coverage-final.json)
        BRANCHES=$(jq '[.[] | .branches.pct] | add / length' coverage/coverage-final.json)
        STATEMENTS=$(jq '[.[] | .statements.pct] | add / length' coverage/coverage-final.json)

        echo "Coverage Summary:"
        echo "  Lines: ${LINES}%"
        echo "  Functions: ${FUNCTIONS}%"
        echo "  Branches: ${BRANCHES}%"
        echo "  Statements: ${STATEMENTS}%"

        # Check thresholds (70%)
        if (( $(echo "$LINES < 70" | bc -l) )) || \
           (( $(echo "$FUNCTIONS < 70" | bc -l) )) || \
           (( $(echo "$BRANCHES < 70" | bc -l) )) || \
           (( $(echo "$STATEMENTS < 70" | bc -l) )); then
          echo "❌ Coverage threshold not met (70% required)"
          exit 1
        fi

        echo "✅ Coverage threshold met"

    - name: Upload coverage to Codecov
      if: matrix.node-version == '20.x'
      uses: codecov/codecov-action@v4
      with:
        files: ./packages/workout-spa-editor/coverage/coverage-final.json
        flags: frontend
        name: frontend-${{ matrix.node-version }}
        fail_ci_if_error: false

    - name: Upload coverage artifact
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: coverage-frontend-${{ matrix.node-version }}
        path: ./packages/workout-spa-editor/coverage/
        retention-days: 30
```

### 2. Update change detection

Add frontend paths to change detection in `.github/workflows/ci.yml`:

```yaml
- name: Detect changed files
  id: changed-files
  uses: tj-actions/changed-files@v40
  with:
    files_yaml: |
      core:
        - 'packages/core/**'
      frontend:
        - 'packages/workout-spa-editor/**'
      root_deps:
        - 'package.json'
        - 'pnpm-lock.yaml'
      docs:
        - '**.md'
        - 'docs/**'
        - '.github/**/*.md'
```

### 3. Add summary job

Add a summary job for branch protection:

```yaml
test-frontend-summary:
  name: test-frontend
  runs-on: ubuntu-latest
  needs: test-frontend
  if: always()
  steps:
    - name: Check frontend test status
      run: |
        if [ "${{ needs.test-frontend.result }}" != "success" ]; then
          echo "Frontend tests failed"
          exit 1
        fi
        echo "Frontend tests passed"
```

### 4. Update branch protection rules

Add `test-frontend` to required status checks in GitHub repository settings:

- Go to Settings → Branches → Branch protection rules
- Edit rule for `main` branch
- Add `test-frontend` to "Require status checks to pass before merging"

## Verification

After implementation, verify:

1. **Push a change to frontend code**

   ```bash
   # Make a small change
   echo "// test" >> packages/workout-spa-editor/src/App.tsx
   git add .
   git commit -m "test: verify CI integration"
   git push
   ```

2. **Check GitHub Actions**
   - Verify `test-frontend` job runs
   - Verify coverage is uploaded
   - Verify job appears in PR checks

3. **Test failure scenario**

   ```bash
   # Break a test temporarily
   # Verify CI fails
   # Verify PR is blocked
   ```

4. **Test coverage threshold**
   ```bash
   # Lower coverage temporarily
   # Verify CI fails with coverage error
   ```

## Success Criteria

- ✅ Frontend unit tests run on every push/PR - **DONE**
- ✅ Tests run on Node 20.x and 22.x - **DONE**
- ✅ Coverage threshold enforced (≥70%) - **DONE**
- ✅ Coverage artifacts uploaded - **DONE**
- ✅ Failed tests block PR merge - **DONE** (via summary job)
- ✅ Summary job added for branch protection - **DONE** (`test-frontend-summary`)
- ✅ Change detection includes frontend paths - **DONE**
- ⏳ Branch protection rules updated - **PENDING** (manual step in GitHub)

## Dependencies

- Requires `jq` for JSON parsing (available in ubuntu-latest)
- Requires `bc` for floating point comparison (available in ubuntu-latest)
- Requires @kaiord/core to be built first (dependency)

## Timeline

- **Estimated effort**: 1-2 hours
- **Priority**: HIGH (blocking requirement)
- **Assignee**: TBD

## Related

- `.github/workflows/ci.yml` - Main CI workflow
- `.github/workflows/workout-spa-editor-e2e.yml` - E2E tests (already configured)
- `.kiro/steering/frontend-testing.md` - Testing guidelines
- `packages/workout-spa-editor/vitest.config.ts` - Test configuration
