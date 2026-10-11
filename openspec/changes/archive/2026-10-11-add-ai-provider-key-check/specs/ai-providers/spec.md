## ADDED Requirements

### Requirement: Provider key check

`@kaiord/ai` SHALL export `verifyProviderKey(credential, fetch?)`, which checks an API key against the provider's list-models endpoint (Anthropic `GET /v1/models`, OpenAI `GET /v1/models`, Google `GET /v1beta/models`) and SHALL spend no tokens. It SHALL return `invalid` for a 401, and for a Google 400 whose body names `API_KEY_INVALID`; `valid` for a successful response; and `unverified` for a network failure or any other status, 403 included, since a restricted key or a disabled API answers 403 for a key that works. It SHALL never throw.

#### Scenario: A wrong key is invalid

- **GIVEN** the provider answers the list-models request with 401
- **WHEN** `verifyProviderKey` checks the key
- **THEN** it SHALL return `invalid`

#### Scenario: An outage is not a verdict

- **GIVEN** the request fails with a network error or a 5xx
- **WHEN** `verifyProviderKey` checks the key
- **THEN** it SHALL return `unverified`
