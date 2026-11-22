## MODIFIED Requirements

### Requirement: Bridge announcement via content script

Each bridge extension SHALL inject a content script into pages matching `https://kaiord.com/*` (that exact origin, no subdomain) and, in development builds only, `http://localhost:*/*`. The content script SHALL post a message to `window` on injection:

```json
{
  "type": "KAIORD_BRIDGE_ANNOUNCE",
  "bridgeId": "<bridge-id>",
  "extensionId": "<chrome.runtime.id>",
  "name": "<human-readable name>",
  "version": "<extension version>",
  "protocolVersion": 1,
  "capabilities": ["<capability-1>", ...]
}
```

The content script SHALL use `run_at: "document_start"` to announce as early as possible.

#### Scenario: Garmin Bridge announces on kaiord.com

- **WHEN** the Garmin Bridge extension is installed and the user navigates to `https://kaiord.com/calendar`
- **THEN** the content script posts `{ type: "KAIORD_BRIDGE_ANNOUNCE", bridgeId: "garmin-bridge", extensionId: "<runtime-id>", capabilities: ["write:workouts"] }` to `window`

#### Scenario: Train2Go Bridge announces on localhost

- **WHEN** the Train2Go Bridge extension is installed and the user navigates to `http://localhost:5173/`
- **THEN** the content script posts `{ type: "KAIORD_BRIDGE_ANNOUNCE", bridgeId: "train2go-bridge", extensionId: "<runtime-id>", capabilities: ["read:training-plan"] }` to `window`

#### Scenario: Extension not installed

- **WHEN** no bridge extensions are installed
- **THEN** no announcements are posted and the SPA receives no bridge messages
