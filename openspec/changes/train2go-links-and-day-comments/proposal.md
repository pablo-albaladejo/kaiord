# Proposal: train2go-links-and-day-comments

## Why

Coaches routinely attach YouTube/Dropbox links to Train2Go workout descriptions and hold per-day comment threads with their athletes, but neither survives the bridge import: `extractDescription` in `packages/train2go-bridge/parser.js` strips every `<a href>` (the URL is lost forever, only the anchor text remains), and the `div.comments` block in the daily sidebar HTML is never parsed at all. A captured `/api/v2/workplan/daily/...` response confirms both the anchors (with real `href`s) and the full day-scoped comment thread are already present in the payload the bridge fetches today — this is pure parsing, persistence, and rendering work with zero new network surface.

## What Changes

- `extractDescription` (train2go-bridge parser) converts `<a href="...">label</a>` to markdown `[label](url)` instead of stripping it, mirroring the existing `<strong>` → `**` pattern. `description` stays a plain string; no schema change to `CoachingActivityRecord`.
- New `extractComments(html)` in the train2go-bridge parser extracts the day-scoped comment thread (author name, ISO timestamp, body text with links preserved as markdown) from the daily sidebar HTML.
- `readDay` in `background.js` returns `{ activities, comments }`; the `read-day` external message API response gains a `comments` array (additive, non-breaking).
- The SPA description formatter (`format-coaching-description.ts`) gains a `link` inline kind: markdown `[label](url)` and bare URLs render as safe anchors (https-only scheme allowlist, `target="_blank"`, `rel="noopener noreferrer"`, no `dangerouslySetInnerHTML`).
- New day-scoped Dexie record (`coachingDayNotes` table) persisting the comment thread per `profileId:source:date`, replaced wholesale on each daily fetch.
- New comments panel in the SPA day/activity detail view, reusing the link-aware description renderer.

## Capabilities

### New Capabilities

- `spa-coaching-day-comments`: Day-scoped coach/athlete comment threads — persisted record shape, wholesale-replace sync semantics tied to the existing `read-day` lazy fetch, and read-only display with linkified bodies.

### Modified Capabilities

- `train2go-bridge`: "HTML parser for daily detail" preserves hyperlinks as markdown links and extracts the day comment thread; "External message API" `read-day` response adds the `comments` array.
- `spa-coaching-integration`: Coach description rendering contract extends from "paragraphs + bold" to "paragraphs + bold + safe links" (markdown links and bare URLs become https-only anchors).

## Impact

- **Packages**: `@kaiord/train2go-bridge` (parser.js, background.js, fixtures/tests), `@kaiord/workout-spa-editor` (description formatter + renderer, Dexie schema/repository, day detail UI). No `@kaiord/core` changes — this feature does not touch KRD domain types.
- **Hexagonal layers (SPA)**: new persistence shape behind the existing Dexie repository pattern (adapter), a small application-level upsert use case, and presentation components. The bridge package is plain extension JS (outside the core hexagon) per existing structure.
- **Network/privacy surface**: unchanged. Same `/api/v2/workplan/daily/...` endpoint, same `ALLOWED` list in `content.js`; comment data is already in the fetched payload and is stored locally in IndexedDB only. Avatar image URLs are deliberately NOT persisted (author name + initials only).
- **Security**: linkification is a new XSS-adjacent surface; mitigated by AST rendering (no `innerHTML`), https-only scheme allowlist, and `rel="noopener noreferrer"`.
- **Breaking changes**: none. `read-day` consumers that ignore `comments` keep working; existing persisted descriptions render unchanged (markdown links simply never appear in old data).
- **Existing specs referenced**: `openspec/specs/train2go-bridge/spec.md`, `openspec/specs/spa-coaching-integration/spec.md`, `openspec/specs/spa-train2go-extension/spec.md` (lazy `read-day` flow that now also delivers comments).
