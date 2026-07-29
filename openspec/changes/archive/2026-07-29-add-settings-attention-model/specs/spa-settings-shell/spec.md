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

### Requirement: The shell counts exactly what the Connections section marks

The shell SHALL derive its attention model from the same per-source status the
Connections section renders its cards from, and SHALL count a source as needing
attention when — and only when — that status is the attention one. It SHALL NOT
carry a second predicate over the raw connection rows: a summary that can
disagree with the surface it summarises is worse than no summary, and the
card-status derivation already resolves the cases a naive rule gets wrong.

Those cases are the reason the rule is not "present but no session": a source
that is never session-probed reads as installed rather than broken, one whose
first probe has not answered reads as being checked, and one the user unlinked
or whose extension is not running reads as available. None of them is a fault
to announce.

The model SHALL name how many sources are affected and SHALL NOT name which
ones, so no source name is interpolated into the announcement.

#### Scenario: An affected source is counted

- **GIVEN** a source whose card is marked as needing attention
- **WHEN** the attention model is derived
- **THEN** that source SHALL be counted, and the count SHALL equal the number of such cards

#### Scenario: An unprobed present source is not attention

- **GIVEN** a source that is never session-probed, and therefore reports no session and no error
- **WHEN** the attention model is derived
- **THEN** it SHALL NOT be counted as needing attention

#### Scenario: A source awaiting its first answer is not attention

- **GIVEN** a probed source whose first probe has not recorded an answer
- **WHEN** the attention model is derived
- **THEN** it SHALL NOT be counted, because not knowing is not the same as broken

#### Scenario: An absent or unlinked source is not attention

- **GIVEN** a source the user unlinked, or whose extension is not running
- **WHEN** the attention model is derived
- **THEN** it SHALL NOT be counted as needing attention

#### Scenario: No affected source produces no model

- **GIVEN** no source is marked as needing attention
- **WHEN** the attention model is derived
- **THEN** the model SHALL be absent and both slots SHALL render nothing

### Requirement: The consequence line is ranked by what the reader can act on

The attention model's consequence line SHALL be derived from state that
survives a page reload or from the connection's own reported cause, and SHALL
prefer a cause the reader can act on over one they can only read. A demand to
sign in again and an extension speaking an unsupported protocol version each
name their own fix, and each routinely coexists with a recorded last-sync time,
so both SHALL outrank the date.

An unsupported protocol version SHALL NOT be reported as a session problem: the
probe succeeded and produced a diagnosis, and signing in again would fix
nothing, so the line SHALL say the extension is out of date.

Every remaining affected source is a reachable extension without a usable
session, so the line SHALL describe it as signed out — the same verdict its
card states — and SHALL NOT claim that a credential expired or that the check
itself failed. Only one bridge's probe distinguishes an expired credential from
one that was never issued, and no probe reports a failure the card calls a
session problem.

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

- **GIVEN** an affected source whose probe answered with an unsupported protocol version
- **WHEN** the consequence line is built
- **THEN** it SHALL state that an extension is out of date, and SHALL NOT tell the user to sign in

#### Scenario: Several affected sources state the cause, not a date

- **GIVEN** more than one source needs attention and none reports an actionable cause
- **WHEN** the consequence line is built
- **THEN** it SHALL state that the session is signed out and SHALL NOT state a date belonging to one of them

#### Scenario: An unusable timestamp is ignored

- **GIVEN** an affected source whose recorded last-sync value does not parse as a date
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
