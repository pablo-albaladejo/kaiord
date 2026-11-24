## ADDED Requirements

### Requirement: The first time health data would go to a Provider, the athlete decides

Before a request that would carry the athlete's health data to a Provider
with no standing answer for it, the Kaiord App SHALL stop and show a notice
naming that Provider and each kind of health data the request can carry. It
SHALL offer three answers: send this time, always allow that Provider, and
don't send. No request SHALL reach the Provider while the notice waits. An
"always allow" or "don't send" answer SHALL be kept per Provider on this
device and SHALL NOT be asked again; it SHALL be changeable in Settings,
Privacy. A Provider with no answer of its own SHALL be asked for itself.

#### Scenario: First assistant message

- **GIVEN** an Anthropic key and no answer for Anthropic
- **WHEN** the athlete sends a message to the assistant
- **THEN** the notice SHALL name Anthropic and the kinds of health data the assistant can read, and no request SHALL reach Anthropic until the athlete answers

#### Scenario: A standing answer is not asked again

- **GIVEN** the athlete chose "always allow" for Anthropic
- **WHEN** they send another message
- **THEN** no notice SHALL show and the request SHALL go

#### Scenario: Another Provider asks for itself

- **GIVEN** an answer for Anthropic only
- **WHEN** the athlete's next request goes to OpenAI
- **THEN** the notice SHALL show for OpenAI

#### Scenario: The question holds an update

- **WHEN** the notice waits for an answer
- **THEN** the registry of unsaved work SHALL report unsaved work

#### Scenario: Stop while the notice waits

- **GIVEN** the notice waits for a chat turn, a generation or a lab document
- **WHEN** the athlete stops that run
- **THEN** the notice SHALL leave the screen unanswered, no request SHALL reach the Provider, and the run SHALL leave a Trace with outcome `stopped`

#### Scenario: A page closed while the notice waits

- **WHEN** the page is closed or reloaded while the notice waits for a run
- **THEN** the run's Trace SHALL already be stored with outcome `stopped`

#### Scenario: Two paths ask for one Provider at once

- **GIVEN** a chat turn and a generation both wait for an answer for OpenAI
- **WHEN** the athlete answers "always allow OpenAI" to the first
- **THEN** no second notice SHALL show and both requests SHALL go

### Requirement: "Don't send" withholds the health data on every path

With "don't send" for a Provider, the assistant's health tools SHALL answer
without health data and the replayed history SHALL leave out every assistant
reply from the first one whose turn read health data, stopped or not, or
whose record does not say (a reply stored or synced by an older build),
keeping the athlete's own messages; a generation SHALL go without the
heart-rate thresholds and zones; a lab document SHALL NOT be sent.

Text the model writes in a conversation that read health data SHALL count
as health data for every Provider it reaches. A workout the assistant
creates from a description written there SHALL go to the generation
Provider only under that Provider's own answer: asked when it has none,
created on yes, and not created on "don't send", with the athlete told in
their language and the model told, in fixed words, that the athlete chose
not to send health data to that Provider. A generation Provider that already
received that health data in the same turn needs no other answer.

#### Scenario: A stopped reply that read health

- **GIVEN** a turn that read the athlete's HRV and was stopped mid-reply
- **WHEN** the athlete later sends a message with "don't send" for the Provider
- **THEN** the stopped reply SHALL NOT be replayed

#### Scenario: A description written after a health read

- **GIVEN** a chat on Anthropic that read the athlete's HRV, and "don't send" for OpenAI, the generation Provider
- **WHEN** the athlete confirms the assistant's `create_workout`
- **THEN** no request SHALL reach OpenAI, the workout SHALL NOT be created, and the athlete SHALL be told why

#### Scenario: The assistant reads health

- **GIVEN** "don't send" for the Provider
- **WHEN** the model calls `query_health`
- **THEN** the tool result SHALL hold no health values and SHALL say the athlete chose not to share them

#### Scenario: A lab document

- **GIVEN** "don't send" for the lab-extraction Provider
- **WHEN** the athlete imports a lab document
- **THEN** no model SHALL be created and the App SHALL say the document was not sent

### Requirement: An inventory of where data goes, drawn from the flows

Settings, Privacy SHALL list every destination data can leave the device
for (each Provider, each Platform through its extension, intervals.icu,
Google Drive, Umami), the kinds of data each flow sends there and when, and
whether the destination is set up for this athlete now. The list SHALL be
rendered from the registry of data flows the code sends by, and a test SHALL
fail when a flow exists that the registry does not declare.

#### Scenario: An undeclared outbound call

- **WHEN** a source file calls an outbound primitive (including `window.fetch`, `globalThis.fetch` and a direct `generateText` / `streamText` / `generateObject` / `streamObject` call, in the App or in `@kaiord/ai`) and is not declared against a flow
- **THEN** the data-flow coverage test SHALL fail and name the file

#### Scenario: A health flow puts in a kind it does not declare

- **WHEN** the function that builds a health flow's content (the generation's athlete context, each chat tool's answer, a created workout's description) puts in a kind of data its flow does not declare
- **THEN** that function's test SHALL fail

#### Scenario: An origin no destination owns

- **WHEN** the App's content security policy allows a remote origin that no destination lists
- **THEN** the data-flow coverage test SHALL fail and name the origin
