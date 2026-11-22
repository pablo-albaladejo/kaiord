## MODIFIED Requirements

### Requirement: Differentiators section

The landing page SHALL include a differentiators section with ONE prominent card and ONE demoted line:

1. **Zero infrastructure** (prominent card, "No servers. No accounts. No cloud."): everything runs locally or in-browser with no servers, accounts, or cloud dependencies — CLI converts files on your machine, the SPA editor runs in the browser, the MCP server integrates with local AI tools. The card SHALL include chips: CLI, SPA editor, MCP, Browser extension.
2. **AI-coded** (single demoted line, NOT a full card): "Every line — domain, adapters, editor, this page — written by AI agents." followed by a "See the commits →" link to the commit history and a "How it is built →" link to the method note at `/docs/project/how-kaiord-is-built` ("Cómo se construye (en inglés) →" on the Spanish page).

#### Scenario: Differentiators display

- **WHEN** a user scrolls to the differentiators section
- **THEN** the prominent "Zero infrastructure" card SHALL be visible with its chips, followed by a single demoted AI-coded line with a "See the commits" link to the commit history and a "How it is built" link to the method note
