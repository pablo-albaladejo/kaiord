# Chrome Web Store Listing

The **Short Description** and **Detailed Description** below are a registered
claims surface: every paragraph and list item in them is an entry in
[`claims/trainingpeaks.json`](../../claims/trainingpeaks.json) with the code or
test that proves it, and `pnpm lint:claims` fails on any sentence that is not.
See [`claims/README.md`](../../claims/README.md).

## Extension Name

Kaiord TrainingPeaks Bridge

## Short Description (132 chars max)

Lets the Kaiord App send workouts to your TrainingPeaks calendar and read your weight, using your own TrainingPeaks sign-in

## Detailed Description

Kaiord for TrainingPeaks connects the Kaiord App (https://kaiord.com/app) to your TrainingPeaks account. You sign in to TrainingPeaks in Chrome as usual; the extension never sees your password.

What it does:

• Sends the workouts you create in the Kaiord App to your TrainingPeaks calendar, each on its day.
• Each send adds a new workout in TrainingPeaks. Before sending a workout again, the Kaiord App checks whether TrainingPeaks still has the copy it sent: if it does, an unchanged workout adds nothing, and for one you changed the Kaiord App asks you first, because TrainingPeaks would then hold two copies. The extension cannot delete anything in TrainingPeaks or change a workout already there.
• On a Basic TrainingPeaks account, TrainingPeaks accepts workouts only for today and tomorrow, counted in the account's time zone; for any day that may be later there, the Kaiord App tells you so before you send, and says the same if TrainingPeaks refuses it.
• Reads the metrics you logged in TrainingPeaks over the last 30 days, from which the Kaiord App keeps only your weight.
• Shows in its popup whether your TrainingPeaks sign-in can be used.

How it works:

1. Sign in to TrainingPeaks in Chrome.
2. The extension exchanges that sign-in for a short-lived TrainingPeaks access token. No password is entered or seen.
3. Open the Kaiord App and send a workout to TrainingPeaks.

Your token and your data:

• The access token is kept in your browser (chrome.storage.local) and is sent only to TrainingPeaks. It never travels to Kaiord.
• Checking your sign-in, from the Kaiord App or the popup, asks TrainingPeaks nothing and mints no token. The extension asks TrainingPeaks for a token, and stores it, only when the Kaiord App is about to read or send.
• The extension gives the Kaiord App your TrainingPeaks athlete number just before a workout is placed, because TrainingPeaks needs it, and never the token.
• The extension sends requests only to TrainingPeaks, and answers only the Kaiord App at https://kaiord.com.
• No analytics and no tracking.
• Removing the extension from Chrome deletes everything it stored.
• Access through your own TrainingPeaks sign-in is unofficial: it is not a TrainingPeaks partner API, and it can stop working without notice.
• Open source: https://github.com/pablo-albaladejo/kaiord

## Metadata

- **Category**: Productivity
- **Language**: English
- **Publisher**: Pablo Albaladejo
- **Privacy policy URL**: https://kaiord.com/docs/legal/privacy-policy
- **Website**: https://kaiord.com
- **Support URL**: https://github.com/pablo-albaladejo/kaiord/issues

## Submission Checklist (first publish, not done)

This extension has never been published. A maintainer completes these by hand:

- [ ] Create the Chrome Web Store Developer Dashboard listing
- [ ] Fill in the listing fields from this document
- [ ] Upload icon (128x128 from `packages/trainingpeaks-bridge/icons/icon128.png`)
- [ ] Capture and upload at least one screenshot (1280x800 or 640x400) of the current popup; none exists yet
- [ ] Paste the permission justifications from `privacy-justification.md` into the dashboard
- [ ] Set privacy policy URL to `https://kaiord.com/docs/legal/privacy-policy`
- [ ] Submit for review

The Short Description reaches the store through `extDescription` in
`_locales/en/messages.json`; the Detailed Description and the permission
justifications are pasted into the dashboard by hand.

## Automated Publishing (not wired yet)

`cws-publish.yml` currently only publishes `garmin-bridge` and
`train2go-bridge`. This extension has no Chrome Web Store Developer
Dashboard listing, extension ID, or publish secret yet, and is not in the
workflow's matrix — see `openspec/specs/cws-auto-publish/spec.md`,
Requirement "Onboarding a new bridge extension to automated publishing" for
the registration steps a maintainer must complete first. Once those steps
are done, a `package.json` version bump on `@kaiord/trainingpeaks-bridge`
will be picked up by the same upload → publish → verify flow `garmin-bridge`
and `train2go-bridge` already use.
