# Security policy

## Reporting a vulnerability

Report it privately through GitHub's private vulnerability reporting:

https://github.com/pablo-albaladejo/kaiord/security/advisories/new

The report stays private between you and the maintainer until a fix ships
and an advisory is published. Please do not open a public issue, pull request
or discussion that describes the vulnerability.

If that page does not let you file a report, open a public issue titled
"Security contact request", with no details of the vulnerability, and the
maintainer will reply with a private channel.

Reports in English or Spanish are welcome. A useful report says what is
affected (package and version, the Kaiord App at kaiord.com/app, an extension,
or the kaiord.com/mcp endpoint), how to reproduce it, and what an attacker
gains.

## Scope

In scope: the code in this repository and what it deploys, namely the npm
packages published from it, the Kaiord App and site at kaiord.com, the
stateless MCP endpoint at kaiord.com/mcp, and the Kaiord browser extensions.

Out of scope: the Platforms and Providers Kaiord connects to (Garmin Connect,
Train2Go, TrainingPeaks, MyTANITA, WHOOP, intervals.icu, Anthropic, OpenAI,
Google). Report issues in those services to their owners.

## Supported versions

Fixes go into the latest release of each published package and into the
current deployment of the site and the extensions. Older releases are not
patched.

## Machine-readable contact

The site publishes the same contact as
https://kaiord.com/.well-known/security.txt (RFC 9116).
`pnpm lint:security-policy` fails when the two disagree or when
security.txt is within 30 days of its `Expires` date.
