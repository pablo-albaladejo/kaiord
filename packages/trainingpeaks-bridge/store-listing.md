# Chrome Web Store Listing

## Extension Name

Kaiord TrainingPeaks Bridge

## Short Description (132 chars max)

Import your TrainingPeaks body metrics into the Kaiord editor via your own browser session

## Detailed Description

Kaiord TrainingPeaks Bridge connects the Kaiord editor (https://kaiord.com) to
your TrainingPeaks account through your existing browser session. No passwords or
API keys needed — the extension mints a short-lived access token from your active
TrainingPeaks login and reads your own body metrics.

Features:
• Import your body metrics (weight and more) from TrainingPeaks with one click
• Optionally push a weight measurement back to TrainingPeaks
• Session status indicator in the popup

How it works:

1. Log into TrainingPeaks in your browser
2. Open the Kaiord editor
3. Import your latest measurements

Privacy:
• No data collection, no analytics, no telemetry
• No passwords or cookies stored — the extension exchanges your existing session
cookie for a short-lived access token, held locally
• Reads only your metrics; parsing happens in the editor on your device
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
are done, a `package.json` version bump on `@kaiord/trainingpeaks-bridge`
will be picked up by the same upload → publish → verify flow `garmin-bridge`
and `train2go-bridge` already use.
