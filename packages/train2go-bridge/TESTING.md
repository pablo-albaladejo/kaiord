# Manual Testing Guide — Kaiord Train2Go Bridge

## Prerequisites

- Chrome or Chromium-based browser
- A Train2Go account with an active training plan

## Load the Extension

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select `packages/train2go-bridge/` directory
5. Note the extension ID shown on the card

## Test Session Check

1. Open `https://app.train2go.com` and log in
2. Click the extension icon (puzzle piece → Kaiord Train2Go Bridge)
3. Click **Check Session**
4. Expected: Green "Connected — {Your Name}"

## Test Read This Week

1. With session connected, click **Read This Week**
2. Expected: "{N} activities found"

## Test with SPA

1. Copy the extension ID from `chrome://extensions/`
2. Create `.env` in `packages/workout-spa-editor/`:
   ```
   VITE_TRAIN2GO_EXTENSION_ID=your-extension-id-here
   ```
3. Start the SPA: `cd packages/workout-spa-editor && pnpm dev`
4. The SPA detects the extension on boot via `useTrain2GoStore`

## Troubleshooting

- **"Not connected"**: Refresh the Train2Go tab after loading the extension
- **Multiple Train2Go tabs**: Close all except one, refresh, retry
- **Service worker inactive**: Click "Check Session" to wake it up
- **Content script not injected**: Reload extension (refresh button on card), then refresh Train2Go tab
