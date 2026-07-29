## MODIFIED Requirements

<!-- MODIFIED FROM openspec/specs/athlete-connections/spec.md / Requirement:
     "Connection state is tracked independently of integration policies". The
     full prior block is reproduced below with two changes. The prior scenario
     "No record yet for a supported provider" asserted that an absent record
     renders as `disconnected`; that was never reachable for a bridge, because
     `connect(providerId, "bridge", …)` is called from nowhere and the only
     `"bridge"` call site on the provider is disconnect, so a bridge record can
     only be `disconnected` or absent. Applying the prior scenario would have
     rendered every working bridge as disconnected forever. Second, the record
     was previously write-only — nothing read it — so disconnecting a bridge
     changed no displayed state. It is now a read signal. -->

### Requirement: Connection state is tracked independently of integration policies

The system SHALL persist a per-`(profileId, providerId)` connection record whose
status is one of `connected`, `disconnected`, or `not-supported`, and SHALL
derive the connection UI state from that record rather than inferring it from
whether any `IntegrationPolicy` is enabled.

For a `bridge` provider the record SHALL be combined with extension discovery
rather than consulted alone: the provider is connected iff its extension is
discovered AND its record does not say `disconnected`. An absent record SHALL be
read as "never disconnected", not as "not connected", so a provider the user has
never explicitly unlinked is presented from what the extension is actually
doing. For an `api-key` provider a record saying `connected` SHALL remain
required, because connecting one writes that record.

Every surface that displays a provider's connection state SHALL apply this same
rule, so two surfaces cannot describe the same provider differently.

#### Scenario: No record yet for a supported provider

- **WHEN** the UI renders a supported provider that has no stored connection record
- **THEN** the absence is read as "never disconnected", not as "not connected"
- **AND** the provider's state follows its mechanism's rule, stated in the two scenarios below

#### Scenario: No record yet for a discovered bridge provider

- **WHEN** the UI renders a bridge provider whose extension is discovered and which has no stored connection record
- **THEN** the provider is shown as connected
- **AND** its data-flow toggles are still not treated as evidence of the account link

#### Scenario: No record yet for an api-key provider

- **WHEN** the UI renders an api-key provider with no stored connection record
- **THEN** the provider is shown as disconnected

#### Scenario: Stored connected record

- **WHEN** a provider has a connection record with status `connected`
- **THEN** the provider is shown as `connected` regardless of how many of its flow policies are enabled

#### Scenario: Disconnecting a bridge is visible

- **GIVEN** a bridge provider whose extension remains discovered
- **WHEN** the user disconnects it and the record is written as `disconnected`
- **THEN** the provider is no longer shown as connected on any surface that displays its state

#### Scenario: Re-linking clears the disconnected state

- **GIVEN** a bridge provider with a `disconnected` record whose extension is discovered
- **WHEN** the user reconnects it
- **THEN** a `connected` record is written and the provider is shown as connected again
