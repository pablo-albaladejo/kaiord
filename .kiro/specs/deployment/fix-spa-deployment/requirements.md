# Requirements Document

## Introduction

The Workout SPA Editor deployment to GitHub Pages is currently failing because the build process does not build the required `@kaiord/core` dependency before building the SPA. This causes the SPA build to fail with module resolution errors.

## Glossary

- **SPA**: Single Page Application - the Workout SPA Editor frontend application
- **Core Package**: The `@kaiord/core` library that provides workout conversion functionality
- **GitHub Pages**: Static site hosting service provided by GitHub
- **GitHub Actions**: CI/CD automation platform used for deployment
- **Monorepo**: Repository structure containing multiple packages (core, cli, workout-spa-editor)
- **pnpm Workspace**: Package manager workspace configuration for managing monorepo dependencies

## Requirements

### Requirement 1

**User Story:** As a developer, I want the SPA deployment to succeed automatically when changes are pushed to main, so that the latest version is always available on GitHub Pages.

#### Acceptance Criteria

1. WHEN the deploy workflow runs THEN the system SHALL build the core package before building the SPA
2. WHEN the core package build completes THEN the system SHALL use the built artifacts for the SPA build
3. WHEN the SPA build completes THEN the system SHALL deploy the artifacts to GitHub Pages
4. WHEN the deployment completes THEN the system SHALL provide a working URL to access the SPA
5. WHEN the workflow fails THEN the system SHALL provide clear error messages indicating which step failed

### Requirement 2

**User Story:** As a developer, I want the deployment workflow to be efficient, so that deployments complete quickly without unnecessary work.

#### Acceptance Criteria

1. WHEN building packages THEN the system SHALL use pnpm workspace features to manage dependencies
2. WHEN installing dependencies THEN the system SHALL use frozen lockfile to ensure reproducible builds
3. WHEN building the core package THEN the system SHALL cache build artifacts for reuse
4. WHEN the workflow runs multiple times THEN the system SHALL leverage GitHub Actions caching to speed up subsequent runs

### Requirement 3

**User Story:** As a developer, I want the deployment to only trigger when relevant files change, so that we don't waste CI resources on unnecessary deployments.

#### Acceptance Criteria

1. WHEN SPA source files change THEN the system SHALL trigger the deployment workflow
2. WHEN core package files change THEN the system SHALL trigger the deployment workflow (since SPA depends on core)
3. WHEN only documentation files change THEN the system SHALL NOT trigger the deployment workflow
4. WHEN the workflow is manually triggered THEN the system SHALL always run regardless of file changes

### Requirement 4

**User Story:** As a user, I want the deployed SPA to work correctly with GitHub Pages routing, so that all features function properly in the production environment.

#### Acceptance Criteria

1. WHEN the SPA is deployed to a project page THEN the system SHALL configure the base path as `/kaiord/`
2. WHEN the SPA is deployed to a user/org page THEN the system SHALL configure the base path as `/`
3. WHEN assets are loaded THEN the system SHALL use the correct base path for all resource URLs
4. WHEN the user navigates within the SPA THEN the system SHALL handle routing correctly with the configured base path
