# Implementation Plan - GitHub Actions CI/CD

## Overview

This implementation plan breaks down the GitHub Actions CI/CD setup into discrete, manageable tasks. Each task builds incrementally on previous tasks and references specific requirements from the requirements document.

---

## Phase 1: GitHub Templates and Configuration

- [x] 1. Create GitHub issue and PR templates

  - Create `.github/ISSUE_TEMPLATE/` directory structure
  - Create bug report template (`bug_report.yml`) with required fields for package, Node version, OS
  - Create feature request template (`feature_request.yml`) with use case and alternatives sections
  - Create documentation issue template (`documentation.yml`) for doc improvements
  - Create question template (`question.yml`) for usage questions
  - Create issue template config (`config.yml`) with links to docs and discussions
  - Create pull request template (`.github/pull_request_template.md`) with checklist and testing sections
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 2. Create GitHub configuration files
  - Create CODEOWNERS file (`.github/CODEOWNERS`) with ownership rules for packages, docs, CI/CD
  - Create Dependabot config (`.github/dependabot.yml`) for weekly npm and GitHub Actions updates
  - Create FUNDING.yml (`.github/FUNDING.yml`) with optional sponsor links
  - _Requirements: 7.5_

---

## Phase 2: Basic CI Workflow

- [x] 3. Create CI workflow foundation

  - [x] 3.1 Create `.github/workflows/ci.yml` file with workflow name and triggers

    - Configure triggers: `pull_request` (opened, synchronize, reopened) and `push` to main
    - Set workflow permissions (contents: read, pull-requests: write, checks: write)
    - _Requirements: 1.1, 1.2, 1.3, 9.1, 9.2, 9.3_

  - [x] 3.2 Implement detect-changes job

    - Add job to analyze git diff using `tj-actions/changed-files@v40`
    - Detect changes in `packages/core/**`, `packages/cli/**`, root dependencies
    - Output boolean flags: `core-changed`, `cli-changed`, `should-test`
    - Handle docs-only changes by setting `should-test=false`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 3.3 Add pnpm caching setup
    - Create reusable setup steps for Node.js and pnpm
    - Configure pnpm store cache with key based on `pnpm-lock.yaml` hash
    - Configure node_modules cache for faster installs
    - _Requirements: 8.1, 8.5_

- [x] 4. Implement lint job

  - Add lint job that depends on `detect-changes`
  - Add condition to skip if `should-test == false`
  - Configure matrix strategy for Node.js versions (20.x, 22.x)
  - Run ESLint: `pnpm lint`
  - Run Prettier check: `pnpm exec prettier --check .`
  - Mark PR check as failed if linting errors detected
  - _Requirements: 2.1, 2.2, 2.4, 2.5, 5.1, 5.2, 5.3_

- [x] 5. Implement typecheck job
  - Add typecheck job that depends on `detect-changes`
  - Add condition to skip if `should-test == false`
  - Run TypeScript compiler: `pnpm exec tsc --noEmit`
  - Mark PR check as failed if type errors detected
  - _Requirements: 2.3, 2.6, 5.1, 5.2, 5.3_

---

## Phase 3: Testing and Coverage

- [x] 6. Implement test job with intelligent filtering

  - [x] 6.1 Create test job with matrix strategy

    - Configure matrix: Node.js versions (20.x, 22.x) and packages (core, cli)
    - Add dynamic matrix exclusions based on `detect-changes` outputs
    - Add condition to skip if `should-test == false`
    - _Requirements: 1.1, 1.2, 5.1, 5.2, 5.3, 10.2, 10.3_

  - [x] 6.2 Implement test execution with coverage

    - Build dependencies if needed (e.g., build core when testing cli)
    - Run tests with coverage: `pnpm --filter @kaiord/${{ matrix.package }} test:coverage`
    - Generate coverage report in LCOV format
    - _Requirements: 1.1, 1.2, 1.3, 4.1, 10.6, 10.8_

  - [x] 6.3 Add coverage reporting and validation
    - Upload coverage to Codecov using `codecov/codecov-action@v3` (only on Node 20.x)
    - Check coverage threshold (80%) and fail if below
    - Upload coverage artifact for workflow summary
    - Display coverage percentage in workflow output
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [x] 7. Implement build job

  - Add build job that depends on `detect-changes`
  - Add condition to skip if `should-test == false`
  - Build affected packages using pnpm filtering
  - Upload build artifacts for verification
  - Mark PR check as failed if build fails
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 10.6, 10.8_

