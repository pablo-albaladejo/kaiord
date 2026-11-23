## ADDED Requirements

### Requirement: Kaiord for Tanita section states what the extension does

The privacy policy SHALL have a `## Kaiord for Tanita Extension` section,
registered in `claims/tanita.json`. It SHALL state that the extension uses no
password and cannot read the `TANITASESS` cookie (no `cookies` permission);
that it sends read-only requests only to
`https://mytanita.eu/en/user/export-csv`, a `GET` that returns the athlete's
whole body-composition history and a `HEAD` that checks the connection; that
it hands the export to the Kaiord App unparsed; that each popup open, Refresh,
and session check sends only the `HEAD`, downloads no measurement and keeps
only whether the athlete is signed in (#1643); that `chrome.storage.local` holds
only the popup's health stamps and the theme preference; that it injects no
content script on `mytanita.eu`; and that it has no telemetry.

#### Scenario: The check is no longer disclosed

- **WHEN** the Tanita section stops saying that checking the connection sends only a `HEAD` and downloads nothing
- **THEN** `check-privacy-policy` SHALL fail on "Tanita session check by HEAD, downloading nothing, disclosed"

#### Scenario: The storage disclosure is dropped

- **WHEN** the Tanita section stops naming what `chrome.storage.local` holds
- **THEN** `check-privacy-policy` SHALL fail on "Tanita chrome.storage.local contents disclosed"
