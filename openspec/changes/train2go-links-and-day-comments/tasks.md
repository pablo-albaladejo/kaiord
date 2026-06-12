# Tasks: train2go-links-and-day-comments

## 1. Bridge parser — link preservation (links ship first; everything else builds on them)

- [ ] 1.1 Add a daily fixture variant with anchors (`test/fixtures/daily-with-links.html`) based on the captured live response: a description containing `<a target="_blank" href="https://youtu.be/...">label</a>` and an anchor without `href`
- [ ] 1.2 Write failing parser tests: rich description with link → `[label](url)`, anchor without href → plain text, existing description scenarios unchanged (AAA, `should` titles)
- [ ] 1.3 Implement anchor→markdown conversion in `extractDescription` (parser.js) BEFORE the strip-all pass, mirroring the `<strong>` → `**` placement; verify all existing parser tests stay green

## 2. Bridge parser — day comments extraction

- [ ] 2.1 Extend fixtures with the captured comments block (`test/fixtures/daily-with-comments.html`): coach comment (no delete button), own comment with delete button and link body, avatar markup
- [ ] 2.2 Write failing tests for `extractComments`: author from `picture title`, `isOwn` via delete-button heuristic, verbatim `time datetime`, body via the description pipeline (links as markdown, `<p>`/`<br>` → newlines), DOM order, `[]` for missing/empty block, malformed entry skipped, no avatar URLs in output
- [ ] 2.3 Implement `extractComments(html)` in parser.js; export to service-worker global scope and module.exports like the sibling parsers
- [ ] 2.4 Update `readDay` in background.js to return `{ activities, comments }`; update background tests for the `read-day` envelope including the empty-comments day

## 3. SPA — safe linkification renderer (shared)

- [ ] 3.1 Write failing tests for `format-coaching-description.ts`: markdown link → `link` inline, bare `https://` URL auto-linkified, `javascript:`/`data:`/`http:` schemes refused (plain text), bold/paragraph behavior unchanged
- [ ] 3.2 Extend the AST with `{ kind: "link", href, label }` and implement markdown-link + bare-URL tokenization with the https-only allowlist at AST-build/render time
- [ ] 3.3 Update `CoachingDescription` / dialog renderers to emit `<a target="_blank" rel="noopener noreferrer" title={href}>` for `link` inlines; component tests assert anchor attributes and the spoofing-mitigation `title`
- [ ] 3.4 Verify both consumers (CoachingSidebar, CoachingCard dialog) render links and that file/function size caps hold (split helpers if needed)

## 4. SPA — day notes record and persistence

- [ ] 4.1 Write failing schema tests for `coaching-day-notes-record.ts` (valid round-trip, composite-id refinement rejection, no extra fields)
- [ ] 4.2 Create the Zod schema + `buildCoachingDayNotesId(profileId, source, date)` helper in `src/types/`
- [ ] 4.3 Add the `coachingDayNotes` table in a new Dexie schema version (additive, no data migration); implement `DexieCoachingDayNotesRepository` (`upsert`, `getByDate`) following the existing coaching repository pattern, with tests
- [ ] 4.4 Add the in-memory repository twin in `test-utils/` and wire it into the persistence snapshot helpers
- [ ] 4.5 Extend the delete-profile-with-cascade use case (and its tests) to remove `coachingDayNotes` rows for the deleted profile

## 5. SPA — sync wiring

- [ ] 5.1 Write failing application-layer tests for the expand-day flow: comments persisted on success, wholesale replace on re-fetch, missing `comments` key leaves local data untouched, comments-persist failure does not break activities upsert (static log message)
- [ ] 5.2 Map `read-day` `comments` → `CoachingDayNotesRecord` in the expand-day use case and wire the repository through the existing composition root

## 6. SPA — comments panel UI

- [ ] 6.1 Write failing component tests: panel renders author + localized timestamp + linkified body; hidden when no record or empty thread; reactive update via live query; no compose/edit/delete affordances
- [ ] 6.2 Implement the comments panel in the coaching activity dialog (day-scoped `useLiveQuery`), reusing the shared link renderer; `isOwn` drives styling only
- [ ] 6.3 Run the PII guard (`pnpm test:scripts`) — no comment content in toasts or `console.*` first arguments

## 7. Verification and release

- [ ] 7.1 `pnpm lint:specs` passes for the delta specs; `npx openspec validate` clean
- [ ] 7.2 `pnpm -r test && pnpm -r build && pnpm lint:fix` — zero warnings policy
- [ ] 7.3 Add changeset (`pnpm exec changeset`): patch `@kaiord/train2go-bridge` (additive parser+payload), patch `@kaiord/workout-spa-editor`
- [ ] 7.4 Manual smoke: load the unpacked bridge, open a day with comments + a description link on app.train2go.com, verify the SPA dialog shows clickable links and the comment thread
