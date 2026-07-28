## ADDED Requirements

### Requirement: Settings rows declare a live value key

Each row of the Settings index SHALL optionally declare a `valueKey` naming a
live value, and a single hook SHALL resolve every declared key to a display
string or to `undefined`. The set of legal keys SHALL be a closed union, so a row
naming an unresolved value and a resolved value no row declares are both
compile-time errors. The list component SHALL NOT read any data source directly;
it SHALL index the resolved values by the row's key.

#### Scenario: A row renders its resolved value inline

- **GIVEN** the Settings index and a row declaring the `provider` value key
- **WHEN** the list renders
- **THEN** the row SHALL display the default AI provider's label beside its own label

#### Scenario: A row without a value key renders no value

- **GIVEN** a row that declares no `valueKey`
- **WHEN** the list renders
- **THEN** the row SHALL render its label and chevron only, with no value slot

#### Scenario: An unresolved value renders nothing rather than a placeholder

- **GIVEN** a row whose value hook returns `undefined` because its source is still loading
- **WHEN** the list renders
- **THEN** the row SHALL render no value text, and SHALL NOT render a spinner, a dash or an empty-string placeholder

### Requirement: One usage read serves both the Usage tab and the index row

The `usageEvents` query SHALL live in exactly one hook, parameterised by how many
recent months it reads, and both the Settings → Usage tab and the Settings index
usage row SHALL consume it. The hook SHALL return the year-month keys it queried
alongside the raw events, most recent month first, so each caller folds them for
its own surface. Events SHALL be `undefined` while the live query resolves, and
callers SHALL treat that as loading rather than as absence of usage.

#### Scenario: The tab and the row fold the same events

- **GIVEN** the usage log holds events for the current month
- **WHEN** the Usage tab and the Settings index both render
- **THEN** both SHALL derive their totals from the same hook, the tab over its six-month window and the row over the current month only

#### Scenario: The index row summarises the current month

- **GIVEN** the current month folded to 1,214,880 tokens
- **WHEN** the Settings index renders the usage row
- **THEN** the row SHALL display the total in compact notation with the month name, e.g. "1.2M tokens · July"

#### Scenario: A month with no usage renders no value

- **GIVEN** the current month has no usage events
- **WHEN** the Settings index renders the usage row
- **THEN** the row SHALL render no value, rather than a zero total

### Requirement: Preferences values mirror the preferences panel

The units, language and notification values on the Settings index SHALL be
derived from the same per-profile preferences read the Preferences panel uses,
including its fallback to the defaults when no profile is active. A `language`
preference of `auto` SHALL be resolved to the display name of the locale actually
in effect, never rendered as the literal `auto`. The notification value SHALL
reflect both the stored intent and the browser permission, so a row can never
claim notifications are on while the browser is blocking them.

#### Scenario: No active profile falls back to the defaults

- **GIVEN** no active profile, so the preferences read resolves to `undefined`
- **WHEN** the Settings index renders
- **THEN** the units row SHALL read "Metric" and the notifications row SHALL read "Off"

#### Scenario: An automatic language resolves to a display name

- **GIVEN** a stored language preference of `auto` and an active locale of English
- **WHEN** the Settings index renders the language row
- **THEN** the row SHALL display "English"

#### Scenario: A blocked browser permission overrides the stored intent

- **GIVEN** notifications enabled in preferences and a denied browser permission
- **WHEN** the Settings index renders the notifications row
- **THEN** the row SHALL display "Blocked", not "On"

#### Scenario: Notifications read on only when both agree

- **GIVEN** notifications enabled in preferences and a granted browser permission
- **WHEN** the Settings index renders the notifications row
- **THEN** the row SHALL display "On"

### Requirement: The cross-device sync row reports the live sync engine

The sync row's value SHALL be read from the app-wide sync engine, so it tracks
connect, disconnect and every completed cycle without a second source of truth.
A disconnected account SHALL render as not connected; a connected account that
has never completed a cycle SHALL say so explicitly; a connected account with a
completed cycle SHALL render the destination and the time of that cycle in
relative form.

#### Scenario: A disconnected account says so

- **GIVEN** no Google account connected for sync
- **WHEN** the Settings index renders the sync row
- **THEN** the row SHALL display "Not connected"

#### Scenario: A connected account that never synced is not reported as synced

