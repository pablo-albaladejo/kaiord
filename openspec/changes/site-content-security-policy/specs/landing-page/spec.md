## ADDED Requirements

### Requirement: Every served page carries a content security policy

Every HTML page of the assembled site, landing, App and docs, SHALL carry a
`<meta http-equiv="Content-Security-Policy">` first in `<head>`, after the
charset and ahead of every script. Its `script-src` SHALL admit only
`'self'`, named `https` origins the code calls, and the sha256 of each
inline script in the page as served; it SHALL NOT hold `'unsafe-inline'`,
`'unsafe-eval'`, `'unsafe-hashes'`, a bare scheme or a wildcard.
`object-src` SHALL be `'none'` and `base-uri` SHALL be set.

#### Scenario: A page ships without the policy

- **WHEN** any page of the assembled site, `docs/` included, has no policy `<meta>`
- **THEN** `scripts/check-site-csp.mjs --merged <dir>` SHALL fail and name the page

#### Scenario: An inline script is not hashed

- **WHEN** a page holds an inline script whose sha256 is not in its `script-src`
- **THEN** `scripts/check-site-csp.mjs` SHALL fail and name the page

#### Scenario: A script is injected

- **WHEN** a script element is added to a running page of the App, the landing or the docs
- **THEN** the browser SHALL refuse to run it and report a `script-src` violation
