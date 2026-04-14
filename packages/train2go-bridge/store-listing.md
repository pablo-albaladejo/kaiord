# Chrome Web Store Listing

## Extension Name

Kaiord Train2Go Bridge

## Short Description (132 chars max)

Reads training plans from Train2Go coaching platform and bridges them to the Kaiord workout editor

## Detailed Description

Kaiord Train2Go Bridge reads your training plans from the Train2Go coaching platform (https://app.train2go.com) and bridges them to the Kaiord workout editor (https://kaiord.com/editor). Import structured workouts from your coach directly into Kaiord for editing, conversion, and push to devices.

Features:
• Read weekly training plans from Train2Go
• Import individual workouts into the Kaiord editor
• View coaching calendar with planned sessions
• Automatic detection of workout types (running, cycling, swimming, strength)

How it works:

1. Log into Train2Go in your browser
2. Open the Kaiord workout editor
3. Browse your coaching calendar and import workouts with one click

Privacy:
• No data collection, no analytics, no telemetry
• No passwords or tokens stored — reads from your existing browser session
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
- [ ] Paste permission justifications from `privacy-justification.md` into the CWS dashboard
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

1. **Connected state**: Open Train2Go and log in, click extension icon, capture popup showing coaching plan data
2. **Disconnected state**: Close all Train2Go tabs, click extension icon, capture popup showing "Not connected"
3. **Import flow**: In connected state, browse calendar and import a workout

Steps to capture:

1. Load the extension from the extracted zip (`chrome://extensions` → Load unpacked)
2. Open Train2Go and log in
3. Use Chrome DevTools "Capture screenshot" or a screenshot tool
4. Crop to 1280x800 or 640x400
