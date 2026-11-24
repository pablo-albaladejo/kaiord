## ADDED Requirements

### Requirement: Connection notices are a vendored master and one shell renderer

`connection-notices.js` SHALL be a bridge-core master vendored byte-for-byte
to all five bridges and loaded by each `popup.html` before `popup.js`. The
shared shell SHALL expose `renderNotice($, notice, { since, href, onRetry })`,
which puts the notice's message in the status block, an outage date (when one
is already known) in the cause line, and its one fix as the whole footer: a
link to `href` for a fix done on the Platform's site, a button that re-runs
the check for Try again.

#### Scenario: A broken popup offers exactly one fix

- **GIVEN** a popup whose check could not tell why it failed
- **WHEN** it renders
- **THEN** its footer SHALL hold one control, "Try again", that re-runs the check
