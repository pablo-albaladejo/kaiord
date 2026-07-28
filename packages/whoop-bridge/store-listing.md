# Chrome Web Store Listing

**Status: NOT YET SUBMITTED.** This extension has no Chrome Web Store
Developer Dashboard listing, no extension ID, and no publish secret. It is
also absent from the `cws-publish.yml` matrix, so none of the "Automated
Publishing" steps below apply until the manual registration steps are
completed — see `openspec/specs/cws-auto-publish/spec.md`, Requirement
"Onboarding a new bridge extension to automated publishing".

The copy below is prepared ahead of that registration so the dashboard
listing can be filled in directly once created.

## Extension Name

Kaiord WHOOP Bridge

## Short Description (132 chars max)

Connects the Kaiord workout editor to your WHOOP recovery & sleep data via your own browser session

## Detailed Description

Kaiord WHOOP Bridge connects the Kaiord workout editor (https://kaiord.com/editor) to your WHOOP account through your existing signed-in app.whoop.com session. No passwords, no developer app, and no API key — the extension rides your own WHOOP login.

Features:
• Import recovery, HRV, sleep, vitals, strain, and stress data
• Import heart-rate series and workouts as activities
• Import Advanced-Labs biomarker test results as lab reports
• Session status indicator in the popup

How it works:

1. Log into WHOOP in your browser (app.whoop.com)
2. Open the Kaiord workout editor
3. The editor imports your WHOOP data through the bridge

Privacy:
• No data collection, no analytics, no telemetry
• No OAuth, no developer API key, no password stored — the extension captures the session bearer your own signed-in WHOOP tab already uses, and holds it only in memory (`chrome.storage.session`), never on disk
• Read-only: the bridge exposes no path to write to WHOOP
• Open source: https://github.com/pablo-albaladejo/kaiord

## Metadata

- **Category**: Health & Fitness
- **Language**: English
- **Publisher**: Pablo Albaladejo
- **Privacy policy URL**: https://kaiord.com/docs/legal/privacy-policy
- **Website**: https://kaiord.com
- **Support URL**: https://github.com/pablo-albaladejo/kaiord/issues

## Submission Checklist (Initial Setup — NOT started)

- [ ] Create the Chrome Web Store Developer Dashboard listing for this extension
- [ ] Record the assigned extension ID
- [ ] Add a `CWS_WHOOP_EXTENSION_ID` repository secret
- [ ] Widen `cws-publish.yml`'s `decide`/`act` matrices and `on.push.paths` to include `whoop-bridge` (see `openspec/specs/cws-auto-publish/spec.md`)
- [ ] Add `@kaiord/whoop-bridge` to changesets versioning
- [ ] Fill in listing fields from this document
- [ ] Upload icon (128x128 from `packages/whoop-bridge/icons/icon128.png`)
- [ ] Upload at least one screenshot (1280x800 or 640x400)
- [ ] Paste permission justifications from `privacy-justification.md` into the CWS dashboard
- [ ] Set privacy policy URL to `https://kaiord.com/docs/legal/privacy-policy`
- [ ] Submit for review

## Automated Publishing (not wired yet)

`cws-publish.yml` currently only publishes `garmin-bridge` and
`train2go-bridge`. Once the Submission Checklist above is complete, a
`package.json` version bump on `@kaiord/whoop-bridge` will be picked up by
the same upload → publish → verify flow those two extensions use — no
further workflow changes required at that point.

## Screenshots

Capture popup screenshots at 640x400 or 1280x800:

1. **Connected state**: Open WHOOP, log in, click extension icon, capture popup showing "Connected"
2. **Signed-out state**: Close all WHOOP tabs / sign out, click extension icon, capture popup showing "Session signed out"

Steps to capture:

1. Load the extension unpacked (`chrome://extensions` → Load unpacked)
2. Open `app.whoop.com` and log in
3. Use Chrome DevTools "Capture screenshot" or a screenshot tool
4. Crop to 1280x800 or 640x400
