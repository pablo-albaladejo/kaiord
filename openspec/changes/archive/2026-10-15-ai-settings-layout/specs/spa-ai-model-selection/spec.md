## MODIFIED Requirements

### Requirement: Key-only provider credential

A provider configuration SHALL be addable with only provider type and API key; the label
SHALL be optional, and a blank label SHALL become the provider's name ("Anthropic"),
numbered from 2 when an account already carries it ("Anthropic 2"). A typed or renamed label
another account already carries SHALL be numbered the same way ("Work 2"), so no two
accounts share a label. The API key SHALL be stored without surrounding whitespace. The add/edit form SHALL
NOT collect or require a model. `LlmProviderConfig.model` SHALL be optional and deprecated,
and no inference path SHALL depend on it — the model used for any call SHALL come from a
model binding (see "Centralized per-purpose model resolution"), never from the credential
record. The outcome of the key check SHALL be stored with the account as `keyCheck`
(`valid` or `unverified`) whenever a key is saved.

#### Scenario: Add a provider without choosing a model

- **WHEN** the user submits the add-provider form with a type and an API key
- **THEN** the provider SHALL be saved and usable for AI features without any model having
  been selected on that form

#### Scenario: Provider form exposes no model control

- **WHEN** the user opens the add-provider or edit-provider form
- **THEN** no model-selection control SHALL be rendered on that form

#### Scenario: A blank label takes the provider's name

- **GIVEN** an Anthropic account labelled "Anthropic" exists
- **WHEN** the user adds two more Anthropic accounts without a label
- **THEN** they SHALL be labelled "Anthropic 2" and "Anthropic 3"

#### Scenario: A taken label is numbered

- **GIVEN** an account labelled "Work" exists
- **WHEN** the user adds an account labelled "Work", or renames another account to "Work"
- **THEN** that account SHALL be labelled "Work 2"

### Requirement: AI settings show the effective model and one main model

The athlete's main model SHALL be their `default` binding; the AI settings SHALL offer no
provider-level default (no "Default" badge, no "Set Default" action), and `isDefault` SHALL
remain only the resolver's fallback. Every model row SHALL be one select that chooses the
account and its model together (one option group per account, plus a custom id entry that
commits only a non-blank id), and SHALL display the effective resolution from
`resolveModelForPurpose`, never the first provider or the first catalog option. Models SHALL
be named by `modelDisplayName` from `@kaiord/ai/providers` ("Claude Sonnet 5", "GPT-5 mini"),
and the options SHALL come from `listedModels`, which leaves out a dated snapshot whose alias
is listed; a running model outside that list SHALL still be shown, by name and date. A
purpose without its own binding SHALL display "Same as main model (<model> · <account>)", and
choosing that option SHALL clear the purpose's binding. The Settings index SHALL name the
athlete's main model. The workout generator's model select SHALL be the same select for the
`workout_generation` purpose: it SHALL show what generation runs, and a choice there SHALL be
stored as the athlete's `workout_generation` binding.

#### Scenario: Rows show what runs before any choice

- **GIVEN** two accounts and no bindings, where the second carries `isDefault`
- **WHEN** the AI settings render
- **THEN** the main-model select SHALL show the second account with its model, and the chat
  select SHALL show that it follows the main model, naming that model and account

#### Scenario: A stored blank model is shown as what runs

- **GIVEN** a `chat` binding stored with `modelId: ""`
- **WHEN** the AI settings render
- **THEN** the chat select SHALL show the bound account's model, not a blank or first option

#### Scenario: Account and model are chosen together

- **WHEN** the athlete picks an option in a model select
- **THEN** the binding SHALL be written with that option's account and model in one write,
  and no write SHALL carry a blank model

#### Scenario: The generator shows and stores the model generation runs

- **GIVEN** an athlete whose main model runs on an account without `isDefault`
- **WHEN** the workout generator's model select renders
- **THEN** it SHALL show that main model and account, not the `isDefault` account
- **AND** choosing another model there SHALL store the `workout_generation` binding, which
  the AI settings then show

#### Scenario: Models are listed once, by name

