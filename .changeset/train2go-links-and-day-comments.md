---
"@kaiord/train2go-bridge": patch
"@kaiord/workout-spa-editor": patch
---

feat(train2go): preserve coach hyperlinks and surface day comment threads

The Train2Go bridge now keeps hyperlinks from activity descriptions instead of stripping them: `<a href>` anchors are converted to markdown `[label](url)` in the parser (mirroring the existing `<strong>` → `**` handling). It also parses the day-scoped coach/athlete comment thread from the same daily sidebar HTML — no new endpoints or permissions — and returns it on the `read-day` response (additive; older SPAs ignore it).

In the SPA, the coaching description renderer gains safe link support: markdown links and bare `https://` URLs render as `target="_blank" rel="noopener noreferrer"` anchors with the full href in the `title`, enforced through an https-only scheme allowlist at render time (no `dangerouslySetInnerHTML`). Day comments persist in a new profile-scoped `coachingDayNotes` Dexie store (v20, additive), are replaced wholesale on each `read-day`, cleared by the profile-delete cascade, and render in a read-only panel inside the coaching activity dialog.
