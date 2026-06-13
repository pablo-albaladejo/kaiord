<!--
Delta spec for `spa-coaching-integration`: the coaching-text rendering
contract extends from "paragraphs + bold" to "paragraphs + bold + safe
links". One new requirement defines the shared link-aware renderer; the
EditorPage sidebar requirement is modified to reference it.
-->

## ADDED Requirements

### Requirement: Safe linkification of coaching text

The SPA SHALL render coaching-sourced text (activity descriptions and day-comment bodies) through a single shared formatter that produces a structured AST of inline nodes — `text`, `strong`, and `link` — and a renderer that maps that AST to React elements. The renderer MUST NOT use `dangerouslySetInnerHTML`.

`link` inlines SHALL be produced from two sources:

- Markdown links `[label](url)` as stored by the train2go-bridge parser
- Bare URLs beginning with `https://` appearing in plain text (auto-linkified; covers coach-pasted URLs and data persisted before this change)

The renderer SHALL emit `link` inlines as `<a href={url} target="_blank" rel="noopener noreferrer" title={url}>label</a>`. The full URL in the `title` attribute exposes the real destination when the label differs from the href.

**Scheme allowlist:** only `https:` URLs SHALL become anchors. A markdown link or bare URL with any other scheme (`javascript:`, `data:`, `http:`, etc.) SHALL render as plain text, never as an anchor. This check happens at render time, independent of what the parser stored.

Existing behavior is preserved: `<p>` paragraphs and `**bold**`/`<strong>` markers render as before; text without links is unaffected.

#### Scenario: Markdown link renders as a safe anchor

- **WHEN** a coaching description contains `Técnica: [vídeo técnica](https://youtu.be/abc123)`
- **THEN** the rendered output contains an anchor with `href="https://youtu.be/abc123"`, `target="_blank"`, `rel="noopener noreferrer"`, `title="https://youtu.be/abc123"`, and text content `vídeo técnica`

#### Scenario: Bare https URL is auto-linkified

- **WHEN** a coaching description contains `Material en https://www.dropbox.com/s/xyz aquí`
- **THEN** `https://www.dropbox.com/s/xyz` renders as an anchor with that href and the surrounding text renders as plain text

#### Scenario: Non-https scheme is refused

- **WHEN** a coaching description contains `[click](javascript:alert(1))`
- **THEN** no anchor is rendered; the content renders as plain text and no `javascript:` href appears anywhere in the DOM

#### Scenario: Bold and paragraphs unchanged

- **WHEN** a coaching description contains `**Calentamiento:** 20' Z1\n6x(30" Z5)`
- **THEN** rendering is identical to the pre-change behavior: a strong inline for `Calentamiento:` and two paragraphs, with no anchors

## MODIFIED Requirements

### Requirement: EditorPage sidebar for coaching-derived workouts

When the EditorPage opens a workout, it SHALL determine whether the workout is derived from a coaching activity by reading `SessionMatchRepository.getByWorkoutId(workoutId)`. If a match exists with `source ∈ { "auto-coaching", "auto-coaching-v10-migration", "manual" }` AND the linked `coachingActivities` row is non-deleted, the EditorPage SHALL render a left sidebar containing:

- Activity title (heading)
- Sport icon and label
- Status (pending / completed / skipped)
- Coach description (read-only, formatted text — `<p>` paragraphs, `<strong>` markers as plain visual emphasis, and hyperlinks rendered per the safe-linkification requirement)

The sidebar SHALL be collapsible via a toggle button. The collapsed/expanded state SHALL be persisted per-user (localStorage, key `kaiord.editor.coachSidebar.collapsed`). Default state on first render: expanded for viewports ≥ 768px, collapsed for narrower viewports.

Workouts NOT derived from a coaching activity (no SessionMatch, OR matched to a non-coaching source) SHALL NOT render the sidebar. The editor's existing layout for non-coaching workouts is unchanged.

The sidebar is read-only; it never mutates `activity.description` or any other field. Changes to the upstream coach description (via bridge re-sync) update the sidebar reactively via the existing `coachingActivities` live query.

#### Scenario: Sidebar renders for AI-converted workout

- **GIVEN** a workout created via `convertCoachingActivityWithAi` (and therefore session-matched to a coaching activity)
- **WHEN** the user opens its EditorPage
- **THEN** the left sidebar renders with the activity's title, sport, status, and coach description; the editor's KRD step list renders alongside it

#### Scenario: Sidebar renders for manually-created workout

- **GIVEN** a workout created via `convertCoachingActivityManual`
- **WHEN** the user opens its EditorPage
- **THEN** the sidebar renders with the activity's coach description (preserved in `raw.description` per the manual-creation requirement); the KRD shows the placeholder warmup step

#### Scenario: Sidebar absent for non-coaching workout

- **GIVEN** a workout with no SessionMatch (e.g., a manually-created standalone workout)
- **WHEN** the user opens its EditorPage
- **THEN** no sidebar renders; the editor uses its full-width layout

#### Scenario: Sidebar description with a link is clickable

- **GIVEN** a coaching-derived workout whose activity description contains `[vídeo técnica](https://youtu.be/abc123)`
- **WHEN** the user opens its EditorPage
- **THEN** the sidebar renders `vídeo técnica` as an `https`-only anchor with `target="_blank"` and `rel="noopener noreferrer"`, per the safe-linkification requirement
