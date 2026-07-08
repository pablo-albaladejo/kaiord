## ADDED Requirements

### Requirement: Locale preference

The `UserPreferences` row SHALL gain an optional `locale` field:

```
{
  locale?: "auto" | "en" | "es"   // UI language; absent reads as "auto"
}
```

An absent `locale` SHALL read as `"auto"` (safe default, no migration — per
the aggregate's new-field rule). The locale SHALL be persisted through the
existing `setUserPreferenceFields` partial-patch use case (`patch: { locale }`),
which merges the field onto the existing row (preserving other preferences),
verifies profile existence before writing, and rewrites `updatedAt` from the
injected clock — the same sequencing as every other preference field.
Resolution of the preference to a concrete locale (`"auto"` →
`navigator.language`) is specified in the `i18n` capability; this aggregate
only persists the choice.

#### Scenario: Absent locale reads as auto

- **GIVEN** a profile `P` with no `userPreferences` row, or a row persisted before this change
- **WHEN** preferences for `P` are read
- **THEN** the effective `locale` SHALL be `"auto"`

#### Scenario: First-time locale change creates the row

- **GIVEN** a profile `P` with no `userPreferences` row
- **WHEN** `setUserPreferenceFields({ profileId: P, patch: { locale: "es" } })` is called
- **THEN** a row SHALL be upserted with `locale: "es"` and `updatedAt` from the injected clock

#### Scenario: Locale change preserves other preference fields

- **GIVEN** a `userPreferences` row for `P` with `calendarView: "list"` and no `locale`
- **WHEN** `setUserPreferenceFields({ profileId: P, patch: { locale: "es" } })` is called
- **THEN** the row SHALL have `locale: "es"` AND retain `calendarView: "list"`

#### Scenario: Locale change re-renders consumers

- **GIVEN** a component reading preferences via `useLiveQuery` for profile `P`
- **WHEN** the locale patch commits
- **THEN** the component SHALL re-render with the updated `locale` without a reload
