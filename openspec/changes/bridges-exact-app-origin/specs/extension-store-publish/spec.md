## MODIFIED Requirements

### Requirement: Production manifest

The extension SHALL have a `manifest.prod.json` that is identical to `manifest.json` except:

- `externally_connectable.matches` SHALL only contain `https://kaiord.com/*` (no localhost origins)
- The top-level `icons` field SHALL reference `icons/icon16.png`, `icons/icon48.png`, and `icons/icon128.png`
- `action.default_icon` SHALL reference `icons/icon48.png` and `icons/icon128.png` (Chrome does not use 16px for the action icon)

The development `manifest.json` SHALL remain unchanged for local development.

#### Scenario: Production manifest excludes localhost

- **WHEN** `manifest.prod.json` is read
- **THEN** `externally_connectable.matches` SHALL NOT contain any `http://localhost:*` entries

#### Scenario: Production manifest includes real icons

- **WHEN** `manifest.prod.json` is read
- **THEN** `action.default_icon` SHALL reference `icons/icon48.png` and `icons/icon128.png`
- **AND** a top-level `icons` field SHALL reference sizes 16, 48, and 128

#### Scenario: Dev manifest retains localhost origins with updated icons

- **WHEN** a developer loads the extension unpacked from the source directory
- **THEN** `manifest.json` SHALL contain localhost origins in `externally_connectable`
- **AND** `manifest.json` SHALL reference the new icon paths in `icons/`
