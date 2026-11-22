## ADDED Requirements

### Requirement: The end-to-end suite runs with the policy enforced

The SPA dev server SHALL serve the App's content security policy, and the e2e
base fixture SHALL fail a test on any `securitypolicyviolation` unless the
test provokes one on purpose (`cspViolationsAllowed`). The `@csp` specs SHALL
run in `e2e-prod-base` against the assembled site, docs included.

#### Scenario: A spec loads something the policy refuses

- **WHEN** a page under test raises a `securitypolicyviolation`
- **THEN** the test SHALL fail even if its own assertions pass
