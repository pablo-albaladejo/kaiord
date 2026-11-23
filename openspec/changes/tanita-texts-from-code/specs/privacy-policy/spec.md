## ADDED Requirements

### Requirement: Kaiord for Tanita section states what the extension does

The privacy policy SHALL have a `## Kaiord for Tanita Extension` section,
registered in `claims/tanita.json`. It SHALL state that the extension uses no
password and cannot read the `TANITASESS` cookie (no `cookies` permission);
that it makes a single fixed read-only `GET` of
`https://mytanita.eu/en/user/export-csv`, which returns the athlete's whole
body-composition history; that it hands the export to the Kaiord App
unparsed; that each popup open, Refresh, and session check downloads the whole
export and keeps only whether it arrived; that `chrome.storage.local` holds
only the popup's health stamps and the theme preference; that it injects no
content script on `mytanita.eu`; and that it has no telemetry.

#### Scenario: The check is no longer disclosed

- **WHEN** the Tanita section stops saying that checking the connection downloads the export
- **THEN** `check-privacy-policy` SHALL fail on "Tanita session check downloading the whole export disclosed"

#### Scenario: The storage disclosure is dropped

- **WHEN** the Tanita section stops naming what `chrome.storage.local` holds
- **THEN** `check-privacy-policy` SHALL fail on "Tanita chrome.storage.local contents disclosed"
