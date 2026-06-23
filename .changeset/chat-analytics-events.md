---
"@kaiord/workout-spa-editor": patch
---

Emit count-only analytics for the AI chat: a `chat-message-sent` event per
user turn and a `chat-tool-confirmed` event (with the bounded tool name) when a
pending action is approved. No message content or API keys reach analytics,
satisfying the spa-ai-chat usage rule.
