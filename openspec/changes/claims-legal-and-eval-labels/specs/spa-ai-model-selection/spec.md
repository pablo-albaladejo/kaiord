## ADDED Requirements

### Requirement: A model with no passing eval result is labelled not evaluated

`@kaiord/ai/providers` SHALL list the models with a passing result in the
eval results the repository stores (`EVALUATED_MODELS`), and a test SHALL
tie that list to the stored results. Wherever the Kaiord App offers or shows
a model (the model selects, "Same as main model" and "Runs …", the assistant
card, the Settings index, the coaching progress, the usage table), a model
not in that list SHALL be named with "(not evaluated)" in English and
"(no evaluado)" in Spanish. A Provider's default SHALL be labelled the same
way when it has not passed.

#### Scenario: The athlete chooses Google's default

- **WHEN** the athlete opens a model select with a Google account
- **THEN** `gemini-2.5-flash` SHALL read "Gemini 2.5 Flash (not evaluated)" ("Gemini 2.5 Flash (no evaluado)" in Spanish)

#### Scenario: An evaluated model

- **WHEN** a model has a passing stored eval result
- **THEN** it SHALL be named without the label
