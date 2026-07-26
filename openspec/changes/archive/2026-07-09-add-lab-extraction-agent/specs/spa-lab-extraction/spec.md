## ADDED Requirements

### Requirement: Import a lab report from a document

The labs entry tab SHALL offer an import-from-document affordance accepting
`application/pdf`, `image/jpeg`, `image/png`, and `image/webp` files up to
10MB, which runs the `lab-extractor` agent against the document using the
user's own provider credentials (purpose `lab_extraction`, browser mode).
The affordance SHALL be disabled with an explanatory hint when no AI
provider is configured, SHALL show progress while extraction runs, and
SHALL allow cancelling an in-flight extraction.

#### Scenario: No provider configured

- **GIVEN** a profile with no AI provider configured
- **WHEN** the user opens the labs entry tab
- **THEN** the import affordance SHALL be disabled with a hint pointing to AI settings, and manual entry SHALL remain fully usable

#### Scenario: Extraction failure surfaces

- **GIVEN** a configured provider whose model rejects the document
- **WHEN** extraction fails
- **THEN** the user SHALL see an error message naming the resolved model, the form SHALL remain empty, and nothing SHALL be persisted

### Requirement: Extraction drafts are reviewed before saving

Extraction SHALL produce a draft that pre-fills the existing V1 entry form
(header fields and parameter rows) under a visible AI-draft banner, and
nothing SHALL be persisted until the user explicitly saves. The user SHALL
be able to edit any field, remove rows, add rows, or discard the entire
draft; saving SHALL go through the existing transactional save use case.

#### Scenario: Review happy path

- **GIVEN** a completed extraction of a document with recognizable parameters
- **WHEN** the user reviews the pre-filled form and saves
- **THEN** one `LabReport` and its `LabValue` rows SHALL be persisted exactly as displayed after edits, atomically

#### Scenario: Draft discarded

- **WHEN** the user discards an extraction draft
- **THEN** the form SHALL reset to its manual-entry state and no data SHALL have been persisted

### Requirement: Canonical mapping never invents parameters

Extracted rows SHALL be mapped to catalog parameters by deterministic code,
in this order: a model-proposed key is accepted only if it exists in the
catalog; otherwise the verbatim printed label is matched against the
existing display-name and abbreviation lookups (both locales); anything
still unmapped SHALL become a custom-parameter row (`custom:<slug>`)
carrying the verbatim label for the user to resolve during review. No
extracted value SHALL be silently dropped, and no key outside the catalog
or the custom namespace SHALL be created.

#### Scenario: Alias resolves to canonical parameter

- **GIVEN** a document row labeled "GPT (ALT)" with a value and unit
- **WHEN** the draft is built
- **THEN** the row SHALL map to the catalog parameter `alt` with its unit and value pre-filled

#### Scenario: Unknown parameter becomes a custom row

- **GIVEN** a document row whose label matches no catalog parameter or alias
- **WHEN** the draft is built
- **THEN** the row SHALL appear in custom mode named by the verbatim label, and the user SHALL resolve or delete it during review

### Requirement: Printed report ranges keep authority

Reference ranges printed on the document and captured by extraction SHALL
pre-fill the row's reference fields as report-provided bounds, so the saved
values carry `refSource: "report"` under the existing effective-range
resolution; rows without a printed range SHALL fall back to the catalog
range exactly as manual entry does.

#### Scenario: Printed range wins over catalog

- **GIVEN** an extracted row whose printed range differs from the catalog range
- **WHEN** the draft is saved
- **THEN** the stored value's flag and canonical bounds SHALL derive from the printed range, with `refSource: "report"`

### Requirement: AI provenance stamped, documents transit-only

Reports and values saved from an extraction draft SHALL carry provenance
`{ source: "ai-extracted" }` (even when the user edited the draft), while
manual entry keeps `manual`. The uploaded document SHALL be transit-only:
its bytes are sent to the model call and SHALL NOT be persisted in any
local store.

#### Scenario: Provenance distinguishes origin

- **WHEN** an extraction draft is saved
- **THEN** the persisted report and every persisted value SHALL have provenance source `ai-extracted`, and reports saved through plain manual entry SHALL keep `manual`

#### Scenario: Document bytes are not stored

- **WHEN** an extraction completes, succeeds, or fails
- **THEN** no document bytes SHALL exist in Dexie, OPFS, or any other persistent storage

### Requirement: Extraction model is user-routable

The settings model picker SHALL list the `lab_extraction` purpose so users
can bind a multimodal-capable model for extraction, and resolution SHALL
follow the standard order (purpose binding, then default binding, then
default provider).

#### Scenario: Purpose binding routes extraction

- **GIVEN** a `lab_extraction` binding pointing at a specific provider and model
- **WHEN** an extraction runs
- **THEN** it SHALL use the bound model regardless of the chat or generation bindings

### Requirement: Localized extraction UI

All user-facing strings introduced by the extraction feature SHALL exist in
both the English and Spanish i18n dictionaries; parameter names SHALL keep
using the existing display map.

#### Scenario: Spanish UI complete

- **GIVEN** the app language set to Spanish
- **WHEN** the user walks the upload, progress, review, error, and discard states
- **THEN** every string introduced by this feature SHALL render in Spanish
