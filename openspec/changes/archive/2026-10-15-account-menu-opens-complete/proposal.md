> Completed: 2026-10-15

# Proposal: the account menu opens complete, and a saved key reaches the list at once

## Why

Two Mobile flakes had the same shape: the user's tap was right, and the page
changed under it.

- `accessibility.spec.ts` "should persist theme preference across page
  reloads" (and its sibling "should toggle between light and dark themes")
  failed on Mobile Chrome with the theme unchanged and the account menu
  closed. The menu had opened while its athlete reads were still loading.
  `AthleteSwitcher` rendered that loading state as an empty list, and the
  first-run "My athlete" row arrived about 700 ms later (6x CPU throttle),
  pushing the theme row down 36 px. The tap landed on "Help & docs", which
  closed the menu and returned focus to the trigger, which matches the CI
  snapshot.
- `ai-generate-workout` 8.10 sometimes saved an account that the list showed
  seconds later. Every live reader of the AI providers decrypted every key on
  every read, and each decrypt derived a 100,000-iteration PBKDF2 key: five
  derivations per stored provider per save.

## What Changes

- The account menu trigger stays disabled until the active athlete and the
  athlete list have loaded. The list is read by the always-mounted
  `AccountMenu` and passed to `AthleteSwitcher`, so opening the menu no
  longer starts the read.
- The Dexie AI provider repository remembers the plaintext of every key it
  has encrypted or decrypted in this session, keyed by ciphertext, so
  reading back a stored provider derives no key. A row this session has
  never seen is decrypted once. The stored form is unchanged.

## Impact

- `spa-routing`: new requirement "The account menu opens complete".
- `@kaiord/workout-spa-editor` patch. No storage or schema change.
