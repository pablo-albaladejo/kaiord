## Context

This change indexes a review fix pass whose decisions live in the open
changes they extend (see proposal). Only the athlete-copy decisions have no
open change: `add-i18n-foundation` is archived.

## Decisions

- **A failure is a reason, not a text.** Every failure an extension, a
  Platform or a library reports reaches the presentation layer as a typed
  reason (`updated`, `sign-in`, `not-prepared`, `not-answering`, …) mapped
  to a dictionary key in English and Spanish. The raw text goes only to the
  console through `lib/log-failure.ts` (static first argument, scrubbed). A
  failure no reason matches says the Platform is not answering and offers
  Try again: a cause that was not verified is never stated (GLOSSARY).
- **Tool results for the model stay English and live in `application/`.**
  A chat tool's error message is read by the model, which words its own
  answer; such text lives in `application/chat/` like every other tool
  result, outside the copy rule by layer, never by a file exclusion.
- **The copy rules close what a file can show.** Strings built with `+`, a
  `const` string or a function returning text in the same file, a bare
  `toast("…")`, more copy setters and copy props, `<input type="submit"
value>`, and `*_NAMES` maps. Left open, because closing them would need
  cross-file analysis or flood false positives: imported constants and
  functions, `let` variables and parameters, arrays of strings rendered
  with `.map`, objects with neutral keys, `alert`/`confirm` and
  `document.title`.
- **Language-neutral words where they belong.** The single letters A, C, G,
  V, X are allowed only on the keyboard shortcut surfaces; KRD and GCN only
  on the import and export file-type surfaces (ADR 0003).
