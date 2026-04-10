# Chrome Web Store Listing

## Extension Name

Kaiord Garmin Bridge

## Short Description (132 chars max)

Connects the Kaiord workout editor to Garmin Connect via your browser session

## Detailed Description

Kaiord Garmin Bridge connects the Kaiord workout editor (https://kaiord.com/editor) to your Garmin Connect account through your existing browser session. No passwords or API keys needed — the extension uses your active Garmin Connect login.

Features:
• Push structured workouts from the Kaiord editor directly to Garmin Connect
• List your existing Garmin Connect workouts
• Session status indicator in the popup

How it works:

1. Log into Garmin Connect in your browser
2. Open the Kaiord workout editor
3. Push workouts to Garmin Connect with one click

Privacy:
• No data collection, no analytics, no telemetry
• No passwords or tokens stored — uses your existing browser session
• Open source: https://github.com/pablo-albaladejo/kaiord

## Metadata

- **Category**: Productivity
- **Language**: English
- **Publisher**: Pablo Albaladejo
- **Privacy policy URL**: https://kaiord.com/docs/legal/privacy-policy
- **Website**: https://kaiord.com
- **Support URL**: https://github.com/pablo-albaladejo/kaiord/issues

## Submission Checklist

- [ ] Create Chrome Web Store developer account ($5 one-time fee)
- [ ] Register as "Pablo Albaladejo"
- [ ] Run `bash scripts/package-extension.sh` to generate the zip
- [ ] Upload `packages/garmin-bridge/dist/kaiord-garmin-bridge-{version}.zip`
- [ ] Fill in listing fields from this document
- [ ] Upload icon (128x128 from `packages/garmin-bridge/icons/icon128.png`)
- [ ] Upload at least one screenshot (1280x800 or 640x400)
- [ ] Paste permission justifications from `privacy-justification.md` into the CWS dashboard
- [ ] Set privacy policy URL to `https://kaiord.com/docs/legal/privacy-policy`
- [ ] Submit for review
- [ ] Wait for approval (may take days due to `webRequest` permission)

## Screenshots

Capture popup screenshots at 640x400 or 1280x800:

1. **Connected state**: Open Garmin Connect, click extension icon, capture popup showing "Connected to Garmin Connect"
2. **Disconnected state**: Close all Garmin Connect tabs, click extension icon, capture popup showing "Not connected"
3. **Workout list**: In connected state, click "List Workouts", capture popup showing workout names

Steps to capture:

1. Load the extension from the extracted zip (`chrome://extensions` → Load unpacked)
2. Open Garmin Connect and log in
3. Use Chrome DevTools "Capture screenshot" or a screenshot tool
4. Crop to 1280x800 or 640x400
