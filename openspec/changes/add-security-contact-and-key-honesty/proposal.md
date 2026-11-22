## Why

Review of 2026-11-22, issue #1640 (parent #1670, user stories 71, 72, 74).

- A security researcher has nowhere to report: the repo has no `SECURITY.md`
  and kaiord.com serves no `/.well-known/security.txt`.
- The wording about the athlete's Provider API key does not say what the code
  does. The App and the privacy policy said the key is "transmitted only to the
  provider", but with Google Drive sync on, the provider rows (key included)
  are part of the snapshot uploaded to the athlete's Drive. The key is
  "encrypted" with a passphrase that ships in the App's public bundle
  (`adapters/dexie/ai-provider-crypto.ts`), so it is obfuscation, and any
  script on the kaiord.com origin can read it.
- kaiord.com serves the repo's internal notes for coding agents:
  `/AGENTS.md`, `/fonts/AGENTS.md`, `/app/AGENTS.md` and `/docs/AGENTS.md`
  answered 200 on 2026-11-22. Vite copies every `public/` file verbatim, and
  the site assembler copied them on.

## What Changes

- Root `SECURITY.md` and `packages/landing/public/.well-known/security.txt`
  (RFC 9116), both naming GitHub private vulnerability reporting as the
  contact. No email address.
- Root guard `scripts/check-security-policy.mjs` (`pnpm lint:security-policy`):
  the two files agree on the contact, `Policy` points to `SECURITY.md`, no
  email address, and `Expires` is no more than a year ahead and not within 30
  days or past.
- `scripts/assemble-site.mjs` never copies a file named `AGENTS.md` or
  `CLAUDE.md`. The surfaces meant for agents that use Kaiord (`llms.txt`,
  `auth.md`, `.well-known/*`, the agent skill `SKILL.md`) keep shipping. The
  deploy's artifact check also requires `security.txt` and fails on any
  internal agent note.
- The Provider key wording in the App's Privacy section (English and Spanish),
  the privacy policy and the BYOK guide (English and Spanish) says where the
  key is stored, that it is obfuscated rather than encrypted, what can read it,
  and where it is sent. The privacy-policy lint gains a rule for it.

## Impact

- No code path of the App changes; copy only.
- Out of scope: making the key actually protected (a user secret, or not
  syncing it), the intervals.icu key wording, the claims register (#1626).