- **GIVEN** a connected account whose last successful sync is absent
- **WHEN** the Settings index renders the sync row
- **THEN** the row SHALL display "Connected — not synced yet", and SHALL NOT display a relative time

#### Scenario: A completed cycle renders relatively

- **GIVEN** a connected account whose last successful sync was five minutes ago
- **WHEN** the Settings index renders the sync row
- **THEN** the row SHALL display "Drive · 5m ago"

### Requirement: The Settings index is grouped into four user-shaped groups

The Settings index SHALL present its rows in exactly four groups — Your data, AI,
Preferences and About — named for what the user came to change rather than for
the implementation behind it. Every route reachable from the previous grouping
SHALL remain reachable from the new one, and every row SHALL keep its stable key,
which is simultaneously its i18n key, its React key and its test id. Group labels
that no longer name a group SHALL be removed from every locale catalog only after
confirming no surface reads them.

#### Scenario: Every group eyebrow renders

- **GIVEN** the Settings index
- **WHEN** it renders
- **THEN** it SHALL render the four eyebrows "Your data", "AI", "Preferences" and "About"

#### Scenario: Legacy rows stay reachable

- **GIVEN** the Extensions and Data Hub rows, demoted into "Your data"
- **WHEN** the user activates either
- **THEN** navigation SHALL reach `/settings/extensions` and `/settings/data-hub` respectively, from row test ids `settings-row-extensions` and `settings-row-dataHub`

#### Scenario: The Connections row has an interim destination

- **GIVEN** that the dedicated connections page does not exist yet
- **WHEN** the user activates the Connections row
- **THEN** navigation SHALL reach `/athlete`, and the row definition SHALL carry a comment naming the wave that re-points it

#### Scenario: Deep links keep their entry point

- **GIVEN** the "Manage your data" row
- **WHEN** the user activates it
- **THEN** navigation SHALL reach `/settings/privacy?section=data-management` and the target section SHALL take focus

### Requirement: A settings row can be flagged as needing attention

A settings row SHALL accept an optional attention status that renders a visual
marker between the row's value and its chevron. The marker SHALL be absent unless
the status is set explicitly, so no row is marked by default. The status SHALL be
purely presentational in this capability: nothing computes it, and no data source
is mounted to derive it.

#### Scenario: An attention row renders the marker

- **GIVEN** a settings row rendered with the attention status
- **WHEN** it renders
- **THEN** it SHALL render an attention marker addressable as `settings-row-<key>-attention`

#### Scenario: A row without a status renders no marker

- **GIVEN** a settings row rendered without a status
- **WHEN** it renders
- **THEN** no attention marker SHALL be present

### Requirement: Storage copy states only what is encrypted

User-visible copy about data protection SHALL describe only the protection that
exists. Local records are held unencrypted in the browser's database; encryption
applies to the cross-device sync snapshot before upload, and only when the user
has enabled it with a passphrase. The Settings surfaces SHALL NOT claim
encryption at rest for stored records, and any control that offers encryption
SHALL name what it encrypts.

#### Scenario: The privacy row describes local storage truthfully

- **GIVEN** the Privacy & data row on the Settings index
- **WHEN** it renders its value
- **THEN** the value SHALL describe where the data lives — "Stored in this browser" — and SHALL NOT claim the stored records are encrypted

#### Scenario: The encryption control names its object

- **GIVEN** the encryption toggle in the cross-device sync panel
- **WHEN** its label renders
- **THEN** the label SHALL identify sync snapshots as what is encrypted, rather than reading as a blanket encryption claim

### Requirement: External settings destinations open in a new tab

A settings row SHALL be able to point at an external destination instead of an
in-app route. Such a row SHALL render as a link that opens in a new browsing
context with `rel="noopener noreferrer"`, SHALL keep the same body, chevron and
test id as an in-app row, and SHALL NOT be handed to the in-app router.

#### Scenario: The docs row is an external link

- **GIVEN** the "Help & docs" row in the About group
- **WHEN** the Settings index renders
- **THEN** the row SHALL be an anchor to the documentation site carrying `target="_blank"` and `rel="noopener noreferrer"`

#### Scenario: In-app rows are unaffected

- **GIVEN** a row declaring an in-app destination
- **WHEN** the user activates it
- **THEN** the in-app router SHALL handle the navigation and no new browsing context SHALL open
