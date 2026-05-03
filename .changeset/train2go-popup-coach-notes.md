---
"@kaiord/train2go-bridge": minor
---

Add a collapsible "Coach notes" box to the Train2Go popup. Surfaces the trainer's free-text notes about the trainee (`data.user.user_notes`) returned by the existing `/api/v2/profile/ping` endpoint — no new network call, no new permissions. Notes are HTML-stripped to plain text in the parser before they reach the popup, and the body element uses `textContent` (never `innerHTML`) so the popup XSS surface stays at zero. The box is collapsed by default and capped at 200px scrollable height so long notes don't blow up the popup. Empty / missing notes render nothing.
