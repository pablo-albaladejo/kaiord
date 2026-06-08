---
"@kaiord/workout-spa-editor": minor
---

Today's focused day is now movable

The Today page's focused day can move within the visible week — tap a day in
the WeekStrip or use the prev/next day arrows. The focused day lives in the URL
(`/today?date=YYYY-MM-DD`), so it is deep-linkable, back-recoverable, and
shareable; the whole dashboard (readiness, planned sessions, header) follows the
focused day. The header shows "Today" with no reset when focus is the real
today, otherwise the focused weekday plus a "Back to Today" control. The
WeekStrip keeps a dedicated "open in calendar" control and marks the real today
distinctly from the focus cursor. Focus is bounded to the visible week and the
`?date=` param is clamped (malformed/out-of-week falls back to today).
