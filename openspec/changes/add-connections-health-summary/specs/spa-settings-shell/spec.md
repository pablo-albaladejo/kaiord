## MODIFIED Requirements

<!-- MODIFIED FROM the ACTIVE sibling change add-settings-attention-model /
spa-settings-shell. The capability is not published under openspec/specs/ yet,
so the prior text lives in that change's delta. Whichever sync publishes this
capability MUST take the version below.

This change is not cosmetic: the prior requirement's gate is unreachable in
one half and ineffective in the other, and this change corrects the same
defect on the Connections section. Both surfaces count detected bridges, so
they are corrected together — leaving one behind would put a row saying
"0 of 5" one click from a section saying "3 of 5". -->

### Requirement: The connections row counts a total it can reach, once it can count

The Settings index row leading to the connection surfaces SHALL answer itself
with how many known bridges are answering in this browser, out of all known
bridges. It SHALL count detected bridges rather than live sessions, because at
least one bridge is never probed and a session count could therefore never
equal its own denominator — a counter fixed one short of completion reads as a
defect rather than as a state.

The count SHALL be described as detected rather than installed: a page cannot
enumerate installed extensions, only those that announced themselves and
answered this page-life.

The row SHALL render no value until bridge discovery has had the opportunity to
hear from the extensions, and SHALL apply the same gate as every other surface
counting detected bridges, so two surfaces counting the same thing cannot
disagree while both are settling.

The completion of a connection refresh pass SHALL NOT be treated as that
opportunity. Nothing asks the extensions anything — they announce themselves
when injected — so a pass over a browser where nothing has yet announced
completes almost immediately having sent no message, and a row gated on it
states a confident zero to a fully equipped reader for as long as discovery
actually takes.

The row SHALL NOT withhold its value indefinitely: once the grace period has
elapsed it SHALL state the count even when nothing was detected, because a
reader with no extensions installed has to be told so.

<!-- The prior requirement also said the row renders no value "when no bridge
is known at all, rather than a zero-of-zero count". That condition is removed:
the snapshot reader synthesises one row per known bridge from the first render,
so the empty list it guards cannot occur in the application. It was a guard on
an unreachable state standing next to the reachable one it was mistaken for. -->

#### Scenario: The row states detected out of known

- **GIVEN** discovery has settled and two of five known bridges answered
- **WHEN** the Settings index renders
- **THEN** the connections row SHALL state two of five detected

#### Scenario: The count reaches its denominator

- **GIVEN** every known bridge answered, including one that is never probed
- **WHEN** the Settings index renders
- **THEN** the connections row SHALL state the full count of detected bridges out of the same total

#### Scenario: A cold load claims nothing

- **GIVEN** discovery has just begun listening and no bridge has been detected
- **WHEN** the Settings index renders
- **THEN** the connections row SHALL render no count

#### Scenario: A detection answers immediately

- **GIVEN** at least one bridge has been detected, within the grace period
- **WHEN** the Settings index renders
- **THEN** the connections row SHALL state its count without waiting for the period to elapse

#### Scenario: An empty browser is eventually told so

- **GIVEN** no bridge was detected and the grace period has elapsed
- **WHEN** the Settings index renders
- **THEN** the connections row SHALL state that none of the known bridges were detected