- [x] 8. Add round-trip tests
  - Run round-trip tests with tolerance validation (±1s, ±1W, ±1bpm, ±1rpm)
  - Execute tests only for affected packages
  - Mark PR check as failed if tolerances exceeded
  - _Requirements: 1.3_

---

## Phase 4: Security and Quality Gates

- [x] 9. Create security audit workflow

  - [x] 9.1 Create `.github/workflows/security.yml` file

    - Configure triggers: weekly schedule (Mondays 9 AM UTC), PR with dependency changes, manual dispatch
    - Set workflow permissions (contents: read, issues: write)
    - _Requirements: 7.5_

  - [x] 9.2 Implement audit job

    - Run npm audit: `pnpm audit --audit-level=moderate`
    - Parse audit results and count vulnerabilities by severity
    - Fail workflow if high/critical vulnerabilities detected
    - Pass with warning if moderate/low vulnerabilities detected
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 9.3 Add vulnerability reporting
    - Create GitHub issue with vulnerability details if high/critical found
    - Comment on PR with vulnerability summary
    - Include remediation steps in issue/comment
    - _Requirements: 12.3_

- [x] 10. Configure branch protection rules
  - Add CI workflow as required status check
  - Require status check to be up-to-date with base branch
  - Verify integration with existing branch protection
  - _Requirements: 9.4, 9.5_

---

## Phase 5: Release Automation

- [x] 11. Set up Changesets

  - [x] 11.1 Install and configure Changesets

    - Install `@changesets/cli` as dev dependency
    - Initialize Changesets: `pnpm exec changeset init`
    - Configure `.changeset/config.json` with package settings
    - _Requirements: 11.1_

  - [x] 11.2 Create Changesets workflow

    - Create `.github/workflows/changesets.yml` file
    - Configure trigger: push to main branch
    - Use `changesets/action@v1` to create/update "Version Packages" PR
    - _Requirements: 11.2, 11.3_

  - [x] 11.3 Configure changelog generation
    - Set up changelog format in Changesets config
    - Configure commit message format
    - Test changelog generation with sample changesets
    - _Requirements: 11.4_

- [x] 12. Create release workflow

  - [x] 12.1 Create `.github/workflows/release.yml` file

    - Configure trigger: release published event
    - Set workflow permissions (contents: write, packages: write)
    - Set up Node.js with npm registry authentication
    - _Requirements: 6.1_

  - [x] 12.2 Implement package publishing

    - Build all packages: `pnpm -r build`
    - Detect packages with version changes by comparing package.json with npm registry
    - Publish changed packages: `pnpm --filter <package> publish --access public --no-git-checks`
    - _Requirements: 6.2, 6.3, 6.4, 10.7_

  - [x] 12.3 Add publish error handling

    - Implement retry logic (3 attempts with exponential backoff)
    - Create GitHub issue if publishing fails
    - Send notification to maintainers on failure
    - _Requirements: 6.5, 12.2_

  - [x] 12.4 Create GitHub release automation
    - Trigger release workflow when "Version Packages" PR is merged
    - Create GitHub release with changelog content
    - Tag release with version number
    - _Requirements: 11.5_

---

## Phase 6: Status Badges and Documentation

- [x] 13. Add status badges to README

  - Add CI workflow status badge for main branch
  - Add Codecov coverage badge
  - Add npm version badge for @kaiord/core
  - Add npm version badge for @kaiord/cli
  - Position badges after existing hackathon badges
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 14. Create CI/CD documentation
  - Document workflow structure and purpose in `.github/workflows/README.md`
  - Document how to add changesets for version bumping
  - Document how to trigger manual workflows
  - Document required secrets (NPM_TOKEN) and how to set them up
  - Add troubleshooting guide for common CI/CD issues

---

