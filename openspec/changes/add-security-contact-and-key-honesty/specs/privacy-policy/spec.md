## ADDED Requirements

### Requirement: Provider API key storage is stated as it is

The privacy policy, the App's Privacy settings section (English and Spanish)
and the BYOK guide (English and Spanish) SHALL state that the athlete's
Provider API key is stored in the browser for kaiord.com, obfuscated with a
fixed key that ships in Kaiord's public code rather than truly encrypted; that
any script running on kaiord.com, any browser extension allowed on kaiord.com
and anyone with access to the browser profile can read it; that it is sent to
the configured Provider and never to Kaiord; and that with cross-device sync on
a copy goes to the athlete's own Google Drive. None of them SHALL say the key
is sent only to the Provider or is protected by encryption.

#### Scenario: The policy discloses the key's storage

- **WHEN** `check-privacy-policy.mjs` runs over the policy
- **THEN** it SHALL fail unless the policy states the obfuscation, what can read the key, that it never goes to Kaiord, and the Google Drive copy
