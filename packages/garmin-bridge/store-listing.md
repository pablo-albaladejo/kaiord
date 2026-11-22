# Chrome Web Store Listing

The **Short Description** and **Detailed Description** below are a registered
claims surface: every paragraph and list item in them is an entry in
[`claims/garmin.json`](../../claims/garmin.json) with the code or test that
proves it, and `pnpm lint:claims` fails on any sentence that is not. See
[`claims/README.md`](../../claims/README.md).

## Extension Name

Kaiord Garmin Bridge

## Short Description (132 chars max)

Lets the Kaiord App send workouts to Garmin Connect and read your activities, using your own Garmin sign-in

## Detailed Description

Kaiord for Garmin connects the Kaiord App (https://kaiord.com/app) to your Garmin Connect account. You sign in to Garmin Connect in Chrome as usual; the extension never sees your password.

What it does:

• Sends the workouts you create in the Kaiord App to your Garmin Connect workout library.
• Places those workouts on their day in your Garmin Connect calendar, and moves them when the date changes. It removes only calendar entries of workouts Kaiord sent, and never deletes a library workout.
• Reads your 20 most recent Garmin Connect activities for the Kaiord App.
• Uploads a body-composition measurement (your weight and related values) to Garmin Connect when you send one from the Kaiord App.
• Shows in its popup whether it can currently read from Garmin Connect.

How it works:

1. Sign in to Garmin Connect in Chrome.
2. The extension exchanges that sign-in for Garmin access tokens. No password is entered or seen.
3. Open the Kaiord App and send a workout.

Your tokens and your data:

• The Garmin tokens are kept in your browser (chrome.storage.local) and are sent only to Garmin. They never travel to Kaiord.
• The extension sends requests only to Garmin, and answers only the Kaiord App at https://kaiord.com.
• No analytics and no tracking. The extension keeps a short log of its own errors in your browser and sends it nowhere.
• Removing the extension from Chrome deletes everything it stored.
• Access through your own Garmin sign-in is unofficial: it is not a Garmin partner API, and it can stop working without notice.
• Open source: https://github.com/pablo-albaladejo/kaiord

## Metadata

- **Category**: Productivity
- **Language**: English
- **Publisher**: Pablo Albaladejo
- **Privacy policy URL**: https://kaiord.com/docs/legal/privacy-policy
- **Website**: https://kaiord.com
- **Support URL**: https://github.com/pablo-albaladejo/kaiord/issues

## Submission Checklist (Initial Setup)

- [x] Create Chrome Web Store developer account ($5 one-time fee)
- [x] Register as "Pablo Albaladejo"
- [x] Fill in listing fields from this document
- [x] Upload icon (128x128 from `packages/garmin-bridge/icons/icon128.png`)
- [x] Upload at least one screenshot (1280x800 or 640x400)
- [x] Paste permission justifications from `privacy-justification.md` into the CWS dashboard
- [x] Set privacy policy URL to `https://kaiord.com/docs/legal/privacy-policy`
- [x] Submit for review

## Automated Publishing

After initial setup, updates are published automatically via GitHub Actions:

1. Create a changeset: `pnpm exec changeset` (select `@kaiord/garmin-bridge`)
2. Merge to main — changesets creates a "Version Packages" PR
3. Merge the Version Packages PR — `cws-publish.yml` detects the version bump and uploads to CWS

The workflow uploads the package only. The Short Description reaches the store
through `extDescription` in `_locales/en/messages.json`; the Detailed
Description and the permission justifications are pasted into the CWS
dashboard by hand.

See `docs/cws-credentials-setup.md` for the one-time CWS API credentials setup.

## Screenshots

`assets/screenshot-1280x800.png` shows an older popup (a green "Connected to
Garmin Connect" bar and "List Workouts" / "Check Session" buttons) that no
longer exists. Replace it with captures of the current popup:

1. **Connected**: signed in to Garmin Connect, click the extension icon; the popup shows "Connected" and "Open Kaiord editor".
2. **No access**: signed out of Garmin with no stored token; the popup shows "No access to Garmin Connect" and "Sign in to Garmin Connect".

Steps to capture:

1. Load the extension from the extracted zip (`chrome://extensions` → Load unpacked)
2. Open Garmin Connect and log in
3. Use Chrome DevTools "Capture screenshot" or a screenshot tool
4. Crop to 1280x800 or 640x400
