---
"@kaiord/train2go-bridge": patch
"@kaiord/workout-spa-editor": patch
---

Kaiord for Train2Go becomes a thin Bridge (protocol version 2): it lends the athlete's Train2Go Session and executes `{ action: "request", method, path }` only for the five read-only paths on its closed list, refusing any other path, method, header or body without sending it, and hands the Kaiord App Train2Go's answer as it came. Reading the week, a day, its comments and the profile page (kept to zones and weight), and the date of a day's activities, move to the Train2Go Connector in the Kaiord App, typed and tested. The App still works with an extension on protocol 1 while it updates. The extension's internal channel now answers only its own popup, never a content script. The popup shows what it showed before.
