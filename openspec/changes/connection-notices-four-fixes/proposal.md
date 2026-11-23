## Why

A Connection that did not work was worded a different way on every surface:
the review of 2026-11-22 counted 23 popup states across the five extensions,
9 App phrasings for installing an extension, 12 for signing in and 9 for
updating, and eight names for the extension itself. Some of them stated causes
nobody verified: a Garmin read that failed was shown as "signed out" (#1100),
an outdated WHOOP or TrainingPeaks extension as a signed-out Session (#1098),
and the WHOOP popup and card disagreed on the same answer (#1091). Ticket
#1644, user stories 39–46 of #1670, `GLOSSARY.md` "What the athlete reads",
`docs/adr/0004`.

## What Changes

- One source, `packages/_shared/bridge-core/connection-notices.js`, holds the
  closed set of four fixes (Install, Update, Sign in to the Platform, Try
  again), the map from a Connection's verified state to its fix, and one
  wording per fix in English and Spanish. It is vendored byte-for-byte into the
  five extensions (`pnpm bridge:sync`, parity guard) and read by the Kaiord App
  through `@kaiord/i18n` (`connectionNotice`). A working Connection, or one
  still being checked, shows no notice.
- The App maps every probe answer to that state through one small adapter
  (`application/connections/session-outcome.ts`): only the Platform's own
  refusal is "signed-out"; anything not verified is "not-answering". The
  protocol version is read from the envelope of every probe, so an outdated
  extension is "outdated" on every bridge whatever its action answers;
  discovery no longer rejects an extension on another protocol version, which
  made it look absent.
- Every App surface that worded a broken Connection — Connections cards and
  banner, header pill and Settings banner, editor ribbon, send buttons, Send
  week, placement feedback, Update Garmin, TrainingPeaks send, coaching dialog
  and sync, zones toast, Tanita body export, the assistant's push toast —
  renders that notice and its one fix. The page-wide "The Kaiord extension is
  not installed" banner is gone: each card shows its own Install.
- The five popups render the same notice through a shared `renderNotice`
  shell renderer, in English until #1646 lifts R-BridgeLocalesEnglishOnly.
- New root guard `scripts/check-connection-notices.mjs`
  (`pnpm lint:connection-notices`, R-ConnectionNoticesSingleSource) fails on a
  fifth fix, a second wording in the App or an extension, or a popup whose
  Platform name or sign-in page differs from the App's.

## Capabilities

### New Capabilities

- `connection-notices`: the four fixes, their one wording, the state mapping
  and the guard that keeps them single.

### Modified Capabilities

- `spa-connections-page`: a broken card and the consequence banner word the
  Connection through its notice.
- `bridge-runtime-discovery`: an announcement is not rejected for its protocol
  version.
- `spa-bridge-protocol`: an outdated extension is offered Update, worded by the
  notice.
- `bridge-core`: the notices master and the `renderNotice` shell renderer.

## Impact

`packages/_shared/bridge-core`, the five `packages/*-bridge` popups and their
`_locales/en`, `packages/i18n`, `packages/workout-spa-editor` (application,
adapters, hooks, components, dictionaries, e2e), root guard and docs. No
public claim changes; the screenshot instructions in the store-listing files
name the new popup wording.
