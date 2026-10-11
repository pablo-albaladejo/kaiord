> Completed: 2026-10-11

# Proposal: Check an AI key when it is saved, and gate the chat on what it needs

## Why

The journey audit (J10) found three AI defects:

- A provider was saved with any key. A wrong key surfaced only on the first
  chat turn, as a generic error.
- That first failed turn also threw `pageerror: No output generated` in the
  browser, an uncaught promise rejection.
- The chat model picker read "Mi Claude ()" while the model was unknown. The
  chat opened without a profile, and it offered a provider restored from a
  backup without its key.

## Root cause of the uncaught rejection

`ai@7` `streamText` passes `completion: totalUsage.then(...)` to its
OpenTelemetry tracing channel. When nothing completes, `totalUsage` rejects
with `NoOutputGeneratedError`. The Node path attaches a `.catch` to
`completion`, but the browser path (`process.release.name !== "node"`)
returned early without one, so the derived promise rejected unhandled in the
browser. `runTurn` itself already rejected cleanly with the provider's
`APICallError`.

Upstream fixed this in `ai@7.0.123` (bisected: 7.0.122 still leaks, 7.0.123
does not). The fix is to raise the floor to `^7.0.123`. A regression test
masks the runtime as a browser and asserts that no rejection goes
unhandled. It was red on 7.0.92 and is green on the new floor.

## What Changes

- `@kaiord/ai` exports `verifyProviderKey(credential, fetch?)`. It calls the
  provider's list-models endpoint, which spends no tokens, and returns
  `valid`, `invalid` or `unverified`:
  - 401 and 403 are `invalid`, and so is a Google 400 `API_KEY_INVALID`.
  - A network error, a timeout or any other status is `unverified`.
- Settings → AI checks the key before it saves:
  - A rejected key is not saved. The form keeps the input and shows an
    alert.
  - An unverified key is saved with a note.
  - Editing a provider re-checks the key only when the key changed.
- The chat model picker names the model only once it is known; it never
  shows "()". The workout generator's picker shows the bare label.
- The chat page explains what it is missing, and links to the fix:
  - With no active profile, it links to the athlete page.
  - When the only provider came from a backup without its key, it names
    that provider and links to Settings → AI.
  - A keyless provider is never offered to the chat.

## Decisions

- **List-models probe, not a one-token completion.** It spends nothing,
  works with every model the key can see, and returns 401 for a wrong key
  on all three providers.
- **Only a definite rejection blocks the save.** An outage or an offline
  browser must not stop a user from saving a key that may be right.
- **Fix the leak at its source.** Wrapping the chat in a global
  `unhandledrejection` handler would hide the next real leak too.

## Impact

- Specs: `ai-providers` (key check added), `spa-ai-model-selection` (key
  checked on save), `spa-ai-chat` (chat prerequisites, failed turn leaves
  no uncaught rejection).
- Code: `packages/ai` and `packages/workout-spa-editor`. No Dexie version
  bump.
