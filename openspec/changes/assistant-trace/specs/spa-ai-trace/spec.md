## ADDED Requirements

### Requirement: Every run of the assistant leaves one Trace on the device

The Kaiord App SHALL write exactly one Trace per run of the assistant: a chat turn (from the athlete's message to the reply, across any action they confirm or refuse), a workout generation, a batch of generations, and a lab document read that reaches the Provider. A Trace SHALL hold when the run started and finished, its feature, its latency, its outcome (`ok`, `failed`, `stopped`), the number of requests and retries, the versioned prompt unit of each model call, each Tool called with its confirmation (`athlete`, `automatic`, `not_needed`) and result (`ok`, `refused`, `failed`, `unanswered`), `priceRun`'s `RunCost` for each model reached, the total cost or null when unknown, and, per Provider, the kinds of data from the data-flow registry the App put in the run's requests, with apart the kinds it may have carried but cannot count (health data replayed replies may quote, or a description the assistant wrote after reading it may hold). A run waiting on the athlete's health answer SHALL already be stored with outcome `stopped`, replaced when it finishes. It SHALL NOT hold a message, prompt, document or model answer, and its schema SHALL be strict.

#### Scenario: A generation's Trace

- **WHEN** a workout is generated with one invalid attempt and one valid one on a priced model
- **THEN** one Trace SHALL be stored with two requests, one retry, the agent's prompt unit, the summed cost and the generation's kinds sent to the Provider

#### Scenario: A page closed while the health notice waits

- **WHEN** the page is reloaded while a run waits on the health notice
- **THEN** that run's Trace SHALL be stored with outcome `stopped`

#### Scenario: A batch is one run

- **WHEN** a batch generates several workouts
- **THEN** one Trace SHALL be stored holding every generation's requests

#### Scenario: A confirmed action belongs to its turn

- **GIVEN** a chat turn that pauses on an action
- **WHEN** the athlete confirms it and the turn completes
- **THEN** one Trace SHALL be stored, listing the Tool as confirmed by the athlete with its result

### Requirement: The Trace never leaves the device

The `traces` store SHALL be device-local: left out of the cloud sync snapshot, never written by a snapshot import, and excluded from a backup file and from a backup import.

#### Scenario: Not in the sync snapshot nor a backup

- **WHEN** a sync snapshot or a backup file is exported from a device holding Traces
- **THEN** neither SHALL carry the `traces` table or any Trace

### Requirement: Traces are kept bounded and the athlete can delete them

After each write the App SHALL keep the newest 200 Traces and delete any started more than 90 days ago. Settings, Privacy SHALL offer to delete every Trace after a confirmation.

#### Scenario: Retention

- **WHEN** a Trace is written and 203 are stored
- **THEN** the 200 newest SHALL remain

### Requirement: The athlete reads and exports the Traces

Settings, Privacy SHALL list the Traces newest first (feature, time, outcome, cost), open each one with all it holds, and export them all as one JSON file of format `kaiord-traces`, version 1. The data-flow inventory SHALL list the Traces as kept on this device. All copy SHALL come from the `en` and `es` dictionaries, naming it "Trace" and "Traza".

#### Scenario: Read and export against a stubbed Provider

- **WHEN** the athlete chats once against a stubbed Provider and opens Settings, Privacy
- **THEN** one Trace SHALL be listed, open with its Provider, model and the kinds sent, and export as a JSON file holding it and not the message text, in English and in Spanish, AND no request the App makes SHALL carry the Trace
