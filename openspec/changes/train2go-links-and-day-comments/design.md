# Design: train2go-links-and-day-comments

## Context

The Train2Go bridge fetches the daily sidebar HTML (`/api/v2/workplan/daily/{date}?user={id}&source=sidebar`) and parses only the activities column. A captured live response confirms the same payload carries two things the pipeline currently destroys or ignores:

1. **Hyperlinks in descriptions and comments.** `extractDescription` (parser.js) strips every tag except `<strong>` (kept as `**`), so `<a href="https://youtu.be/x">video</a>` loses its URL. On the SPA side, `format-coaching-description.ts` produces a `text | strong` AST and explicitly scopes links out, so even bare URLs render as dead text.
2. **A day-scoped comment thread** under `div.comments` (right column, `col-md-5 .right`): each `<div class="comment">` has the author name in `<picture title="...">`, an ISO-ish timestamp in `<time datetime="...">`, and a `<p>`-paragraph body that may contain anchors. The "Add comment" form posts with a `date` field, confirming comments attach to the **day**, not to an activity.

Constraints: the bridge's `ALLOWED` path list is privacy-guarded (`scripts/check-bridge-privacy-surface.mjs`) and must not grow — and it does not need to. The SPA renders all T2G-controlled strings without `dangerouslySetInnerHTML` (see `spa-train2go-extension` "renders T2G strings safely"). The SPA persistence rule is "persisted data → Dexie".

## Goals / Non-Goals

**Goals:**

- Preserve coach-authored hyperlinks end-to-end (parser → stored string → clickable, safe anchor).
- Extract, persist, and display the per-day comment thread.
- One shared link-aware renderer for descriptions and comment bodies.
- Zero changes to the bridge's network/privacy surface.

**Non-Goals:**

- Posting, replying to, or deleting comments from the SPA (write access to T2G is a separate privacy conversation).
- Eager fetching of comments for badge counts on the week strip (comments arrive only via the existing `read-day` lazy fetch).
- Persisting or proxying avatar images (author name + initials only — avoids storing third-party image URLs).
- Rendering full HTML (lists, headings, images) in descriptions or comments.

## Decisions

### D1 — Links travel inside the existing `description` string as markdown `[label](url)`

The parser converts `<a href="URL">label</a>` to `[label](URL)` before the strip-all pass, exactly mirroring the established `<strong>` → `**text**` convention. `CoachingActivityRecord` keeps `description?: string` — no schema change, no Dexie migration for activities, and inline position is preserved (a link mid-sentence stays mid-sentence).

_Alternative considered:_ a structured `links: Array<{url, label}>` field. Rejected: loses inline context, requires a schema/migration touch on a hot record type, and still would not cover links inside comment bodies.

### D2 — Linkification is enforced at render time, not trust-the-parser

`format-coaching-description.ts` gains a third inline kind: `{ kind: "link", href, label }`, produced from two sources: markdown `[label](url)` spans and bare `https://…` URLs in plain text (covers coach-pasted URLs and pre-existing persisted data). The renderer maps `link` inlines to `<a target="_blank" rel="noopener noreferrer">`.

**Scheme allowlist at the render boundary:** only `https:` hrefs become anchors; anything else (`javascript:`, `data:`, `http:`) renders as plain text. This means even a malicious or future-shape T2G payload that sneaks through the parser cannot produce an executable link — the AST renderer remains the single XSS choke point, consistent with the existing no-`dangerouslySetInnerHTML` rule.

_Alternative considered:_ sanitizing only in the bridge parser. Rejected: the renderer also processes AI-generated and legacy stored strings; defense belongs at the output boundary.

### D3 — Comments are day-scoped records, replaced wholesale on each fetch

New Dexie table `coachingDayNotes`, primary key `id = ${profileId}:${source}:${date}` (same composite convention as `coachingActivities`), holding:

```ts
type CoachingDayCommentEntry = {
  author: string; // from picture title="..."
  isOwn: boolean; // delete-button heuristic OR author === linked userName
  timestamp: string; // ISO from <time datetime="...">
  text: string; // plain text, links as [label](url), newline-separated paragraphs
};

type CoachingDayNotesRecord = {
  id: string; // `${profileId}:${source}:${date}`
  profileId: string;
  source: string;
  date: string; // YYYY-MM-DD
  comments: CoachingDayCommentEntry[];
  fetchedAt: string; // ISO datetime
};
```

