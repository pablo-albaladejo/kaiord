## ADDED Requirements

### Requirement: Docs work under the site content security policy

The docs SHALL be served under the same kind of policy as the landing: module
scripts from `'self'`, VitePress's inline scripts by their sha256, the Umami
tracker, and no other remote origin. Loading a docs page, searching it and
switching the theme SHALL raise no policy violation.

#### Scenario: Searching the docs

- **GIVEN** the assembled site with the docs build
- **WHEN** an athlete opens `/docs/`, searches, and opens a result
- **THEN** the result page SHALL load and no `securitypolicyviolation` SHALL fire

#### Scenario: Switching the theme

- **WHEN** an athlete switches the docs theme and reloads
- **THEN** the chosen theme SHALL be kept and no `securitypolicyviolation` SHALL fire
