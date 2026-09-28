## ADDED Requirements

### Requirement: Guides linked

The landing page SHALL link the athlete guides of the docs site from a "Guides for athletes" section. The Spanish page SHALL link the Spanish version of each guide. `llms.txt` SHALL list each guide, English and Spanish, as `- [Name](https://kaiord.com/docs/...): description`.

#### Scenario: English page links the English guides

- **WHEN** a visitor opens `https://kaiord.com/`
- **THEN** the guides section links `https://kaiord.com/docs/guide/<slug>` for each of the four guides

#### Scenario: Spanish page links the Spanish guides

- **WHEN** a visitor opens `https://kaiord.com/es/`
- **THEN** the guides section links `https://kaiord.com/docs/es/guide/<slug>` for each of the four guides
