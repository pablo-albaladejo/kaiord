---
"@kaiord/workout-spa-editor": minor
---

The chat assistant now shows what it can do. An empty conversation lists its tools grouped as look up, log and do, with example prompts that fill in the message without sending it, and says nothing is saved without your confirmation. Asking "What can I do?" (or `/help`, `/ayuda`), or the button of the same name, opens that catalog locally without calling the model. The catalog is declared once in `application/chat/chat-capabilities.ts` and a test fails if a chat tool is registered without an entry.
