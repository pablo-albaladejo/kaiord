## MODIFIED Requirements

### Requirement: Chrome Web Store listing metadata

The CWS listing SHALL use the following metadata:

- **Name**: "Kaiord for Garmin", the same in every language
- **Short description**: "Lets the Kaiord App send workouts to Garmin Connect and read your activities, using your own Garmin sign-in", and its Spanish version from `_locales/es`
- **Category**: Productivity
- **Languages**: English (default) and Spanish
- **Publisher**: Pablo Albaladejo
- **Privacy policy URL**: `https://kaiord.com/docs/legal/privacy-policy`

A `store-listing.md` file SHALL be created in `packages/garmin-bridge/` documenting the full listing text, in English and Spanish, and the submission checklist. Its short and detailed descriptions in both languages, the permission justifications and the Garmin privacy-policy section SHALL be registered claims surfaces (see `public-claims`).

#### Scenario: Store listing file contains required metadata

- **WHEN** `packages/garmin-bridge/store-listing.md` is read
- **THEN** it SHALL contain: extension name, short description and detailed description in English and in Spanish, category, privacy policy URL, and a submission checklist
