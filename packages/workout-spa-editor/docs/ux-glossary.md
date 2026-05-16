# UX Glossary

> Canonical user-facing terms for `@kaiord/workout-spa-editor`.
> Owned by the design system. Pull requests that introduce new
> verbs or rename existing ones must update this glossary first.

The trace and reflection that motivate this glossary live in
`.omc/specs/deep-dive-trace-ui-flow-map-ux-redesign.md` and
`.omc/specs/deep-dive-ui-flow-map-ux-redesign-reflection.md`.

## Verbs (one per goal)

| Verb                 | Use when…                                                                 | Avoid               |
| -------------------- | ------------------------------------------------------------------------- | ------------------- |
| **Create**           | The user starts a brand-new workout from scratch (manual / AI / template) | "Add", "New"        |
| **Schedule**         | The user places an existing workout/template on a specific calendar day   | "Plan", "Set"       |
| **Send**             | The user pushes a workout to a connected device (Garmin)                  | "Push", "Upload"    |
| **Save**             | The user persists changes to a workout in storage                         | "Store", "Commit"   |
| **Save as template** | The user persists a workout as a reusable template in the library         | "Save to Library"   |
| **Load**             | The user opens an existing workout/template into the editor               | "Open"              |
| **Polish with AI**   | The user transforms a manually-edited workout via AI                      | "Improve", "Refine" |
| **Match**            | The user pairs a coaching prescription with an existing workout           | "Link", "Connect"   |
| **Connect**          | The user pairs an external account/device (Garmin, Train2Go)              | "Link", "Pair"      |
| **Switch**           | The user changes the active profile                                       | "Change"            |

## Nouns

| Noun                 | Means                                                          |
| -------------------- | -------------------------------------------------------------- |
| **Workout**          | A single training session, structured or imported              |
| **Template**         | A reusable workout saved in the library                        |
| **Step**             | A single interval inside a workout                             |
| **Repetition block** | A grouped sequence of steps that repeats N times               |
| **Coach**            | The external coaching prescription source (Train2Go etc.)      |
| **Zone**             | A training intensity band (HR or power), defined per profile   |
| **Profile**          | The athlete identity (zones · linked accounts · personal data) |
| **Calendar week**    | The Monday-anchored week shown on `/calendar`                  |

## State labels (visible to user)

| Label         | Means                                                |
| ------------- | ---------------------------------------------------- |
| **Connected** | Bridge / device is online and reachable              |
| **Offline**   | Bridge / device is unreachable                       |
| **Synced**    | Last data exchange completed without conflict        |
| **Conflict**  | Last sync surfaced a difference requiring resolution |

## Rationale (kept short, applies across the app)

- One verb per goal so users build a stable vocabulary.
- Verbs are imperative and concrete (not "Manage", not "Handle").
- Nouns map 1:1 to a domain concept; never use "session" or "activity"
  as a synonym for "workout" in user-facing copy.
- State labels live in a fixed vocabulary so the persistent status
  header reads consistently across the app.
- Existing call-sites are not retroactively renamed by this glossary
  doc; verb migrations ship in their own PRs to keep diffs reviewable.
