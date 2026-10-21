---
"@kaiord/ai": patch
---

The chat system prompt now names all six confirmation-gated action tools (`sync_coaching`, `create_workout`, `log_health_metric`, `log_intake`, `push_to_garmin`, `set_data_route`), rendered from the new exported `CHAT_ACTION_TOOL_NAMES` tuple; `CHAT_PROMPT_VERSION` is bumped to 1.1.0. The inert chat-tool eval runner now uses `buildChatSystemPrompt()` instead of its own prompt.