## Phase 7: Performance Optimization

- [x] 15. Optimize caching strategy

  - [x] 15.1 Implement TypeScript build cache

    - Add cache for TypeScript compilation output
    - Configure cache key based on tsconfig.json hash
    - Measure build time improvement
    - _Requirements: 8.2_

  - [x] 15.2 Optimize cache keys
    - Use composite cache keys for better hit rates
    - Add restore-keys for fallback caching
    - Monitor cache hit rates in workflow logs
    - _Requirements: 8.5_

- [x] 16. Implement parallel job execution

  - Configure jobs to run in parallel when possible
  - Use `needs` to define job dependencies
  - Optimize matrix strategy to reduce redundant runs
  - _Requirements: 8.3_

- [ ] 17. Measure and validate performance
  - Run workflows with different change patterns
  - Measure total workflow duration for each pattern
  - Validate performance targets: < 5 min full suite, < 30s docs-only
  - _Requirements: 8.4_

---

## Phase 8: Monitoring and Notifications

- [x] 18. Implement workflow failure notifications

  - [x] 18.1 Add failure detection for main branch

    - Detect when workflow fails on main branch
    - Create GitHub issue with failure details and logs
    - Include workflow run URL in issue
    - _Requirements: 12.1, 12.4, 12.5_

  - [x] 18.2 Add release failure notifications
    - Detect when release workflow fails
    - Send notification to repository maintainers
    - Include error logs and remediation steps
    - _Requirements: 12.2, 12.5_

- [ ] 19. Set up Codecov integration
  - Create Codecov account and link repository
  - Configure Codecov settings (coverage threshold, PR comments)
  - Test coverage upload and badge generation
  - Verify coverage reports appear in PRs
  - _Requirements: 4.2, 4.3, 13.2_

---

## Phase 9: Testing and Validation

- [x] 20. Test CI workflow with different scenarios

  - [x] 20.1 Test core package changes

    - Create test PR with changes only in packages/core
    - Verify both core and cli are tested and built
    - Verify coverage reports for both packages
    - _Requirements: 10.2_

  - [x] 20.2 Test CLI package changes

    - Create test PR with changes only in packages/cli
    - Verify only cli is tested and built
    - Verify coverage report for cli only
    - _Requirements: 10.3_

  - [x] 20.3 Test documentation changes

    - Create test PR with changes only in docs or README
    - Verify no tests or builds run
    - Verify workflow completes in < 30 seconds
    - _Requirements: 10.4_

  - [x] 20.4 Test root dependency changes
    - Create test PR with changes to package.json or pnpm-lock.yaml
    - Verify all packages are tested and built
    - Verify full coverage report
    - _Requirements: 10.5_

- [x] 21. Test release workflow

  - Test Changesets PR creation with sample changeset
  - Test version bumping and changelog generation
  - Test npm publishing in dry-run mode
  - Verify GitHub release creation
  - _Requirements: 11.2, 11.3, 11.4, 11.5, 6.3, 6.4_

- [x] 22. Test security audit workflow
  - Trigger manual security audit
  - Verify vulnerability detection and reporting
  - Test issue creation for high/critical vulnerabilities
  - Verify weekly scheduled runs
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

---

## Phase 10: Final Polish and Documentation

- [ ] 23. Update project documentation

  - Update main README with CI/CD information
  - Add CONTRIBUTING.md with workflow guidelines
  - Document how to run workflows locally with `act`
  - Add CI/CD section to project documentation

- [ ] 24. Clean up and optimize

  - Remove any temporary test files or branches
  - Optimize workflow YAML for readability
  - Add comments to complex workflow steps
  - Validate all workflow files with GitHub Actions linter

- [ ] 25. Final validation
  - Run full test suite on main branch
  - Verify all badges display correctly
  - Verify all status checks are required
  - Create test release to validate end-to-end flow
  - Document any known issues or limitations

---

## Notes

- Each task should be completed and tested before moving to the next
- Commit after each major task completion
- Test workflows in feature branches before merging to main
- Use `act` tool for local workflow testing when possible
- Monitor workflow execution times and optimize as needed
- Keep workflow files under 300 lines for maintainability
