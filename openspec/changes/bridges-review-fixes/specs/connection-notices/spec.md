## ADDED Requirements

### Requirement: Why a check asked nothing, and why a sign-in cannot serve, are worded once

The single notices source SHALL word, in English and Spanish, each reason a
check asked nothing (`would-mint-token` for Garmin and TrainingPeaks,
`no-token-captured` for WHOOP, `would-download-data` for Tanita one protocol
behind), the reason a held sign-in cannot serve (`no-account-id`: imports
cannot run, fix Sign in to the Platform), and the one exception to the four
fixes (`NO_TAB`: no tab of the Platform open, fix Open the Platform), in the
same sentence shape as the four fixes. The Kaiord App and every popup SHALL
take these wordings from it, and the App SHALL show the no-account-id and
no-tab notices at the same moment as the WHOOP popup, from the same check.

#### Scenario: WHOOP is not said to mint a token

- **WHEN** no WHOOP sign-in has been captured
- **THEN** the App says Kaiord learns it from the first request a WHOOP tab sends, and nothing about a token

#### Scenario: The popup and the App agree on a closed WHOOP tab

- **WHEN** the WHOOP check answers a held sign-in with `tabOpen: false`
- **THEN** the popup and the App both show "You cannot use WHOOP in Kaiord until a WHOOP tab is open in this browser." with Open WHOOP

#### Scenario: An import that cannot run says so

- **WHEN** the WHOOP sign-in names no account and the athlete runs an import
- **THEN** the import is refused with the no-account-id notice, and nothing is imported
