---
"@kaiord/workout-spa-editor": minor
---

Turn the in-SPA AI chat into a multi-conversation manager. A new
`chatConversations` store (Dexie v24) parents the transcript via a
`conversationId` foreign key, and the `/chat` page gains a conversation list
with create, switch, rename, deep-link (`/chat/:conversationId`), and
delete-one. A new conversation is an in-memory draft until its first message
persists it; its title is auto-derived from that message and editable. Each
conversation remembers its own model override, falling back to the chat
default. Existing transcripts migrate into one seeded "Conversation 1" per
profile, and conversations ride the cross-device snapshot/sync (last-write-wins
on `updatedAt`, tombstoned on delete).
