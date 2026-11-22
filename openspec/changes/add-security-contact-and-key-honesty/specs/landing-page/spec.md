## ADDED Requirements

### Requirement: Security contact published

The repository SHALL hold a `SECURITY.md` and the site SHALL serve
`/.well-known/security.txt` (RFC 9116). Both SHALL name the same reporting
contact, GitHub private vulnerability reporting for the repository, and
neither SHALL hold an email address. The security.txt `Policy` SHALL point to
`SECURITY.md` and its `Expires` SHALL be no more than a year ahead.

#### Scenario: The two disagree

- **WHEN** security.txt names a `Contact` that `SECURITY.md` does not
- **THEN** `pnpm lint:security-policy` SHALL fail

#### Scenario: security.txt is about to expire

- **WHEN** `Expires` is past or within 30 days
- **THEN** `pnpm lint:security-policy` SHALL fail and name the date

### Requirement: Internal agent notes are not served

The assembled site SHALL contain no file named `AGENTS.md` or `CLAUDE.md`, in
any letter case (`agents.md`, `Claude.md`), wherever a build placed it; the
deploy's artifact check SHALL match the same names case-insensitively. The surfaces meant for agents that use Kaiord
(`llms.txt`, `auth.md`, every file under `/.well-known/`, the agent skill
`SKILL.md`) SHALL still be served.

#### Scenario: A public directory holds an agent note

- **GIVEN** a build output with `AGENTS.md` at its root or in a subdirectory
- **WHEN** `scripts/assemble-site.mjs` assembles the site
- **THEN** the output SHALL hold no `AGENTS.md` and SHALL still hold `llms.txt`, `auth.md` and `.well-known/security.txt`

#### Scenario: An agent note in another letter case

- **GIVEN** a build output with `agents.md` or `Claude.md`
- **WHEN** the site is assembled and the deploy checks the artifact
- **THEN** the output SHALL hold neither, and the deploy check SHALL fail on either if present
