<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# cws-api

## Purpose

Lightweight Chrome Web Store (Webstore Publish API) client used by the
extension-publish workflow (`.github/workflows/cws-publish.yml`). Splits
the OAuth handshake, upload, publish, and poll steps into small modules
so the workflow can compose them deterministically and the runbook
(`docs/runbooks/cws-service-account.md`) can reference each step.

## Key Files

| File          | Description                                                                               |
| ------------- | ----------------------------------------------------------------------------------------- |
| `cli.mjs`     | Entry point — argv parsing, dispatch to `upload`/`publish`/`poll`                         |
| `auth.mjs`    | OAuth refresh-token → access-token exchange against Google's token endpoint               |
| `upload.mjs`  | Upload a packaged `.zip` to CWS (`/upload/chromewebstore/...`)                            |
| `publish.mjs` | Trigger publish (`/chromewebstore/.../publish`), with optional `publishTarget`            |
| `poll.mjs`    | Poll the item resource until upload state settles                                         |
| `state.mjs`   | Item-state enums and helpers                                                              |
| `errors.mjs`  | Typed error classes for auth/upload/publish/poll failures with operator-friendly messages |

## For AI Agents

### Working In This Directory

- **No business logic** beyond what the CWS API needs. Don't generalize.
- **Secrets are referenced by env-var name only** — never inline a token,
  client id, or refresh token. Required env vars are documented in the
  runbook (`docs/runbooks/cws-service-account.md`).
- **Error messages MUST tell the operator what to do next** — point at the
  runbook section for recovery (rotate, retry, `force_upload`, etc.).
- **Backoff**: upload and poll use bounded exponential backoff. Don't
  retry indefinitely; surface failures so the workflow can decide.

### Testing Requirements

- Each module has a sibling `*.test.mjs` under `scripts/` (since the
  scripts-test convention is repo-flat) OR is tested via the workflow's
  integration smoke. The orphan guard (`check-scripts-orphans.mjs`) lets
  this folder ride under the parent's test coverage.

### Common Patterns

- Pure `fetch`-based; no SDK dependency.
- Functions return `{ ok, data }` or throw a typed error from `errors.mjs`.
- One concern per module — `auth.mjs` does not know about uploads.

## Dependencies

### Internal

Consumed by `.github/workflows/cws-publish.yml`. Operational details in
`docs/runbooks/cws-service-account.md`.

### External

- Node 22 stdlib (`fetch`).
- Chrome Web Store API (`https://www.googleapis.com/chromewebstore/...`).
- Google OAuth2 token endpoint.

<!-- MANUAL: -->
