## MODIFIED Requirements

### Requirement: Manual guides

The docs site SHALL include manually written guides migrated from existing documentation: Getting Started, Architecture, KRD Format, Testing, and Contributing. It SHALL also include four guides for athletes, listed in a "For athletes" sidebar group: Zwift workouts on Garmin (`guide/zwift-to-garmin`), AI planning with your own API key (`guide/ai-planning-byok`), WHOOP recovery in the training plan (`guide/whoop-recovery-in-plan`), and a comparison with TrainingPeaks, intervals.icu and Garmin Connect (`guide/kaiord-vs-trainingpeaks-intervals-garmin`). The comparison SHALL date its table ("as of <date>"), SHALL cite a source for every claim about another product, and SHALL mark a missing fact `[CONFIRMAR]` rather than state it. Claims about Kaiord in these guides SHALL match the code.

#### Scenario: Guide content accessible

- **WHEN** a user navigates to `/docs/guide/getting-started`
- **THEN** the Getting Started guide SHALL be displayed with installation instructions and basic usage examples

#### Scenario: Athlete guide accessible

- **WHEN** a user navigates to `/docs/guide/zwift-to-garmin`
- **THEN** the guide SHALL be displayed and SHALL link the converter at `https://kaiord.com/app/#/convert?from=zwo&to=fit`

#### Scenario: Comparison claims are sourced

- **WHEN** a reader opens `/docs/guide/kaiord-vs-trainingpeaks-intervals-garmin`
- **THEN** the table SHALL carry its "as of" date and every claim about another product SHALL carry a footnote to its source

## ADDED Requirements

### Requirement: ES locale for guides with hreflang

The docs site SHALL publish the four athlete guides in Spanish under `/docs/es/guide/<slug>`, with a Spanish landing at `/docs/es/`. Every other page stays English only, with `<html lang="en">`; Spanish pages SHALL have `<html lang="es">`. The language switcher SHALL link each locale's root (`i18nRouting: false`), never `/es/<same path>` of an untranslated page. Each page of an EN/ES pair SHALL carry `<link rel="alternate" hreflang>` for `en`, `es` and `x-default` (the English page), taken from one pair map, and no other page SHALL carry hreflang. The sitemap SHALL list both pages of each pair. Spanish pages SHALL be spell-checked with a Spanish dictionary.

#### Scenario: Paired pages declare their alternates

- **WHEN** `/docs/es/guide/zwift-to-garmin` is built
- **THEN** it has `<html lang="es">` and hreflang links to `/docs/guide/zwift-to-garmin` (`en`, `x-default`) and to itself (`es`)

#### Scenario: Switcher never links a missing page

- **WHEN** any built docs page renders the language switcher
- **THEN** every switcher link resolves to a built page, and `check-site-links` fails the build otherwise

#### Scenario: Untranslated pages stay English

- **WHEN** `/docs/guide/quick-start` is built
- **THEN** it has `<html lang="en">` and no hreflang link
