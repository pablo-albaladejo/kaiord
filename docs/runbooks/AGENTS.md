<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# runbooks

## Purpose

Operational runbooks for production-impacting workflows. Every runbook here
is required reading before touching the corresponding CI/CD pipeline or
external service.

## Key Files

| File                     | Description                                                                                                                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cws-service-account.md` | Chrome Web Store service-account setup, key rotation, emergency `force_upload` re-publish, and compromised-key response. Required reading before touching `.github/workflows/cws-publish.yml`. |

## For AI Agents

### Working In This Directory

- A runbook MUST be linked from the CI workflow or codepath it documents
  (and vice versa) — if you add a workflow that touches production, add or
  extend a runbook in the same PR.
- Runbook entries include: prerequisites, normal flow, failure modes,
  recovery steps, and rollback. Do not omit "failure" or "recovery" sections.
- Secrets/credentials MUST be referenced by name only (e.g.
  `CWS_REFRESH_TOKEN`), never inlined.

### Testing Requirements

No automated tests. Operational verification only — run the documented
recovery flow in a sandbox project before merging significant changes.

### Common Patterns

- One runbook per service/integration.
- Steps as numbered lists, commands in fenced code blocks, secret names
  in `code` style.

## Dependencies

### Internal

Each runbook references one or more files under `.github/workflows/`.

### External

External services covered: Chrome Web Store API (see
`scripts/cws-api/` for the client used by the workflows).

<!-- MANUAL: -->
