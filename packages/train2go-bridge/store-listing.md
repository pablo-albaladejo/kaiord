# Chrome Web Store Listing

The **Short Description** and **Detailed Description** below are a registered
claims surface: every paragraph and list item in them is an entry in
[`claims/train2go.json`](../../claims/train2go.json) with the code or test that
proves it, and `pnpm lint:claims` fails on any sentence that is not. See
[`claims/README.md`](../../claims/README.md).

## Extension Name

Kaiord Train2Go Bridge

## Short Description (132 chars max)

Lets the Kaiord App read the plan your coach sets on Train2Go, your training zones and your weight, using your own Train2Go sign-in

## Detailed Description

Kaiord for Train2Go connects the Kaiord App (https://kaiord.com/app) to your Train2Go account. You sign in to Train2Go in Chrome as usual; the extension never sees your password.

What it does:

• Reads the week your coach planned on Train2Go: each coaching activity's date, sport, title, duration, workload and completion status.
• Reads one day in full when the Kaiord App asks: the coach's description of each session, and that day's comments with who wrote them.
• Reads your heart-rate, power and pace zones per sport, your maximum and resting heart rate, and your weight from your Train2Go profile page. Nothing else on that page is passed on: gender, birthday, body fat, height, contact details, records and tests are dropped inside the extension.
• Tells the Kaiord App who is signed in, with your coach's name and the notes your coach keeps about you when Train2Go provides them.
• Shows in its popup whether it can currently read from Train2Go, your coach's name and notes, and this week's planned and completed sessions and workload.
• Only reads. It never changes anything on Train2Go.

How it works:

1. Sign in to Train2Go in Chrome.
2. When the Kaiord App asks, the extension requests the page from Train2Go and Chrome adds your own Train2Go sign-in cookie. The extension cannot read that cookie.
3. Open the Kaiord App; it reads your plan through the extension.

Your session and your data:

• The extension stores no password, cookie or token. It keeps in your browser (chrome.storage.local) only what its popup shows: the profile summary the Kaiord App sends, this week's totals, the app's theme preference, when it last could and could not read from Train2Go, and a log of its last 25 errors.
• The extension sends requests only to app.train2go.com, and answers only the Kaiord App at https://kaiord.com.
• What it reads goes only to the Kaiord App in your browser; the extension sends nothing to a Kaiord server.
• No analytics and no tracking. The extension keeps a short log of its own errors in your browser and sends it nowhere.
• Removing the extension from Chrome deletes everything it stored.
• Access through your own Train2Go sign-in is unofficial: it is not a Train2Go partner API, and it can stop working without notice.
• Open source: https://github.com/pablo-albaladejo/kaiord

## Metadata

- **Category**: Productivity
- **Language**: English
- **Publisher**: Pablo Albaladejo
- **Privacy policy URL**: https://kaiord.com/docs/legal/privacy-policy
- **Website**: https://kaiord.com
- **Support URL**: https://github.com/pablo-albaladejo/kaiord/issues

## Submission Checklist (Initial Setup)

- [ ] Fill in listing fields from this document
- [ ] Upload icon (128x128 from `packages/train2go-bridge/icons/icon128.png`)
- [ ] Upload at least one screenshot (1280x800 or 640x400)
- [ ] Paste the single purpose, permission justifications and remote-code answer from `privacy-justification.md` into the CWS dashboard
- [ ] Set privacy policy URL to `https://kaiord.com/docs/legal/privacy-policy`
- [ ] Submit for review

## Automated Publishing

After initial setup, updates are published automatically via GitHub Actions:

1. Create a changeset: `pnpm exec changeset` (select `@kaiord/train2go-bridge`)
2. Merge to main — changesets creates a "Version Packages" PR
3. Merge the Version Packages PR — `cws-publish.yml` detects the version bump and uploads to CWS

See `docs/cws-credentials-setup.md` for the one-time CWS API credentials setup.

## Screenshots

Capture popup screenshots at 640x400 or 1280x800:

1. **Connected state**: Sign in to Train2Go, click the extension icon, capture the popup showing "Connected as …", the coach line and this week's figures
2. **Not-answering state**: Sign out of Train2Go, click the extension icon, capture the popup showing "Train2Go is not answering, so you cannot use it in Kaiord right now." and "Try again"

Steps to capture:

1. Load the extension from the extracted zip (`chrome://extensions` → Load unpacked)
2. Open Train2Go and log in
3. Use Chrome DevTools "Capture screenshot" or a screenshot tool
4. Crop to 1280x800 or 640x400
