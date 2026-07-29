## ADDED Requirements

### Requirement: CWS notification dedupe is label-scoped, not search-based

`scripts/cws-notify-issue.mjs` SHALL find an existing open issue by listing
issues carrying the notification kind's own label
(`gh issue list --state open --label <kind>`) and comparing titles for exact
equality client-side.

It SHALL NOT use `gh issue list --search`. The notification titles embed `:`,
`@` and `/` (e.g. `CWS publish stalled: @kaiord/train2go-bridge@10.0.0`);
GitHub's search parser reads `stalled:` as a qualifier and `@kaiord` as a user
reference, so an unquoted title query matches nothing and every invocation
opens a duplicate.

Dedupe is a read-then-write, not an atomic upsert. Two invocations racing on
the same title MAY both observe "absent" and both create; the window is one
`gh issue list` round-trip and the next invocation converges back to a single
issue. Cross-run races are additionally serialized by the `cws-issue-writer`
job-level concurrency group. Any comment describing the helper's idempotency
SHALL describe this mechanism rather than an exact-title search.

#### Scenario: Repeated detections bump one issue

- **GIVEN** an open issue titled `CWS publish stalled: @kaiord/train2go-bridge@10.0.0` labelled `cws-publish-verification-timeout`
- **WHEN** the notifier runs again for the same extension and version
- **THEN** it SHALL add a `Re-detected at <timestamp>` comment to that issue and SHALL NOT create a second one

#### Scenario: Distinct extensions and versions stay on distinct issues

- **GIVEN** notifications for `@kaiord/train2go-bridge@10.0.0` and `@kaiord/garmin-bridge@10.0.0` of the same kind
- **WHEN** both run
- **THEN** each SHALL own a separate issue, scoped by its exact title

### Requirement: A missing label never swallows a CWS notification

Every notification kind (`cws-auth-broken`,
`cws-publish-verification-timeout`, `cws-publish-rejected`) is also the label
the issue carries and the key dedupe reads, so the label MUST exist.

Before creating an issue, `cws-notify-issue.mjs` SHALL ensure its own label via
an idempotent `gh label create --force`. If the label cannot be created (for
example a token without label-write scope), the script SHALL still create the
issue **without** a label rather than fail — losing the alert is a worse
outcome than losing the label — and SHALL report the degradation in its
result. `cws-publish.yml` SHALL additionally pre-create all three labels in
its "Ensure issue labels exist" step.

#### Scenario: Notifier creates a label the repo does not have

- **GIVEN** the repository has no `cws-publish-rejected` label
- **WHEN** the notifier fires for a rejected publish
- **THEN** it SHALL create the label and SHALL open the issue carrying it

#### Scenario: Label failure degrades to an unlabelled issue

- **GIVEN** label creation fails
- **WHEN** the notifier fires
- **THEN** it SHALL still open the issue, unlabelled, and SHALL report `labeled: false`; it SHALL NOT exit non-zero without having filed the alert
