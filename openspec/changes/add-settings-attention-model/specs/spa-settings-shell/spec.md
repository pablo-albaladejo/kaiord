## RENAMED Requirements

<!-- The prior name states a precondition this change removes: something
computes attention now. The requirement itself survives, restated below. -->

- FROM: `### Requirement: Attention slots render nothing until something computes attention`
- TO: `### Requirement: Attention slots render one model, or nothing`

## MODIFIED Requirements

<!-- MODIFIED FROM the ACTIVE sibling change add-settings-split-shell /
spa-settings-shell. The capability is not published under openspec/specs/ yet,
so the prior text lives in that change's delta. Its scenario "The shell renders
no attention today" is superseded here. Whichever sync publishes this
capability MUST take the version below. -->

### Requirement: Attention slots render one model, or nothing

The shell SHALL carry two attention surfaces — a banner above the content and a
chip at the top of the rail — fed by an attention model that MAY be absent. An
absent model SHALL render nothing at all: no container, no placeholder and no
skeleton.

The two surfaces SHALL render the same model and SHALL NOT both render it. The
index SHALL carry the banner and an open section SHALL carry the chip, so one
screen never states the same consequence twice.

Because the model is derived from state that arrives asynchronously, a surface
appears after its page has rendered and can appear again later. Each surface
SHALL therefore be a polite live region, so it announces itself rather than
waiting to be found, and each line SHALL carry its own full text where the
layout may truncate it.

The banner SHALL carry the model's action when it declares one; the chip SHALL
NOT, being a summary rather than a control. A model MAY decline to declare an
action, and SHALL do so while no surface can act on the attention it reports.

#### Scenario: No attention renders no surface

- **GIVEN** an absent attention model
- **WHEN** either slot renders
- **THEN** no element SHALL be rendered for that slot

#### Scenario: A supplied model renders its consequence

- **GIVEN** an attention model naming what broke and its consequence
- **WHEN** the banner renders
- **THEN** both lines SHALL be displayed, and the model's action SHALL be invocable

#### Scenario: The chip omits the action

- **GIVEN** an attention model declaring an action
- **WHEN** the chip renders
- **THEN** the action SHALL NOT be rendered

#### Scenario: The index announces attention on the banner

- **GIVEN** a connection that needs attention
- **WHEN** the Settings index renders
- **THEN** the banner SHALL state the consequence and the chip SHALL NOT be present

#### Scenario: An open section announces attention on the rail

- **GIVEN** a connection that needs attention
- **WHEN** a section is open
- **THEN** the chip SHALL state the consequence and the banner SHALL NOT be present

#### Scenario: An appearing surface announces itself

- **WHEN** either surface renders its model
- **THEN** it SHALL be a polite live region, so its arrival is announced to assistive technology

## ADDED Requirements

### Requirement: Attention is derived from failure, never from an absent session

The shell SHALL derive its attention model from the unified bridge connection
model, and SHALL treat a connection as needing attention when its last probe
reported an error OR when it demands re-authorisation. An installed bridge that
holds no live session SHALL NOT by itself need attention.

This rule is forced by the probe set, not chosen for taste: a bridge with no
registered session prober is reported as discovered with no session and no
error, permanently, so a session-shaped rule would report it as broken for as
long as it stays installed. A bridge the user has simply signed out of is a
state, not a fault.

The model SHALL name how many connections are affected and SHALL NOT name which
ones, so no source name is interpolated into the announcement.

#### Scenario: A failed probe needs attention

- **GIVEN** a connection whose last probe reported an error
- **WHEN** the attention model is derived
- **THEN** that connection SHALL be counted as needing attention

#### Scenario: A re-authorisation demand needs attention

- **GIVEN** a connection that reports it must be signed in again
- **WHEN** the attention model is derived
- **THEN** that connection SHALL be counted as needing attention

#### Scenario: An unprobed installed bridge is not attention

- **GIVEN** an installed bridge that has no session prober, and therefore reports no session and no error
- **WHEN** the attention model is derived
- **THEN** it SHALL NOT be counted as needing attention

#### Scenario: No affected connection produces no model

- **GIVEN** every known connection reports no error and no re-authorisation demand
- **WHEN** the attention model is derived
- **THEN** the model SHALL be absent and both slots SHALL render nothing

