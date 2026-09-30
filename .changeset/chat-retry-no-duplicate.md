---
"@kaiord/workout-spa-editor": patch
---

Retrying a failed chat turn re-runs it without appending the user's message again, so the message is no longer persisted and sent once per retry. The replay only happens when the stored conversation ends with that exact message; otherwise the text is sent normally. A retry is counted with its own count-only `chat-turn-retried` analytics event instead of a second `chat-message-sent`.