Each successful `read-day` upserts the record with the full parsed array (empty array when the day has no comments). Wholesale replacement sidesteps per-comment identity entirely — T2G's comment wrapper ids are render-generated UUIDs and coach comments expose no stable numeric id. Dexie schema version bump is additive (new table only); no data migration needed.

_Alternative considered:_ hanging `comments[]` off each `CoachingActivityRecord`. Rejected: comments belong to the day (a multi-activity day would duplicate the thread N times and single-activity assumptions break).

### D4 — Comment extraction lives in the bridge parser; `read-day` payload grows additively

New `extractComments(html)` in `parser.js` slices the `div.comments` block, splits on `<div class="comment"`, and per comment extracts author (`<picture title="…">`), timestamp (`<time datetime="…">`), own-ness (presence of the delete button, whose `data-remote` only exists on the viewer's comments), and body text via the same HTML→text pipeline as descriptions (links → markdown, `<p>`/`<br>` → newlines, entities decoded, strip-all). `readDay` returns `{ activities, comments }`; the `read-day` external message response gains `data.comments`. Older SPAs ignore the extra field; a newer SPA treats a missing `comments` field (older bridge) as "no data" and hides the panel — both directions are compatible.

### D5 — Layering in the SPA (hexagonal placement)

- **Types** (`src/types/`): `coaching-day-notes-record.ts` with Zod schema — the persisted contract (port-level shape), defined before any adapter work.
- **Repository port + Dexie adapter** (`src/adapters/dexie/`): `CoachingDayNotesRepository` with `upsert` and `getByDate(profileId, source, date)`, following the existing `dexie-coaching-repository.ts` pattern; an in-memory twin in `test-utils/` for application-layer tests.
- **Application**: the existing expand-day/`read-day` use case additionally maps and upserts the comments payload (single transaction with the activities upsert is not required; comments failure must not break activity upsert — see Risks).
- **Presentation**: comments panel inside the coaching activity dialog (and day detail view), one `useLiveQuery` keyed by the dialog's date, reusing the link-aware renderer for bodies.

The bridge package stays plain extension JS, outside the core hexagon, per existing structure.

### D6 — Rendering placement and i18n of timestamps

The panel shows author name, a localized timestamp (`Intl.DateTimeFormat` on the stored ISO string), and the linkified body. `isOwn` only drives alignment/affordance styling, never logic. Comment content MUST NOT appear in toasts or `console.*` calls (R-PIIInterpolation guard already enforces static first arguments).

## Risks / Trade-offs

- **[T2G HTML shape drift]** The comments markup is unversioned server-rendered HTML. → `extractComments` degrades gracefully (returns `[]` on any missing anchor), fixtures pin the captured live shape, and activities parsing is untouched if the comments block disappears.
- **[Link-label spoofing]** A label can read `dropbox.com` while the href points elsewhere. → render the full href in the anchor's `title` attribute (hover/long-press reveal); https-only allowlist already blocks scheme-level abuse.
- **[Comments upsert failure poisoning activity sync]** → comments mapping/persist is wrapped independently; a comments failure logs (static message) and leaves activities intact.
- **[Stale comments]** Comments only refresh when the user re-opens a day (lazy `read-day`). Accepted for v1; staleness is bounded by the same gate that governs descriptions.
- **[Local PII]** Comment threads are personal content; they stay in local IndexedDB, are excluded from logs/toasts, and are deleted by the existing profile-cascade delete (must be added to the cascade list).

## Migration Plan

1. Bridge first (parser + `readDay`): additive payload, safe to ship alone.
2. SPA renderer (links) next: works with both old and new bridge output.
3. SPA Dexie table + panel last: tolerates bridges that do not send `comments`.
4. Rollback: revert SPA panel/table commit; stored `coachingDayNotes` rows are inert if unread. No destructive migration in either direction.

## Open Questions

- Should the EditorPage coach sidebar (for converted workouts) also surface the day's comment thread? Deferred — v1 limits comments to the coaching dialog/day view.