### Requirement: The consequence line is ranked by what the reader can act on

The attention model's consequence line SHALL be derived from state that
survives a page reload or from the connection's own reported cause, and SHALL
prefer a cause the reader can act on over one they can only read. A demand to
sign in again and an extension speaking an unsupported protocol version each
name their own fix, and each routinely coexists with a recorded last-sync time,
so both SHALL outrank the date.

An unsupported protocol version SHALL NOT be reported as a failed check: the
probe succeeded and produced a diagnosis, so the line SHALL say the extension
is out of date.

A re-authorisation demand SHALL be described as a signed-out session rather
than as an expired credential, because only one bridge's probe distinguishes
the two and the others cannot tell an expired token from a session that never
existed.

The time of the last probe SHALL NOT be presented as the time a source broke,
and no duration of breakage SHALL be stated, because no transition timestamp is
recorded anywhere. A date SHALL be attached only when exactly one connection is
affected, so one source's date is never presented as a set's, and it SHALL be
the reader's calendar day rather than the UTC one.

#### Scenario: A single affected source dates its consequence

- **GIVEN** exactly one connection needs attention, it has a recorded last-sync time, and it reports no actionable cause
- **WHEN** the consequence line is built
- **THEN** it SHALL state that no new data has arrived since that date, in the reader's own calendar day

#### Scenario: A sign-in instruction outranks the date

- **GIVEN** an affected connection demanding re-authorisation that also has a recorded last-sync time
- **WHEN** the consequence line is built
- **THEN** it SHALL state that the session is signed out, and SHALL NOT state that a credential expired

#### Scenario: An outdated extension is told to update

- **GIVEN** an affected connection whose probe answered with an unsupported protocol version
- **WHEN** the consequence line is built
- **THEN** it SHALL state that an extension is out of date, and SHALL NOT state that the check failed

#### Scenario: Several affected sources state the cause, not a date

- **GIVEN** more than one connection needs attention and none reports an actionable cause
- **WHEN** the consequence line is built
- **THEN** it SHALL state that the last check failed and SHALL NOT state a date

#### Scenario: An unusable timestamp is ignored

- **GIVEN** an affected connection whose recorded last-sync value does not parse as a date
- **WHEN** the consequence line is built
- **THEN** the date SHALL be omitted rather than rendered as an invalid value

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

The row SHALL render no value until the connection store has completed a
refresh pass. Every row exists from the first render and reads undiscovered
until then, because nothing has been asked yet — a count rendered from that
state would be wrong rather than merely early. The row SHALL likewise render no
value when no bridge is known at all, rather than a zero-of-zero count.

#### Scenario: The row states detected out of known

- **GIVEN** the store has completed a pass and two of five known bridges answered
- **WHEN** the Settings index renders
- **THEN** the connections row SHALL state two of five detected

#### Scenario: The count reaches its denominator

- **GIVEN** every known bridge answered, including one that is never probed
- **WHEN** the Settings index renders
- **THEN** the connections row SHALL state the full count of detected bridges out of the same total

#### Scenario: A cold load claims nothing

- **GIVEN** the connection store has not completed a refresh pass
- **WHEN** the Settings index renders
- **THEN** the connections row SHALL render no count

### Requirement: The connection store runs for the session, not for a page

The connection store SHALL be started once per application boot by the app's
store hydration, not by the surface that renders it. A store bound to a page
would restart on every visit and re-probe every bridge, defeating the positive
cache, the poll interval and the visibility floor that the store's lifecycle
owns.

The store SHALL expose whether a refresh pass has completed, and SHALL notify
its subscribers when the first pass completes even if no row changed, so a
consumer can distinguish "not asked yet" from "not there".

#### Scenario: Hydration starts the connection store

- **WHEN** the application hydrates its stores
- **THEN** the bridge connection store SHALL be started

#### Scenario: The store outlives the settings surface

- **WHEN** the surface that renders connection state unmounts
- **THEN** the connection store SHALL keep running for the rest of the session

#### Scenario: The first pass is announced even when nothing changed

- **GIVEN** a refresh pass over a browser where no bridge is present, so every row keeps its default
- **WHEN** the pass completes
- **THEN** subscribers SHALL be notified, and the store SHALL report that a pass has completed
