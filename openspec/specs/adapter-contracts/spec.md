> Synced: 2026-04-17

# Adapter Contracts

## Requirements

### Requirement: Browser Extension Adapter Pattern

Browser extension adapters SHALL communicate with external web APIs by piggybacking on the user's authenticated browser session. The extension SHALL NOT store, transmit, or manage user credentials. Authentication is delegated entirely to the browser's cookie jar.

The extension adapter architecture SHALL separate concerns into:

- **Background service worker**: Message coordination, token capture via `webRequest`, session-scoped state via `chrome.storage.session`, no direct API calls
- **Content script**: Same-origin API execution on the target domain, automatic cookie attachment by the browser, path/method allowlist enforcement
- **External messaging**: SPA communication via `chrome.runtime.onMessageExternal` with allowed origins declared in `externally_connectable`

Browser extension adapters SHALL use the response shape `{ ok: boolean, protocolVersion?: number, data?: unknown, error?: string }` for all external messages.

Browser extension adapters SHALL enforce a path/method allowlist in the content script to restrict API access to only the operations the adapter is designed to support.

#### Scenario: Extension adapter separates concerns

- **WHEN** the SPA sends an API request via the extension
- **THEN** the background service worker routes the request to the content script, which validates the path/method against the allowlist and executes the fetch on the target domain with browser-managed cookies

#### Scenario: No credential storage

- **WHEN** the extension is inspected (storage, memory, network)
- **THEN** no user credentials (passwords, OAuth tokens, API keys) are stored or transmitted by the extension

#### Scenario: Disallowed API path rejected

- **WHEN** a message requests a path outside the allowlist
- **THEN** the content script rejects the request without making a network call
