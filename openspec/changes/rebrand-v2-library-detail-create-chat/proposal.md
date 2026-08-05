# Rebrand V2 · Library, Workout detail, Create workout, Chat

## Why

Four screens read a session's structure and none of them says what it is made
of. The rebrand V2 foundation (#1117) landed the palette; the screen waves have
to make the training data legible with it.

Measured on `main` before this change:

| Screen         | What it withholds                                                                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Library        | A saved session shows title, sport, duration and TSS. Its 8 px zone bar sits at the bottom of the card as decoration, and nothing in the row says which zone the session is _about_.                                |
| Workout detail | The summary strip reads `Duration · TSS · Load`. "Load" is a word derived from TSS — a second name for a number already on screen — and the zone the session actually trains is nowhere in it.                      |
| Create workout | The generator writes power and pace targets against the athlete's thresholds and tells the user only "Built around your cycling zones". The FTP those watts come from, and when that number last moved, are absent. |
| Chat           | A `create_workout` tool result renders as two text links. The session the assistant just wrote — its shape, its cost, and what it lands next to — has to be opened to be seen.                                      |

The three cross-cutting colour rules from the handoff apply to all four: the
4 px lateral card border carries the session's **dominant** zone, a zone is
never said with colour alone, and the palette has no success/warning — a state
that needs the user says so with a word.

Two contrast facts make the "never colour alone" rule load-bearing rather than
decorative. `--zone-4` is `oklch(0.8 0.15 78)` in dark and `oklch(0.545 0.11 78)`
in light: the same swatch is a light amber on one theme and a dark ochre on the
other, so "the amber one" is not a name a user can carry between themes. And
Z4 amber sits at L 0.80 while Z5 red tops out at L 0.628 — the ramp is not
lightness-monotonic, so "higher = brighter" is false. The word is the only
stable identifier.

## What Changes

- **A session's zone profile is a first-class row element, not a footer.** The
  Library card renders it at 10 px directly under the title, and takes a 4 px
  lateral border in the session's dominant zone. A template whose KRD has no
  classifiable structure gets no zone colour at all — it has no profile to
  show, and inventing a neutral bar would claim it does.

- **"Hardest zone" is stated with a swatch and the word.** It joins the summary
  strip on Workout detail and on the Create-workout result, replacing the
  derived "Load" label. `SummaryStrip` gains an optional `zone` on its item so a
  swatch replaces the icon; nothing else about it changes.

- **Generation declares the threshold it writes against, and where that number
  came from.** Above the prompt box, not below it (principle 8): the reason goes
  above what it justifies. The claim is bounded by what the profile actually
  stores — the sport's primary threshold, its value and unit, and `updatedAt`
  rendered through the existing `formatRelativeTime`. Workout detail carries the
  same line under its structure card, because its watt ranges are the same
  derivation.

- **A proposed session arrives rendered.** A `create_workout` tool result in the
  transcript, and a coaching draft opened from `/workout/new?coaching=…`, both
  render a `SessionProposalCard`: dominant-zone border, title, the metrics with
  their before values, and the 10 px zone profile. Chat's before is the session
  already sitting on that date; the coaching draft's before is what the coach
  prescribed.

- **Slate is repainted in every file this change touches** (#1121), including
  the two literal hues in the chat transcript: the user bubble's `bg-sky-600`
  becomes `bg-accent`, and the search-focus `ring-yellow-300` becomes a neutral
  role ring. A yellow ring on a palette with no warning colour was reading as a
  state.

### Deliberately NOT shipped

- **A per-field provenance source ("Garmin, 4 days ago").** `SportThresholds`
  stores `{lthr, ftp, thresholdPace, paceUnit}` and nothing else — no source,
  no per-field timestamp. The only honest origin available is the athlete
  profile itself plus `profile.updatedAt`, and that is what ships. Wiring
  per-field provenance is Athlete's model change, not this wave's.

- **"Replaces Wednesday" as a claim.** `doCreateWorkout` calls
  `persistence.workouts.put(record)` with a fresh `crypto.randomUUID()`; it adds
  a session to the date and deletes nothing. The card therefore says the
  proposed session lands _next to_ the one already there, and the before/after
  compares the two. Making the verb true is a behaviour change to the tool.

- **`utils/step-colors.ts` and the library thumbnail canvas.** #1121 assigns the
  step-colour literals to the Editor wave; `SaveToLibraryButton/thumbnail/*`
  imports them, and no Library surface renders the thumbnail it produces.

## Capabilities

### New Capabilities

- `spa-session-presentation`: how a structured session is rendered wherever one
  appears — the zone profile strip and its dominant-zone border, the
  swatch-and-word rule for naming a zone, the threshold-provenance line and what
  it is permitted to claim, and the proposal card's before/after contract.

### Modified Capabilities

- `spa-ai-chat`: a confirmed `create_workout` result renders the session it
  created instead of only linking to it, and the transcript's role styling moves
  onto role tokens.

## Impact

- **Package**: `@kaiord/workout-spa-editor` (private SPA) only. No domain,
  application-port or adapter-package change; no dependency added; no Dexie
  version bump and no schema change — every value rendered is derived from
  records that already exist.
- **Shared components touched**: `molecules/SummaryStrip` (one optional prop),
  `molecules/LibraryCard` (layout + the zone border), `molecules/ZoneDist`
  (unchanged — it already carries the `{dist, height, className}` API this wave
  needs). See design.md D1 for the ZoneProfileBar convergence note.
- **i18n**: no new namespace. Keys are added to `library`, `workout-detail`,
  `create-workout`, `chat` and `zones` in both locales; `zones` gains the five
  canonical zone names so the swatch-and-word rule has words to use.
- **Verb keys**: none renamed. The Library verb cut (Send · Keep · Download)
  belongs to the Editor wave, which owns `library.json`'s action keys; this
  change reads them as they are.
- **e2e**: no test id and no URL changed. `library-card`, `card-load-into-editor`,
  `chat-messages`, `create-workout` and `workout-detail-back` keep their
  identities.
- **No** changeset (the SPA is private and excluded from the changeset-bot
  PUBLISHABLE set).
