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

### Requirement: "Don't send" withholds the health data on every path

With "don't send" for a Provider, the assistant's health tools SHALL answer
without health data and the replayed history SHALL leave out earlier answers
of a turn that read it; a generation SHALL go without the heart-rate
thresholds and zones; a lab document SHALL NOT be sent.

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

- **WHEN** a source file calls an outbound primitive and is not declared against a flow
- **THEN** the data-flow coverage test SHALL fail and name the file

#### Scenario: An origin no destination owns

- **WHEN** the App's content security policy allows a remote origin that no destination lists
- **THEN** the data-flow coverage test SHALL fail and name the origin
