## MODIFIED Requirements

### Requirement: CI link checker

The CI pipeline SHALL check all internal links in documentation pages on every pull request and every push to `main`. Broken links SHALL fail the build. The link-checker job SHALL run unconditionally — it SHALL NOT be gated by `detect-changes` or any other pre-filter, because docs-only changes (where the pre-filter may mark tests as unnecessary) are exactly the changes where broken internal links matter most.

#### Scenario: Broken link detected

- **WHEN** a documentation page references a non-existent internal path
- **THEN** the CI link check SHALL fail and report the broken link

#### Scenario: Docs-only PR

- **WHEN** a pull request modifies only Markdown files under `packages/docs/` and does not touch source code
- **THEN** the CI link checker SHALL still run and validate internal links

## ADDED Requirements

### Requirement: Link checker is a required status check

The `Link checker` job SHALL be listed among the required status checks on the `main` branch's protection rule. A pull request SHALL NOT be eligible for merge (including admin merge) while this check is failing, absent an explicit branch-protection override.

#### Scenario: PR with a broken link

- **WHEN** a pull request introduces a broken internal link and the Link checker fails
- **THEN** the GitHub merge box SHALL mark the PR as "Required status check is failing" and disable the merge button

### Requirement: Pinned lychee version in CI

The lychee CLI used by the link-checker job SHALL be pinned to an explicit MAJOR.MINOR version in `.github/workflows/ci.yml` via `taiki-e/install-action`'s `tool: lychee@<version>` form. New lychee releases SHALL reach CI only through a version-bump PR, never through a silent install of whatever is latest.

#### Scenario: New lychee release

- **WHEN** upstream lychee publishes a new minor or major version
- **THEN** CI SHALL continue to install the pinned version; bumping is a code change reviewable in a PR, not a CI runtime surprise

### Requirement: Admin bypass of failing required checks is disabled

Branch protection on `main` SHALL set `enforce_admins: true`. A repository admin SHALL NOT be able to merge a pull request while a required status check is failing, without first editing the protection rule.

#### Scenario: Admin attempts to merge with failing required check

- **WHEN** a repository admin tries to merge a pull request while the `Link checker` (or any other required) check is failing
- **THEN** the GitHub API SHALL reject the merge with a protection-policy error and require the admin to explicitly disable protection first