- **WHEN** a model select lists an Anthropic account's models
- **THEN** it SHALL offer "Claude Haiku 4.5" once and SHALL NOT offer
  `claude-haiku-4-5-20251001`
- **AND** an athlete whose stored model is `claude-haiku-4-5-20251001` SHALL see it selected
  as "Claude Haiku 4.5 (2025-10-01)"

### Requirement: Provider keys are not shown back and removal is confirmed

A provider row SHALL show only the last four characters of its key behind a mask, and only
the mask when the key is four characters or shorter, next to the key status: "verified" when
the provider accepted the key, "not checked" when it could not be reached or the check was
never recorded, and "missing" when the account has no key. "Replace key" SHALL open an empty
key field, and the stored key SHALL never be rendered into the DOM. Renaming and removing
SHALL live in the row's overflow menu; removing SHALL ask for confirmation naming the
provider, and cancelling SHALL keep it.

#### Scenario: The key is masked

- **GIVEN** a provider whose key ends in `abcd`
- **WHEN** its row renders, and when its key is being replaced
- **THEN** the row SHALL show `••••abcd`, the key field SHALL be empty, and the full key SHALL
  appear nowhere in the page

#### Scenario: A short key shows only the mask

- **GIVEN** a provider whose whole key is `abcd`
- **WHEN** its row renders
- **THEN** the row SHALL show `••••` and `abcd` SHALL appear nowhere in the page

#### Scenario: Removal is confirmed

- **WHEN** the athlete chooses Remove in a provider's overflow menu
- **THEN** a dialog SHALL ask to confirm, and the provider SHALL be removed only on confirm

#### Scenario: The key status is stated

- **GIVEN** an account whose key the provider could not be reached to check
- **WHEN** its row renders, after a reload
- **THEN** the row SHALL say the key was not checked

## ADDED Requirements

### Requirement: AI settings lead with the athlete's assistant

The AI settings SHALL open with a card titled "Your assistant (for <athlete>)" naming the
active athlete's main model, the account it runs on, that account's key status, and this
month's AI use (requests, tokens, estimated cost) — labelled as the total for every athlete,
since usage is not recorded per athlete — with the main-model select. The card and the usage
table SHALL format costs the same way, as US dollars in the reader's locale. The accounts
SHALL follow under "AI accounts", stated as shared by every athlete; the add form SHALL be
shown only after "Add account" is pressed, SHALL close once the key is stored, and SHALL
reopen blank. The per-task models SHALL sit under "Advanced: model per task (for <athlete>)",
collapsed while every task follows the main model and open as soon as one has its own. The
custom instructions SHALL be saved after a pause in typing or when the field is left, never
on each keystroke, and SHALL say whether they were saved: "Saved ✓" only once nothing newer
waits to be saved, and a failed save SHALL be retried when the field is left again. Opening
the add form SHALL put the focus on the provider choice, and confirming a removal SHALL leave
the focus on "Add account". On a 390px-wide screen no part of an account row SHALL overflow it
or run beneath its buttons, and the usage table SHALL fit the screen.

#### Scenario: The assistant card states what the athlete uses

- **GIVEN** the athlete Ana whose main model is Claude Opus 5 on "Mi Claude", whose key was
  verified, and two AI runs this month
- **WHEN** the AI settings render
- **THEN** the card SHALL read "Your assistant (for Ana)", name "Claude Opus 5" on
  "Mi Claude" with "Key verified", and sum the two runs' tokens and cost as the total for
  every athlete

#### Scenario: The add form closes and reopens blank

- **WHEN** the athlete adds an OpenAI account whose key cannot be checked
- **THEN** the form SHALL close, and reopening it SHALL show the first provider type, empty
  fields and no message from the previous add

#### Scenario: Per-task models open when one is set

- **GIVEN** the athlete has a `lab_extraction` binding of its own
- **WHEN** the AI settings render
- **THEN** the "Advanced: model per task" section SHALL be open

#### Scenario: Instructions are not written per keystroke

- **WHEN** the athlete types into the custom instructions and leaves the field
- **THEN** no write SHALL happen while typing, one write SHALL happen on leaving, and
  "Saved ✓" SHALL be shown
