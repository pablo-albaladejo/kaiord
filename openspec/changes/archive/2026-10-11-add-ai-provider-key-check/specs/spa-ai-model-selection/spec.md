## ADDED Requirements

### Requirement: Key checked on save

Settings → AI SHALL check a provider's key with `verifyProviderKey` before saving it. A key the provider rejects SHALL NOT be saved: the form SHALL keep the input and show an alert. A key that could not be checked SHALL be saved with a note saying so. Editing a provider SHALL re-check the key only when the key changed. Model pickers SHALL name the model beside the provider label only when the model is known, never as empty parentheses.

#### Scenario: A rejected key is not saved

- **GIVEN** the provider answers the key check with 401
- **WHEN** the user adds the provider
- **THEN** no provider SHALL be stored and the form SHALL show that the provider rejected the key

#### Scenario: An unverified key is saved with a note

- **GIVEN** the key check cannot reach the provider
- **WHEN** the user adds the provider
- **THEN** the provider SHALL be stored and the form SHALL say the key could not be checked
