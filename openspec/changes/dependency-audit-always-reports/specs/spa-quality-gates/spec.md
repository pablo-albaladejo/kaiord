## ADDED Requirements

### Requirement: The dependency audit reports on every pull request

`.github/workflows/security.yml` SHALL trigger on every pull request, with no
`paths`, `paths-ignore`, `branches` or `branches-ignore` filter and no
`types` list that omits `opened`, `synchronize` or `reopened`, and on every
push to `main`. Exactly one job SHALL be named `Dependency Security Audit`,
with no job-level `if:`, `needs:`, `strategy` or `continue-on-error`. That
job SHALL fail on a high or critical finding and SHALL fail when the audit
produced no report. `scripts/check-security-audit-required.mjs` SHALL fail
the lint job when any of this is broken (R-SecurityAuditAlwaysReports).

#### Scenario: A paths filter returns

- **WHEN** the `pull_request` trigger gains a `paths` filter
- **THEN** `pnpm lint:security-audit-required` SHALL fail and name the filter

#### Scenario: The job is renamed

- **WHEN** no job, or more than one, is named `Dependency Security Audit`
- **THEN** `pnpm lint:security-audit-required` SHALL fail

#### Scenario: The registry is down

- **WHEN** the audit produces no report after its retries
- **THEN** the job SHALL fail with an error naming the outage, not report a clean audit
