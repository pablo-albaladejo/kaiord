# Chrome Web Store Listing

## Extension Name

Kaiord Tanita Bridge

## Short Description (132 chars max)

Import your MyTANITA body-composition export into the Kaiord editor via your own browser session

## Detailed Description

Kaiord Tanita Bridge connects the Kaiord editor (https://kaiord.com) to your
MyTANITA account through your existing browser session. No passwords or API keys
needed — the extension reads your own CSV export using your active MyTANITA
login.

Features:
• Import your body-composition CSV export from MyTANITA with one click
• Session status indicator in the popup

How it works:

1. Log into MyTANITA in your browser
2. Open the Kaiord editor
3. Import your latest measurements

Privacy:
• No data collection, no analytics, no telemetry
• No passwords or cookies stored — uses your existing browser session
• Reads only the CSV export; parsing happens in the editor on your device
• Open source: https://github.com/pablo-albaladejo/kaiord

## Metadata

- **Category**: Productivity
- **Language**: English
- **Publisher**: Pablo Albaladejo
- **Privacy policy URL**: https://kaiord.com/docs/legal/privacy-policy
- **Website**: https://kaiord.com
- **Support URL**: https://github.com/pablo-albaladejo/kaiord/issues

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
