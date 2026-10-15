## MODIFIED Requirements

### Requirement: WHOOP connect and disconnect via the bridge

The Connections page (`/connections`, see `spa-connections-page`) SHALL
treat WHOOP as a `bridge` provider: its card SHALL reflect the bridge's
discovered session status, and "Disconnect" SHALL clear the local WHOOP bridge
linkage, set the connection record to `disconnected`, and disable WHOOP's
`IntegrationPolicy` flows. No WHOOP credential SHALL be stored at any point.

A bridge provider SHALL NOT be offered a "Connect" action that opens the
provider's site: installing an extension cannot be done from the page, and
nothing captures a session as a result of the tab opening. Re-linking a WHOOP
the user disconnected SHALL be offered only while the extension is present.

#### Scenario: A present WHOOP bridge reflects its session status

- **WHEN** the WHOOP card renders and discovery/ping resolves
- **THEN** the card SHALL reflect the bridge session status, and SHALL offer no action that opens `app.whoop.com`

#### Scenario: Disconnect clears linkage and disables flows

- **WHEN** the user disconnects WHOOP
- **THEN** the local bridge linkage is cleared, the connection record is set to `disconnected`, and WHOOP's import flow policies are disabled
- **AND** no stored credential is left behind (none was ever stored)
