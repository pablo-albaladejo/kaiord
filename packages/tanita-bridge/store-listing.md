# Chrome Web Store Listing

The **Short Description** and **Detailed Description** below are a registered
claims surface: every paragraph and list item in them is an entry in
[`claims/tanita.json`](../../claims/tanita.json) with the code or test that
proves it, and `pnpm lint:claims` fails on any sentence that is not. See
[`claims/README.md`](../../claims/README.md).

## Extension Name

Kaiord Tanita Bridge

## Short Description (132 chars max)

Lets the Kaiord App import your weight and body composition from MyTANITA, using your own MyTANITA sign-in

## Detailed Description

Kaiord for Tanita connects the Kaiord App (https://kaiord.com/app) to your MyTANITA account at mytanita.eu. You sign in to MyTANITA in Chrome as usual; the extension never sees your password and cannot read your sign-in cookie.

What it does:

• Downloads your MyTANITA export, which holds every measurement in your history, and hands it to the Kaiord App exactly as MyTANITA sent it. The extension does not interpret the measurements; the Kaiord App does.
• The Kaiord App asks for the export when you open its calendar, if Tanita is switched on for weight or body composition, and when you press Sync now. The Kaiord App turns it into weight and body-composition entries kept in your browser.
• Each time you open the extension's popup or press Refresh, it downloads your whole export again only to learn whether it can still reach it. It keeps nothing of the export and shows only the answer.

How it works:

1. Sign in to MyTANITA at https://mytanita.eu in Chrome.
2. Open the Kaiord App and connect Tanita.
3. The extension sends its request with your MyTANITA sign-in, so no password is entered or stored.

Your sign-in and your data:

• The extension sends requests only to https://mytanita.eu/en/user/export-csv, and answers only the Kaiord App at https://kaiord.com.
• In your browser it keeps only when its popup last could and could not reach your export, and the Kaiord App's theme. It never keeps the export.
• No analytics and no tracking.
• Removing the extension from Chrome deletes everything it stored.
• Access through your own MyTANITA sign-in is unofficial: it is not a Tanita partner API, and it can stop working without notice.
• Open source: https://github.com/pablo-albaladejo/kaiord

## Metadata

- **Category**: Productivity
- **Language**: English
- **Publisher**: Pablo Albaladejo
- **Privacy policy URL**: https://kaiord.com/docs/legal/privacy-policy
- **Website**: https://kaiord.com
- **Support URL**: https://github.com/pablo-albaladejo/kaiord/issues

## Submission Checklist (Initial Setup)

Not done yet: this extension has never been published.

- [ ] Create the listing in the Chrome Web Store Developer Dashboard
- [ ] Fill in listing fields from this document
- [ ] Upload icon (128x128 from `packages/tanita-bridge/icons/icon128.png`)
- [ ] Upload at least one screenshot (1280x800 or 640x400) of the current popup
- [ ] Paste permission justifications from `privacy-justification.md` into the CWS dashboard
- [ ] Set privacy policy URL to `https://kaiord.com/docs/legal/privacy-policy`
- [ ] Submit for review

The Short Description reaches the store through `extDescription` in
`_locales/en/messages.json`; the Detailed Description and the permission
justifications are pasted into the CWS dashboard by hand.

## Screenshots

There are none yet (no `assets/` folder). Capture the current popup:

1. **Connected**: signed in to MyTANITA, click the extension icon; the popup shows "Connected" and "Open Kaiord editor".
2. **Not answering**: signed out of MyTANITA; the popup shows "Tanita is not answering, so you cannot use it in Kaiord right now." and "Try again".

## Automated Publishing (not wired yet)

`cws-publish.yml` currently only publishes `garmin-bridge` and
`train2go-bridge`. This extension has no Chrome Web Store Developer
Dashboard listing, extension ID, or publish secret yet, and is not in the
workflow's matrix — see `openspec/specs/cws-auto-publish/spec.md`,
Requirement "Onboarding a new bridge extension to automated publishing" for
the registration steps a maintainer must complete first. Once those steps
are done, a `package.json` version bump on `@kaiord/tanita-bridge` will be
picked up by the same upload → publish → verify flow `garmin-bridge` and
`train2go-bridge` already use.
