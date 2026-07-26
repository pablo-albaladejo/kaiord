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

## Automated Publishing

After initial setup, updates are published automatically via GitHub Actions:

1. Create a changeset: `pnpm exec changeset` (select `@kaiord/tanita-bridge`)
2. Merge to main — changesets creates a "Version Packages" PR
3. Merge the Version Packages PR — `cws-publish.yml` detects the version bump
   and uploads to CWS
