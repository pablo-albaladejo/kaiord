# Design: Profile Manager Redesign + Zone Methods

## Context

The current Profile Manager has a two-step flow: edit profile fields (card) → view training zones (below). This is confusing because FTP/LTHR appear in both the profile card and as thresholds in zones. The zone tables show percentages instead of watts and aren't truly editable.

## Goals

- Single-surface profile editing with zones as the primary view
- Zone methods (Coggan, Friel, etc.) with auto-calculation + overrides
- Real unit values (watts, bpm, min/km) everywhere
- Editable names and custom zone counts

## Non-Goals

- Heart rate reserve (HRR) calculation methods
- TSS/training load integration
- Zone history/tracking over time

## Decisions

### D1: Remove Edit Profile card, use tabs

**Layer:** Adapters (SPA UI)

**Decision:** Replace the current layout:

```
Before: [Edit Profile card] + [Training Zones]
After:  [Profile name inline] → Tab: Training Zones | Tab: Personal Data
```

Training Zones is the default tab. Personal Data holds body weight and future fields (age, etc.). FTP, LTHR, and threshold pace move exclusively to their sport's threshold section.

**Rationale:** Eliminates duplication. Users primarily interact with zones, not body weight.

### D2: Zone method registry

**Layer:** Adapters (SPA types + utils)

**Decision:** A registry of zone methods:

```ts
type ZoneMethod = {
  id: string;                    // e.g., "coggan-7"
  name: string;                  // e.g., "Coggan 7-zone"
  zoneCount: number;
  defaults: Array<{
    name: string;
    minPercent: number;
    maxPercent: number;
  }>;
};

const POWER_METHODS: Array<ZoneMethod> = [
  { id: "coggan-7", name: "Coggan 7-zone", zoneCount: 7, defaults: [...] },
  { id: "friel-7", name: "Friel 7-zone", zoneCount: 7, defaults: [...] },
  { id: "british-cycling-6", name: "British Cycling 6-zone", zoneCount: 6, defaults: [...] },
  { id: "custom", name: "Custom", zoneCount: 5, defaults: [...] },
];
```

Each method defines default percentages. "Custom" has a mutable zone count.

**Rationale:** Extensible — adding a new method is just adding an entry. Clean separation between method definition and zone calculation.

### D3: ZoneConfig with method + overrides

**Layer:** Adapters (SPA types)

**Decision:** Update ZoneConfig:

```ts
type ZoneConfig<T> = {
  method: string;
  zones: Array<T>;
};
```

When a user overrides a value, the zone itself stores the overridden value. The `method` field tracks which preset was used. For "custom", everything is user-defined.

**Rationale:** Simpler than a separate overrides map. The zones array always has the current values, whether calculated or custom.

### D4: Zone values in real units

**Layer:** Adapters (SPA UI + utils)

**Decision:** Zone tables always show real units. Calculation: `watts = threshold * percent / 100`. For display:

- Primary: "190-225W"
- Secondary (optional, muted text): "(76-90%)"

The zones-formatter for LLM output also uses real values.

**Rationale:** Users think in watts/bpm/pace, not percentages. The LLM also needs absolute values.

### D5: Inline editable zone names

**Layer:** Adapters (SPA UI)

**Decision:** Zone name is a text input (styled as plain text when not focused). On click/focus, it becomes editable. Changes persist immediately to the store.

**Rationale:** Minimal UI — no edit button needed. Same pattern as contentEditable but with a controlled input for reliability.

### D6: Custom zone count

**Layer:** Adapters (SPA UI)

**Decision:** "Custom" method shows an "Add Zone" button below the table and a delete icon per row. Zone count range: 1-10. Other methods have fixed count (the dropdown changes the table size).

**Rationale:** Follows TrainingPeaks pattern. Fixed count for presets prevents confusion.

## Risks and Mitigations

| Risk                                   | Mitigation                                |
| -------------------------------------- | ----------------------------------------- |
| Method switch loses overrides          | Confirmation dialog before reset          |
| Too many zone methods overwhelms UI    | Start with 3-4 per type, extensible later |
| Custom zone count edge cases (0 zones) | Minimum 1, disable remove on last zone    |
