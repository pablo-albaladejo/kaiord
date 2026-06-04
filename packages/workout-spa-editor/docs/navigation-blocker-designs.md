# Workout SPA Editor — Navigation blocker designs

Concrete, buildable designs for the **3 needs-design** items from the [implementation-readiness report](./navigation-implementation-readiness.md): WP-11 back-nav origin contract, WP-5 scratch persist-on-date, WP-9 settings section anchors. Each was drafted against the real code, adversarially reviewed, and finalized. Design only — no code applied.

---

## Back-navigation origin contract (#4 / #19 / #28)

### Problem (back-nav)

There is **no navigation-origin source anywhere in the SPA** (`grep "from=" src/` = 0 matches; no `history.back()` / `useHistoryState()` in app code). Every back/close target is hardcoded and detached from where the user actually came from:

- `components/pages/use-back-handler.ts:33` — `backTarget = isInPicker ? buildPickerHref(dateParam) : null` always resolves a `scratch`/`import` picker to `/workout/new[?date=…]`. Opening the editor from Library "Load" (`components/pages/LibraryPage.tsx:78` → `/workout/new?source=scratch`) sends **Back to the AI Create overlay the user never visited** (`src/new-workout-route.tsx:15` mounts `<EditorPage>` for `source`/`action`, and the bare `/workout/new` mounts `<CreateWorkout>`). (#4)
- `components/pages/use-back-handler.ts:50` — edit-mode (`?id`) editor returns `null` ⇒ **no Back button at all** when the editor was reached from calendar/coaching/detail. (#19)
- `components/pages/WorkoutDetail/WorkoutDetail.tsx:17` — `onBack` hardcodes `navigate("/calendar")` regardless of whether the detail was opened from Today (`components/pages/Today/PlannedSessionCard.tsx:57` → `/workout/view/:id`) or elsewhere. (#28)

The audit confirms `history.back()` and wouter `useHistoryState()` are **untestable** under the `memoryLocation({record:true})` harness, which records only the path string list (`location.history`), not `window.history.state`. We need an explicit, URL-carried, pure-resolvable origin contract.

### Approach (back-nav)

Build an explicit **`?from=<origin>` query contract**: every navigation _into_ the editor (`/workout/:id`, `/workout/new?…`) and detail (`/workout/view/:id`) appends a `from=<origin>` param naming the surface it departed from. A new **pure resolver** `routing/resolve-back-target.ts` maps `origin → href` with a safe default. `EditorPage` (already holds the parsed `URLSearchParams`) extracts the origin and passes it into `useBackHandler`; `WorkoutDetail` reads it via `useSearch()`.

**Why this shape** — it is the only mechanism the audit cleared:

- **Testable under the current harness.** The origin lives in the URL path string, which `memoryLocation({record:true})` already records; existing pins assert `location.history.at(-1)` as a string with query (`EditorPage.test.tsx:303,322`). The resolver is a pure `(input) => href` function, unit-testable exactly like `picker-href.test.ts`.
- **No app-exit risk.** Unlike `history.back()`, the resolver always lands on a known in-app surface — no walking off a deep-link landing.
- **Mirrors existing patterns.** It extends the same `routing/` pure-helper + `useSearch()`/`URLSearchParams` shape already in `picker-href.ts`, `new-workout-route.tsx:12`, `EditorPage.tsx:36`, and `ImportDropzoneOverlay.tsx:28`.
- **Backward-compatible.** Absent/unknown `?from=` falls back to today's defaults, so the in-picker-no-origin and no-origin-edit-mode pins are preserved.

**Two corrections folded in from review:**

1. **Edit-mode #19 needs a handler split.** `handleBack` today wraps the target in scratch-draft discard logic (`stepsLength > 0` → `openDiscardModal()`). An edit-mode origin-back has **no draft to discard** — it must be a plain `navigate(backTarget)`. The hook therefore computes the target from _either_ the legacy picker fallback (discard-aware) _or_ an origin (plain-navigate in edit mode), and returns the matching handler.
2. **`CreateInputPhase` forwarding is dropped** — Library navigates _directly_ to `/workout/new?source=scratch`, which mounts `<EditorPage>` and **bypasses `CreateWorkout`/`CreateInputPhase` entirely** (`new-workout-route.tsx:15`). The bare `<CreateWorkout>` overlay's only inbound is the origin-less "New workout" CTA, so it stays origin-less; its `onBlank`/`onImport` need no `from=`.

### Contract (back-nav)

**Origin vocabulary** (closed set, lowercase kebab):

| `from=` value  | Departed surface                       | Back target                                                             |
| -------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| `library`      | LibraryPage `/library`                 | `/library`                                                              |
| `calendar`     | Calendar week grid / empty-week create | `/calendar`                                                             |
| `calendar-day` | Dated create (`?date=`)                | `buildPickerHref(date)` → `/workout/new?date=<date>` (else `/calendar`) |
| `coaching`     | Coaching dialogs                       | `/calendar`                                                             |
| `today`        | Today summary / wellness import        | `/calendar`                                                             |
| `detail`       | Read-only WorkoutDetail                | `/workout/view/<detailId>` (else `/calendar`)                           |

```ts
// routing/back-origin.ts
export const BACK_ORIGINS = [
  "library",
  "calendar",
  "calendar-day",
  "coaching",
  "today",
  "detail",
] as const;
export type BackOrigin = (typeof BACK_ORIGINS)[number];

export function parseBackOrigin(raw: string | null): BackOrigin | null {
  return (BACK_ORIGINS as readonly string[]).includes(raw ?? "")
    ? (raw as BackOrigin)
    : null; // unknown/absent → null → resolver default
}
```

```ts
// routing/resolve-back-target.ts
export type ResolveBackInput = {
  origin: BackOrigin | null;
  date?: string | null; // forwarded ?date= (calendar-day parity)
  detailId?: string | null; // workout id for `detail` origin
};
// Pure. Always returns an in-app href. Null/unknown origin → DEFAULT_TARGET ("/calendar").
export function resolveBackTarget(input: ResolveBackInput): string;
```

```ts
// routing/with-origin.ts — call-site helper appending ?from= (composes with ?date=/?source=)
export function withOrigin(href: string, origin: BackOrigin): string;
// withOrigin("/workout/new?source=scratch", "library") → "/workout/new?source=scratch&from=library"
```

`URLSearchParams.toString()` appends `from` last, preserves existing param order, and is idempotent — verified against the existing query shapes.

### New files (back-nav)

**`packages/workout-spa-editor/src/routing/back-origin.ts`** — vocabulary + parser (sketch above). ~14 lines.

**`packages/workout-spa-editor/src/routing/resolve-back-target.ts`** — pure resolver:

```ts
import { buildPickerHref } from "./picker-href";
import type { BackOrigin } from "./back-origin";

const DEFAULT_TARGET = "/calendar";

export type ResolveBackInput = {
  origin: BackOrigin | null;
  date?: string | null;
  detailId?: string | null;
};

export function resolveBackTarget({
  origin,
  date,
  detailId,
}: ResolveBackInput): string {
  switch (origin) {
    case "library":
      return "/library";
    case "detail":
      return detailId ? `/workout/view/${detailId}` : DEFAULT_TARGET;
    case "calendar-day":
      return date ? buildPickerHref(date) : DEFAULT_TARGET;
    case "calendar":
    case "coaching":
    case "today":
      return DEFAULT_TARGET;
    default:
      return DEFAULT_TARGET; // null / unknown → safe home
  }
}
```

~30 lines. The `calendar-day` branch **calls `buildPickerHref(date)`** so the WP-5 date-aware picker shape stays single-sourced (`buildPickerHref` returns `/workout/new?date=<date>`, which equals the legacy expectation).

**`packages/workout-spa-editor/src/routing/with-origin.ts`** — call-site append helper:

```ts
import type { BackOrigin } from "./back-origin";

export function withOrigin(href: string, origin: BackOrigin): string {
  const [path, query = ""] = href.split("?"); // app hrefs never contain a 2nd "?"
  const params = new URLSearchParams(query);
  params.set("from", origin);
  return `${path}?${params.toString()}`;
}
```

~9 lines. Precondition (single `?`) holds for all app hrefs.

**Tests (new):** `routing/resolve-back-target.test.ts`, `routing/back-origin.test.ts`, `routing/with-origin.test.ts` — all pure, AAA, "should " titles, mirroring `picker-href.test.ts`.

### Edit points (back-nav)

| File                                                                   | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Line hint                 |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `components/pages/EditorPage.tsx`                                      | After `const params = new URLSearchParams(search)` (`:36`), add `const origin = parseBackOrigin(params.get("from"))`. Change the call at `:39` to `useBackHandler(newWorkoutMode, dateParam, origin)`. (EditorPage already owns `params`, so the hook does **not** call `useSearch()` a second time — avoids a redundant parse and keeps the hook's inputs explicit, matching the existing `dateParam`-passed-in pattern.)                                                                                                                                                                                                                                                                                                                                       | `:36-39`                  |
| `components/pages/use-back-handler.ts`                                 | Add third param `origin: BackOrigin \| null`. Compute `backTarget = origin ? resolveBackTarget({ origin, date: dateParam }) : (isInPicker ? buildPickerHref(dateParam) : null)`. **Split the handler:** keep the existing discard-aware `handleBack` for the **picker** path (`isInPicker && !origin`), and add a plain `navigate(backTarget)` handler for the **origin** path (no draft to discard). Concretely: `const isDiscardAware = isInPicker && !origin;` then return `backTarget ? (isDiscardAware ? handleBack : plainBack) : null`, where `plainBack = useCallback(() => backTarget && navigate(backTarget), [backTarget, navigate])`. Edit-mode (`?id`) with an origin now yields a back button (#19); edit-mode with no origin still yields `null`. | `:19-22`, `:33`, `:40-51` |
| `components/pages/WorkoutDetail/WorkoutDetail.tsx`                     | Import `useSearch` from wouter and `parseBackOrigin`/`resolveBackTarget`. Add `const search = useSearch();` and `const origin = parseBackOrigin(new URLSearchParams(search).get("from"));`. Change `onBack` to `useCallback(() => navigate(resolveBackTarget({ origin, detailId: id })), [navigate, origin, id])`. No `from=` → `origin: null` → `/calendar` (unchanged default).                                                                                                                                                                                                                                                                                                                                                                                | `:1`,`:13`,`:17`          |
| `components/organisms/ImportDropzoneOverlay/ImportDropzoneOverlay.tsx` | Extract `from` alongside `date` (`:28`): `const from = new URLSearchParams(search).get("from");` and pass it: `useImportOnLoad(date, from)`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `:28-29`                  |
| `components/organisms/ImportDropzoneOverlay/use-import-on-load.ts`     | **Signature change** (not a one-liner): `useImportOnLoad(date: string \| null, from: string \| null)`. At the success navigate (`:69`), build via `navigate(withOrigin(\`/workout/${record.id}\`, parseBackOrigin(from) ?? "calendar"))`. The health-import branch (`:48`) is unaffected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `:35`, `:69`              |

`EditorPageHeader.tsx` and `WorkoutDetailView.tsx` need **no change** — they render the BackButton only when `onBack` is defined.

### Call sites to thread (back-nav)

Append `from=<origin>` (via `withOrigin`) at each navigation _into_ the editor/detail:

| Call site (file:line)                                                     | Current nav                                      | Origin                                              |
| ------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------- |
| `components/pages/LibraryPage.tsx:78`                                     | `/workout/new?source=scratch`                    | `library`                                           |
| `components/molecules/WellnessEntryDialog/wellness-import-action.tsx:19`  | `/workout/new?action=import`                     | `today`                                             |
| `components/molecules/CalendarEmptyStates/EmptyWeekState.tsx:28`          | `/workout/new`                                   | `calendar`                                          |
| `components/pages/Today/PlannedEmpty.tsx:21`                              | `/workout/new`                                   | `today`                                             |
| `components/pages/Today/PlannedSessionCard.tsx:57`                        | `/workout/view/${id}`                            | `today`                                             |
| `components/pages/use-add-entry-chooser.ts:22`                            | `/workout/new?date=${addEntryDate}`              | `calendar-day`                                      |
| `components/molecules/RawWorkoutDialog/RawWorkoutContent.tsx:52`          | `/workout/new?date=${workout.date}`              | `calendar-day`                                      |
| `components/pages/use-calendar-state.ts:45`                               | `/workout/${workout.id}`                         | `calendar`                                          |
| `components/pages/use-dialog-handlers.ts:30`                              | `/workout/${id}${params}`                        | `calendar`                                          |
| `components/molecules/CoachingCard/use-coaching-manual-handler.ts:65`     | `/workout/${result.workoutId}`                   | `coaching`                                          |
| `components/molecules/CoachingCard/CoachingActivityDialog.tsx:49`         | `/workout/${matchedId}`                          | `coaching`                                          |
| `components/molecules/CoachingCard/use-coaching-convert.ts:64`            | `/workout/${result.workoutId}`                   | `coaching`                                          |
| `components/molecules/CoachingCard/use-coaching-ai-handler-helpers.ts:77` | `ctx.navigate(\`/workout/${result.workoutId}\`)` | `coaching`                                          |
| `components/organisms/ImportDropzoneOverlay/use-import-on-load.ts:69`     | `/workout/${record.id}`                          | threaded `from` (else `calendar`) — see Edit points |
| `components/pages/WorkoutDetail/WorkoutDetail.tsx:19` (`onEdit`)          | `/workout/${id}`                                 | `detail`                                            |

Each thread is `navigate(withOrigin(<href>, "<origin>"))`. For the `?date=` sites, `withOrigin` composes cleanly: `withOrigin("/workout/new?date=2026-06-01", "calendar-day")` → `/workout/new?date=2026-06-01&from=calendar-day`.

**Left origin-less (correct):** `status-entry-defs.ts:41` (`to: "/workout/new"`, primary-nav CTA, line is 41 not 39 — `id:"new"` def) → defaults to `/calendar`; `CreateInputPhase.tsx:65-66` (`onBlank`/`onImport`) — the overlay is only reachable origin-less, so no forwarding (review correction). `wellness-import-action`, `EmptyWeekState`, and the `today`/`calendar` group all resolve to `/calendar` today; the explicit origin only matters if those targets later diverge.

### Schema impact (back-nav)

**None.** `from=` is ephemeral URL state, never persisted. No Dexie table/index/migration; no Zod schema change. `R-DexieImport` is untouched — the resolver is a pure function in `routing/`, persistence still flows through the existing repository/port, and nothing touches `window.history.state`.

### Test plan (back-nav)

**New tests:**

- `routing/resolve-back-target.test.ts` — one `it` per origin; `null`/unknown → `/calendar`; `calendar-day` **with** date (`/workout/new?date=…`) and **without** date (`/calendar`); `detail` **with** id (`/workout/view/<id>`) and **without** id (`/calendar`). The without-date / without-id / default cases pin the branch-coverage gaps the review flagged (70% frontend threshold).
- `routing/back-origin.test.ts` — `parseBackOrigin` accepts each vocab value; rejects unknown and `null` → `null`.
- `routing/with-origin.test.ts` — appends `from=` preserving `?date=`/`?source=`; idempotent on repeat; order stable (`source=scratch&from=library`).

**Existing tests to rewrite (pin old behavior — named):**

- **`components/pages/EditorPage.test.tsx`:**
  - `:290-303` _"should render the back button on mode \"scratch\" and navigate to /workout/new…"_ — source `/workout/new?source=scratch` has **no `from=`** → `origin:null`, `isInPicker:true` → legacy `buildPickerHref` → `/workout/new`. **Assertion unchanged**; the picker fallback survives.
  - `:305-321` _"should preserve ?date= in the back target…"_ — source `/workout/new?source=scratch&date=2026-06-01`, still no `from=` → legacy fallback → `/workout/new?date=2026-06-01`. **Assertion unchanged.**
  - `:323-335` _"should NOT render a back button when id is provided"_ — edit mode, no `from=` → `backTarget:null` → `null`. **Assertion unchanged.**
  - `:337-405` discard-modal pins (_"should open the discard confirmation modal…"_, _"should clear the store…then navigate"_, _"should keep the underlying back button non-interactive…"_, _"should preserve the back-handler identity across parent re-renders…"_) — all use `?source=scratch` with **no `from=`**, so they stay on the discard-aware picker path. **Assertions unchanged**; the `plainBack` split only activates when an origin is present, so identity-stability and discard semantics are untouched (`origin` is a stable string read from `params`, so `backTarget` stays referentially stable).
  - **Add** _"should resolve Back to /library when ?from=library on a scratch entry"_ — render `/workout/new?source=scratch&from=library`, assert `location.history.at(-1) === "/library"` (origin path, plain navigate; #4).
  - **Add** _"should render a Back button to /calendar in edit mode when ?from=calendar is present"_ — seed a record, render `w-test` at `/workout/w-test?from=calendar`, assert the back button renders and navigates to `/calendar` **without** opening the discard modal even with steps present (#19, plain-navigate path).
- **`components/pages/WorkoutDetail/WorkoutDetail.test.tsx`:** the `vi.mock("wouter")` at `:13-15` returns only `useLocation` — **must add `useSearch`**, ideally parametrized (`let mockSearch = ""; vi.mock("wouter", () => ({ useLocation: () => ["/workout/view/w1", navigateMock], useSearch: () => mockSearch }))`). Rewrite the existing _"should navigate to the editor when Edit is clicked"_ assertion to expect `withOrigin("/workout/w1", "detail")` = `/workout/w1?from=detail`. **Add** _"should navigate Back to /calendar by default"_ (`mockSearch=""`) and _"should navigate Back to the originating surface when ?from is present"_ (`mockSearch="from=today"` → `/calendar`).
- **`components/organisms/ImportDropzoneOverlay/use-import-on-load.test.tsx`:** the hook signature changes to `(date, from)`. The existing sleep-KRD case (`:78` `useImportOnLoad(null)`) becomes `useImportOnLoad(null, null)`. **Add** a workout-KRD case with a `date` + `from="calendar-day"` asserting the success navigate lands on `/workout/<id>?from=calendar-day`, and a `from=null` case asserting `…?from=calendar` (default).
- **`picker-href.test.ts`** — unchanged (signature stable); the two cases stay valid. No rewrite needed; the `calendar-day` branch is now also asserted _through_ `resolve-back-target.test.ts`.

**No-change confirmations:** `routes.test.tsx` / `router-base.test.tsx` stay green — wouter matches path and ignores query, so `&from=…` on entry hrefs does not affect route matching.

### Tradeoffs (back-nav)

- **URL verbosity.** `?from=` is visible/shareable; a shared `/workout/new?source=scratch&from=library` renders Back to `/library` for a recipient who never saw Library — acceptable, the resolver guarantees a valid in-app surface (no exit/404).
- **Manual threading vs. automatic history.** ~15 call-site edits beat `history.back()` because it is the _only_ deterministic, harness-testable option and never exits the SPA on a deep-link landing. `withOrigin` keeps each call site a one-token wrap.
- **Closed vocabulary.** New surfaces must add a vocab value + resolver branch; `parseBackOrigin`'s null-fallback degrades a forgotten/typo'd origin gracefully to `/calendar` rather than crashing.

### Micro-decision + recommended default (back-nav)

**Should an in-picker editor with no `from=` keep falling back to `/workout/new`, or adopt the resolver's `/calendar` default?**
**Recommended: keep `/workout/new` for the in-picker-no-origin case.** It preserves the `EditorPage.test.tsx:290-321` pins with zero behavior change for direct `/workout/new?source=scratch` entries, and `/workout/new` is itself a valid named surface. Implementation: `backTarget = origin ? resolveBackTarget({origin, date: dateParam}) : (isInPicker ? buildPickerHref(dateParam) : null)`, which cleanly separates origin-driven (plain navigate) from the legacy picker fallback (discard-aware), and keeps no-origin edit-mode at `null`.

**Secondary:** `WorkoutDetailNotFound.tsx:20` hardcodes the visible label **"Back to calendar"**. With a non-`/calendar` origin the label can lie. **Recommended: leave as-is for now** (origin into the not-found state is rare — it requires a missing record id reached via an originated link). Note it; if later addressed, pass a derived label down from `WorkoutDetail`.

### Risks (back-nav)

- **Highest blast radius in the plan** (every editor/detail entry). Mitigation: land WP-1..WP-7 first so behavior tests surround this change; the resolver itself is pure and fully unit-covered.
- **`WorkoutDetail.test.tsx` mock gap** — adding `useSearch` to `vi.mock("wouter")` is **mandatory**; the current mock (`:13-15`) lacks it, and calling an undefined mock export throws. Easiest regression to miss.
- **#19 handler split** — if the edit-mode origin-back path reuses discard-aware `handleBack`, an edit-mode Back would (a) wrongly open the discard modal when the loaded workout has steps, and (b) `clearWorkout()` a persisted record's store copy. The `plainBack` split is load-bearing; cover it with the new edit-mode test asserting **no** modal opens.
- **`use-import-on-load` signature change** — `ImportDropzoneOverlay.tsx` must pass the new `from` arg or TypeScript fails; the existing test call (`:78`) must add the second arg. Both are in the rewrite list.
- **WP-6 ordering coupling** — `use-dialog-handlers.ts:30` is edited by both WP-6 (drop `?comments=`) and this WP (add `from=calendar`). Sequence WP-6 first or coordinate the single edit to avoid a merge conflict.
- **Coverage threshold (70%)** — the resolver's `default`, `detail`-without-id, and `calendar-day`-without-date branches must each be hit by a test (all in the new-tests list) to avoid uncovered branches.

**Estimated size:** ~9 files edited (`EditorPage.tsx`, `use-back-handler.ts`, `WorkoutDetail.tsx`, `ImportDropzoneOverlay.tsx`, `use-import-on-load.ts`, + ~10 one-line call-site wraps across `LibraryPage`, `wellness-import-action`, `EmptyWeekState`, `PlannedEmpty`, `PlannedSessionCard`, `use-add-entry-chooser`, `RawWorkoutContent`, `use-calendar-state`, `use-dialog-handlers`, 4× CoachingCard) · 3 new files (+3 new test files) · 3 pinned test files to rewrite (`EditorPage.test.tsx`, `WorkoutDetail.test.tsx`, `use-import-on-load.test.tsx`; `picker-href.test.ts` unchanged).

---

## Scratch workout persist-on-date (#3 / D1)

### Problem (scratch persist)

A blank "scratch" workout opened from a calendar day (`/workout/new?source=scratch&date=YYYY-MM-DD`) shows the `DateBanner` "Creating workout for <day>" (`packages/workout-spa-editor/src/components/pages/DateBanner.tsx:25-27`) but **never persists to Dexie**. Its only save path is `WorkoutActions` → `SaveButton` → `createSaveHandler` (`packages/workout-spa-editor/src/components/molecules/SaveButton/save-handler.ts:17-58`), which calls `exportWorkout` + `downloadWorkout` — a **file export**, never `persistence.workouts.put`. The scratch session is never scheduled onto the chosen date; the banner promises a calendar entry the code never creates.

The import path already solves the analogous problem: `use-import-on-load.ts:57-73` reads `date`, builds a `WorkoutRecord` via `persistImportedWorkout` (`persist-imported-workout.ts:21-49`), calls `persistence.workouts.put(record)`, then `navigate('/workout/${record.id}')`. We mirror that.

Three hard constraints from the real code:

1. **Mount must stay side-effect-free.** `ScratchEditorSurface.test.tsx:159-174` pins that `db.table("workouts").put` is NOT called on mount ("persistence happens on save only"). The new persist must fire on an **explicit user action**, never in an effect.
2. **`WorkoutActions`/`SaveButton`/`WorkoutSection` is shared** with the id-loaded editor: `EditorPage.tsx:80-91` mounts the same `WorkoutSection` in its populated body, and `ScratchEditorSurface.tsx:90-98` mounts it too. A "Save & schedule" action MUST be scratch-local — adding it to `WorkoutActions`/`SaveButton`/`WorkoutSection` would leak it into the id-loaded editor, where a record already exists, producing a duplicate schedule action and a second `put`.
3. **D6 mandates rejection, not fallback.** `navigation-fix-plan.md:123,251` (D6) require the persist boundary to _reject_ calendar-impossible dates "with a clear error" via a round-trip parse, and `:125` requires "a round-trip-rejection test for an impossible date." The boundary must refuse the save, not silently re-schedule onto today.

### Approach (scratch persist)

**What gets built + why:**

1. **`persist-scratch-workout.ts`** — a pure async helper mirroring `persist-imported-workout.ts` exactly, differing only in `source: "scratch"`. Takes `{ krd, date, profileId, sport }`, builds a `WorkoutRecord`, calls `persistence.workouts.put`, returns the record. Pure + port-bound = unit-testable; honors hexagonal (imports the `PersistencePort` type, never `db`), so it satisfies R-DexieImport. **It deliberately does NOT call `stripIds`**: `dexie-workout-repository.ts:12-13,43-44` already wraps every `put` with `stripRecordIds` (the declared chokepoint, `strip-ids.ts`), so the helper must not double-strip or route around the port. (Asymmetry noted under Schema impact / Test plan: the in-memory repo at `in-memory-workout-repository.ts:30-32` does NOT strip, so tests must assert only on `date`/`source`/`id`, never on `krd.steps[].id`.)

2. **`is-valid-calendar-date.ts`** (the #37/D6 round-trip helper) — shape-gate with `/^\d{4}-\d{2}-\d{2}$/`, then `new Date(`${value}T12:00:00Z`)` parse → re-serialize → compare against the input. Rejects calendar-impossible dates (`2026-13-45`, `2026-02-31`) that the shape regex passes. **Load-bearing**: its `false` result _blocks_ the save (D6), it is never ignored.

3. **A scratch-local "Save & schedule" control** rendered **inside `ScratchEditorSurface`** (the surface unique to scratch), wired through a hook `use-persist-scratch.ts` that pulls `currentWorkout` from the store, `profileId` from `useActiveProfileLive`, `persistence` from `usePersistence`, `navigate` from `useLocation`, `toast` from `useToastContext`, with `date` threaded from the route. `schedule()` fires only on `onClick` → mount stays clean (test pin `:159` preserved). The control lives in the surface, not in `WorkoutSection`, so it never reaches the id-loaded editor.

4. **D6 rejection semantics in `schedule()`.** If `!isValidCalendarDate(date)`, `schedule()` shows `toast.error("Invalid date", "Could not schedule — the date is not a valid calendar day.")` and **does NOT persist or navigate**. No `todayDate()` fallback (the draft's Micro-decision B is dropped — it inverted D6). Same gate is applied to the import boundary (see Edit points): `use-import-on-load.ts:57` swaps its shape-only `ISO_DATE_REGEX.test(date)` for `isValidCalendarDate(date)`, giving import a true round-trip gate too.

5. **Thread `?date=` into the scratch surface.** Today `ScratchEditorSurface` takes no props (`:42`) and `render-new-workout-surface.tsx:26` renders `<ScratchEditorSurface />` with no date. `EditorPage` already parses `dateParam` (`EditorPage.tsx:37`). Thread `dateParam` → `renderNewWorkoutSurface(mode, dateParam)` → `<ScratchEditorSurface date={dateParam} />`. The date is the single scheduling source of truth, read from `?date=` exactly like import. The `?action=import` branch passes `dateParam` too in the same signature change but the import overlay's existing behavior is unchanged.

6. **`canSchedule` gating.** The button reflects readiness: `canSchedule = profileId != null && currentWorkout != null`. When no profile is active (the `useActiveProfileLive` guard, mirroring `use-import-on-load.ts:46,61`) or no workout is loaded, the button renders **disabled** (`<Button disabled>`) so the click cannot silently no-op. The control itself only renders when a `date` prop is present.

7. **AI-create branch (D1) — explicitly carved OUT of this WP, deferred to WP-5 #1.** `navigation-fix-plan.md:120,218` already scope the AI date-fix as finding **#1** (`build-workout-record.ts:35` hardcodes `date: todayDate()`; `use-create-workout.ts`/`use-save-and-push.ts` never read `?date=`). #1 is rated **build-ready** in the readiness report; #3 (this doc) is the **needs-design** scratch item. Folding AI-create here would conflate a ready fix with a design blocker. **Scope statement (add to plan §WP-5):** this design (#3/D1) covers **scratch + the shared `isValidCalendarDate` gate (#37/D6, which import also adopts)**; the AI-create date thread is **#1's** responsibility — `use-save-and-push`/`build-workout-record` read `?date=` via `useSearch` and pass it (fallback `todayDate()`) there, not here. D1's three-branch consistency is met across the two findings (#1 = AI, #3 = scratch, #37 = import gate), not within this single doc.

8. **DROP "Save as draft (unscheduled)".** Schema reality forces it (see Schema impact): an unscheduled record is unrepresentable. The only control is "Save & schedule".

**Metadata-commit timing (accepted, not gated):** `ScratchEditorSurface` opens in `MetadataEditMode` (`startInEditMode`, `:97`). A user could click "Save & schedule" while the metadata form is open, persisting the default name/sport. This is **accepted**: name/sport are fully editable post-save on the id route, the record is valid, and gating the button on metadata commit would add cross-component coupling for no data-integrity gain. `schedule()` reads sport the same way the surface already does (`currentWorkout.extensions.structured_workout.sport`, `:72-75`) rather than re-deriving through the looser `getStructuredWorkout` guard.

### Contract (scratch persist)

```ts
// persist-scratch-workout.ts
export type PersistScratchInput = {
  krd: KRD;
  date: string; // YYYY-MM-DD, already round-trip-validated by the caller's gate
  profileId: string;
  sport: string;
};
export async function persistScratchWorkout(
  persistence: PersistencePort,
  input: PersistScratchInput
): Promise<WorkoutRecord>; // record.id = crypto.randomUUID(); put strips krd ids at the adapter

// is-valid-calendar-date.ts
export function isValidCalendarDate(value: string): boolean;
// true iff /^\d{4}-\d{2}-\d{2}$/.test(value)
//   && !Number.isNaN(new Date(`${value}T12:00:00Z`).getTime())
//   && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value

// use-persist-scratch.ts
export function usePersistScratch(date: string): {
  canSchedule: boolean; // profileId != null && currentWorkout != null
  schedule: () => Promise<void>; // D6-rejects on invalid date (toast, no persist/nav)
};
```

Query-param vocabulary (consumed, not introduced):

- `source=scratch` — selects the scratch surface (`deriveNewWorkoutMode`, `render-new-workout-surface.tsx:13`).
- `date=YYYY-MM-DD` — the schedule target. Parsed in `EditorPage.tsx:37`, threaded to the surface.

`WorkoutRecord` produced (mirrors `persistImportedWorkout:26-46`, differs only in `source`):

```ts
{ id: crypto.randomUUID(), profileId, date, sport, source: "scratch",
  sourceId: null, planId: null, state: "structured", raw: null, krd,
  lastProcessingError: null, feedback: null, aiMeta: null, garminPushId: null,
  tags: [], previousState: null, createdAt: now, modifiedAt: null, updatedAt: now }
```

### New files (scratch persist)

**`src/components/organisms/ScratchEditorSurface/persist-scratch-workout.ts`** (~40 lines, sibling to the surface, parallel to `ImportDropzoneOverlay/persist-imported-workout.ts`):

```ts
import type { PersistencePort } from "../../../ports/persistence-port";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { KRD } from "../../../types/krd";

export type PersistScratchInput = {
  krd: KRD;
  date: string;
  profileId: string;
  sport: string;
};

// NOTE: does NOT call stripIds — persistence.workouts.put strips krd ids
// at the Dexie adapter boundary (dexie-workout-repository.ts:43-44).
export async function persistScratchWorkout(
  persistence: PersistencePort,
  input: PersistScratchInput
): Promise<WorkoutRecord> {
  const now = new Date().toISOString();
  const record: WorkoutRecord = {
    id: crypto.randomUUID(),
    profileId: input.profileId,
    date: input.date,
    sport: input.sport,
    source: "scratch",
    sourceId: null,
    planId: null,
    state: "structured",
    raw: null,
    krd: input.krd,
    lastProcessingError: null,
    feedback: null,
    aiMeta: null,
    garminPushId: null,
    tags: [],
    previousState: null,
    createdAt: now,
    modifiedAt: null,
    updatedAt: now,
  };
  await persistence.workouts.put(record);
  return record;
}
```

**`src/utils/is-valid-calendar-date.ts`** (~12 lines; `src/utils` is the existing home of `structured-workout.ts` and `export-workout.ts`, matching `use-import-on-load`'s import locality):

```ts
const ISO_DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

/** Shape-gate then round-trip parse to reject calendar-impossible dates. */
export function isValidCalendarDate(value: string): boolean {
  if (!ISO_DATE_SHAPE.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.toISOString().slice(0, 10) === value;
}
```

**`src/components/organisms/ScratchEditorSurface/use-persist-scratch.ts`** (~35 lines, keeps the surface under the 80-line organism cap and the 60-line function cap):

```ts
// usePersistScratch(date): reads currentWorkout (useCurrentWorkout),
//   profileId (useActiveProfileLive), persistence (usePersistence),
//   navigate (useLocation), toast (useToastContext).
// canSchedule = profileId != null && currentWorkout != null.
// schedule():
//   if (!currentWorkout || !profileId) return;
//   if (!isValidCalendarDate(date)) { toast.error(INVALID_TITLE, INVALID_DESC); return; }
//   const sport = currentWorkout.extensions?.structured_workout?.sport ?? "cycling";
//   try { const rec = await persistScratchWorkout(persistence,
//           { krd: currentWorkout, date, profileId, sport });
//         navigate(`/workout/${rec.id}`); }
//   catch { toast.error(SAVE_FAIL_TITLE, SAVE_FAIL_DESC); }
// Top-level SCREAMING_SNAKE_CASE string constants (R-PIIInterpolation: static toast args).
```

**`src/components/organisms/ScratchEditorSurface/ScratchScheduleButton.tsx`** (~25 lines, scratch-local control; renders only when `date` is present):

```ts
// props: { date: string }
// const { canSchedule, schedule } = usePersistScratch(date);
// <Button variant="primary" disabled={!canSchedule} onClick={() => void schedule()}>
//   Save &amp; schedule
// </Button>
```

Test files (new): `persist-scratch-workout.test.ts`, `is-valid-calendar-date.test.ts`, and extensions to `ScratchEditorSurface.test.tsx` (the hook is exercised through the surface rather than via a separate `renderHook` file, mirroring how the surface tests already drive store + persistence).

### Edit points (scratch persist)

- **`ScratchEditorSurface.tsx:42`** — change signature to `export function ScratchEditorSurface({ date }: { date: string | null })`. Inside the returned tree (after `<AiBanner />`, `:87`), add `{date && <ScratchScheduleButton date={date} />}` (one line). Mount effects (`:57-83`) untouched → the `:159` side-effect-free pin holds. Net change ≈ 2 lines; organism stays under the 80-line effective cap (file currently passes `npx eslint`).
- **`render-new-workout-surface.tsx:23-28`** — `renderNewWorkoutSurface(mode, date)` gains `date: string | null`; pass `<ScratchEditorSurface date={date} />`. The `import` branch (`:27`) is unchanged. Update the `NewWorkoutMode` export's lone JSDoc note if the 100-line cap is touched (it is a `pages/**` file → 150 cap, ample room).
- **`EditorPage.tsx:79`** — `{showNewSurface && renderNewWorkoutSurface(newWorkoutMode, dateParam)}` (`dateParam` already in scope at `:37`).
- **`use-import-on-load.ts:57`** — replace `if (!date || !ISO_DATE_REGEX.test(date)) return;` with `if (!date || !isValidCalendarDate(date)) return;`; delete the local `ISO_DATE_REGEX` const (`:27`) and import `isValidCalendarDate` from `../../../utils/is-valid-calendar-date`. This adopts the D6 round-trip gate at the import persist boundary too.

### Call sites to thread (scratch persist)

`?date=` is already produced by the dated scratch entry points and consumed in `EditorPage`. The only new threading is **`EditorPage → renderNewWorkoutSurface → ScratchEditorSurface`** (3 hops, above). Producers needing no change: the dated `NewWorkoutPicker`/calendar-day "+" that append `&date=`. Non-dated producers (`LibraryPage`, `CreateInputPhase`) pass no date → `dateParam` is `null` → `ScratchScheduleButton` does not render → non-dated scratch behavior is unchanged (only the existing file-export `SaveButton`). **Not threaded here (out of scope, = WP-5 #1):** the AI-create path (`use-save-and-push`/`build-workout-record`) — it needs its own `useSearch`-based `?date=` thread.

### Schema impact (scratch persist)

**No Zod change, no Dexie schema change, no migration.**

- `workoutRecordSchema.date` is `z.iso.date()` — **non-nullable** (`calendar-record.ts:23`). A null/absent date fails Zod at write, so "unscheduled draft" is unrepresentable without a schema change.
- `date` is a **primary Dexie index** backing `getByDateRange` (`dexie-workout-repository.ts:26-27`), the calendar's only read path. An unscheduled record could not appear on the date-indexed calendar even if the schema allowed null — it would need a new nullable column + index + migration + query surface, all out of scope and contradicting D1.
- `source: "scratch"` is a free-form `z.string()` (`calendar-record.ts:25`) — no enum migration.

`persistScratchWorkout` always writes a concrete `date`. The schema-drift pin is untouched (we add nothing to the schema).

### Test plan (scratch persist)

**New tests:**

- `persist-scratch-workout.test.ts` — "should persist a scratch workout on the given date via the workouts port"; "should set source to scratch and state to structured"; "should return a record with a crypto uuid id". Use `createInMemoryWorkoutRepository`-backed `PersistencePort` (or a minimal stub); assert `workouts.put` args (`date`/`source`/`id` only — **not** `krd` ids, per the in-memory no-strip asymmetry).
- `is-valid-calendar-date.test.ts` — "should accept a real calendar date"; "should reject month 13 (2026-13-01)"; "should reject Feb 31 (2026-02-31)"; "should reject a malformed shape". Pure, no harness.
- `ScratchEditorSurface.test.tsx` (extend — the `:159` mount pin stays unmodified):
  - "should render a Save & schedule control when a date is present" — render `<ScratchEditorSurface date="2026-06-01" />` (the `date` arrives as a **prop**, not from the URL; `renderSurface` must be parameterized to pass it while keeping the `Router` for `useLocation`).
  - "should NOT render the schedule control without a date" — `<ScratchEditorSurface date={null} />`.
  - "should disable the schedule control when no profile is active" — no `seedActiveProfile()`, assert `disabled`.
  - "should persist on the route date and navigate to /workout/:id when scheduled" — seed an active profile, click the control, assert a `db.table("workouts").put` with `date: "2026-06-01"` and the `memoryLocation` history ends at `/workout/<uuid>`.
  - "should reject a calendar-impossible date with a toast and not persist" — `date="2026-02-31"`, click, assert no `put` and an error toast (D6 round-trip-rejection at the scratch boundary).
- `EditorPage.test.tsx` (extend, NOT rewrite) — add "should render the schedule control on a dated scratch route" rendering `/workout/new?source=scratch&date=2026-06-01` through the real `renderNewWorkoutSurface` threading (the surface tests render the surface directly and bypass the new `date` hop; this is the only coverage of the 3-hop wiring since `render-new-workout-surface` has no dedicated test).

**NET-NEW test on the import path (not a touch-up — the draft mis-scoped this):**

- `use-import-on-load.test.tsx` has **no** existing `ISO_DATE_REGEX`/impossible-date assertion (verified: it only covers health routing + sleep nav, `:71-89`). D6's required "round-trip-rejection test for an impossible date" is therefore **new**: add "should NOT persist an imported workout when the date is calendar-impossible" using `createInMemoryPersistence` + `setActiveId` (the file's existing harness, `:42-46`) — drop a workout KRD with `date="2026-13-45"`, assert `persistence.workouts.getByDateRange` returns nothing and no nav to `/workout/:id`.

**Existing tests that pin old behavior (verified non-perturbed — re-run, no rewrite):**

- `EditorPage.test.tsx:305,320,379` — pin `?date=` back-target preservation through `renderNewWorkoutSurface`. They assert **back-navigation**, independent of persist; adding a `date` arg to `renderNewWorkoutSurface` is additive → stay green.
- `ScratchEditorSurface.test.tsx:159` ("should NOT write to Dexie on mount") — **the load-bearing invariant; retained unmodified.** Other existing pins (`:87,104,124,176,193,228`) only need `renderSurface()` to keep passing `date={null}` by default.

No test deletions.

### Tradeoffs (scratch persist)

- **Scratch-local control vs. extending `WorkoutActions`/`SaveButton`.** Extending the shared save path reaches the id-loaded editor (already-persisted records), producing a duplicate schedule action and a second `put`. A control in `ScratchEditorSurface` is the only place unique to scratch — chosen. Cost: a small extra component + hook instead of one shared button.
- **Persist on explicit click vs. auto-persist on first edit.** Auto-persist breaks the `:159` mount pin and surprises users who open scratch and bail. Explicit click matches import semantics (persist on an explicit drop) and preserves the pin. Chosen.
- **Reject invalid date (D6) vs. fall back to today.** Falling back silently mis-schedules and inverts D6's "reject with a clear error." Rejecting makes `isValidCalendarDate` load-bearing and self-consistent with `DateBanner` (which already renders nothing for unparseable dates — the user sees no banner _and_ the save refuses). Chosen; the `todayDate()` fallback is removed entirely, so the UTC-vs-local `toIsoDate` risk evaporates.
- **Separate `persist-scratch-workout.ts` vs. parametrizing `persist-imported-workout.ts`.** They differ only in `source` — a shared helper would need a `source` param leaking authoring-method into a generic name. Kept separate to mirror the 1-file-per-flow convention and keep each ≤40 lines with a self-describing name. Low duplication, high clarity.
- **AI-create deferred to #1 vs. folded in here.** Folding would conflate a build-ready fix (#1) with this needs-design blocker (#3) and bloat the WP. Deferring keeps each finding's blast radius and tests independent; D1 consistency is satisfied across #1/#3/#37 collectively.

### Micro-decision + recommended default (scratch persist)

**Where does `isValidCalendarDate` live — `src/utils/` or `application/shared/date-utils.ts`?** **Recommended: `src/utils/`.** `date-utils.ts` is application-layer (the `application` ring must not be imported by UI freely), whereas this helper is consumed at UI/organism boundaries (the scratch surface and `use-import-on-load`, both already importing from `src/utils`, e.g. `structured-workout.ts`). Placing it in `src/utils` matches the import locality of its two call sites and keeps the `application` ring clean. (The prior draft's Micro-decision about a today-fallback is **withdrawn** — D6 rejection removes the fallback, so there is no today-source decision to make.)

### Risks (scratch persist)

- **Surface prop churn.** Adding `date` to `ScratchEditorSurface` touches `render-new-workout-surface` and `EditorPage`, both exercised by `EditorPage.test.tsx`. Mitigation: the prop is additive, the `import` branch signature is unchanged, and `renderSurface()` defaults `date={null}` so existing surface pins are unperturbed; re-run both suites.
- **Test harness prop vs. URL confusion.** `ScratchEditorSurface.test.tsx:45-63` renders the surface directly inside a `memoryLocation` `Router`; the new `date` arrives as a **prop**, so the tests must pass `date="…"` explicitly (the URL `?date=` does not populate the prop). Only the `EditorPage.test.tsx` addition exercises the true URL→prop threading. Mitigation: parameterize `renderSurface(date?)` and keep `useLocation` available for the nav assertion.
- **Line caps (corrected).** spa-editor `**/*.tsx` are capped at **80** effective lines (`eslint.config.js:164-167`, `skipBlankLines+skipComments`); the **150** override applies only to `**/pages/**/*.tsx` (`:253-257`). `ScratchEditorSurface` is an **organism** → 80 effective (passes today). The net surface change is ≈2 lines (prop signature + one conditional render); the persist logic lives in `use-persist-scratch.ts` + `ScratchScheduleButton.tsx`, so it stays under both the 80-line file cap and the 60-line function cap. (The draft's "100/103" framing was wrong and is corrected here — no phantom cap conflict.)
- **R-PIIInterpolation on toast args.** The mechanical guard requires `toast.error` first-args under `components/hooks/lib` to be static. Mitigation: all toast titles/descriptions in `use-persist-scratch.ts` are top-level SCREAMING_SNAKE_CASE string constants referencing literals — no interpolation.
- **Scheduling never overwrites a same-date workout.** `persistScratchWorkout` uses a fresh `crypto.randomUUID()`; `put` keys on `id`, and `[profileId+date]` is non-unique — it adds a second workout on the day, identical to `persistImportedWorkout`. Correct, not a risk.

### Estimated size (scratch persist)

**~4 files edited** (`ScratchEditorSurface.tsx`, `render-new-workout-surface.tsx`, `EditorPage.tsx`, `use-import-on-load.ts`) · **~3 new source files** (`persist-scratch-workout.ts`, `is-valid-calendar-date.ts`, `use-persist-scratch.ts`) + `ScratchScheduleButton.tsx` = **4 new files** · **3 new test files** (`persist-scratch-workout.test.ts`, `is-valid-calendar-date.test.ts`) plus extensions to `ScratchEditorSurface.test.tsx`, `EditorPage.test.tsx`, and `use-import-on-load.test.tsx` (NET-NEW import-rejection case) · **0 pinned tests rewritten** (all existing pins, incl. the `:159` mount-side-effect invariant, are retained unmodified; only additive cases and a default `date={null}` arg in `renderSurface`).

---

## Settings section anchors + focus, and the Export-everything row (#26 / #34 / D4)

### Problem (settings anchors)

Two defects in the Settings index → detail flow, both instances of consistency rule D4 ("destination granularity matches label granularity"):

1. **Section deep-link is tab-top only (#34).** `SettingsPage.tsx:18` reads only `useParams(tab)`; it has no notion of a sub-section. `settings-groups.ts:21,25` ship two distinct AI rows — **"Provider"** and **"Custom instructions"** — but both point at the same bare `to: "/settings/ai"` (lines 22, 25). Clicking either lands the user at the top of the AI tab. `AiTab.tsx` renders three bare `<section>`s — **LLM Providers** (line 15), **Add Provider** (line 27), **Custom System Prompt** (line 34) — with **no anchor attribute and no focus target**, so "Custom instructions" never scrolls/focuses to the prompt textarea. `useFocusOnRouteChange` (`use-focus-on-route-change.ts:40`) keys on **pathname only** (`useLocation()`, line 41) via `[data-route-heading]`, targeting the single route `<h1>`; a query-string change (`?section=`) does not change the pathname, so it never re-fires, and even if it did it only knows the page heading.

2. **"Export everything" is a dead promise (#26).** `settings-groups.ts:43` ships `{ icon: "upload", label: "Export everything", to: "/settings/privacy" }`, but `PrivacyTab.tsx` renders only three blocks: **Privacy Information** (`PrivacyInformationSection`, line 31), **Analytics** (line 33), and **Data Management** (line 52, a single "Clear All API Keys" danger button, line 56). There is **no export block anywhere**. The row names a capability the app does not have, and it duplicates the sibling "Data & privacy" row (line 42) that already points at `/settings/privacy`.

### Approach (settings anchors)

**What gets built:**

- A `?section=<id>` query contract (additive; the existing `:tab?` path param is unchanged). The DOM-contract constant and the section-id union live in a **new dependency-free module** `settings-section.ts`, mirroring how `ROUTE_HEADING_ATTR` lives in `routing/constants.ts:11` so pages, tabs, and the hook all import _down_ to it (never a tab importing from a hook).
- A new `use-focus-on-section-change` hook, mounted **inside `SettingsPage`** (the routed page that re-renders on `?section=` change, unlike `MainLayout` which never unmounts). It reads `?section=` via wouter's `useSearch()`, resolves the matching in-tab element by a stable `data-settings-section` attribute, and focuses it via the **existing `applyFocusToElement` helper** (`apply-focus-to-element.ts:25`). It keys on the section value so it re-fires across query-only changes — the gap `useFocusOnRouteChange` cannot cover.
- `tabIndex={-1}` + `data-settings-section` markers added to the two addressable AI sub-sections (`providers`, `custom-instructions`) in `AiTab.tsx`, and the Data Management section (`data-management`) in `PrivacyTab.tsx`. **No `id` attribute** (dead weight — nothing anchors to `#fragment`; wouter does not process hash fragments here).
- The two AI rows in `settings-groups.ts` re-pointed to `/settings/ai?section=providers` and `/settings/ai?section=custom-instructions`; the "Export everything" row relabeled and re-pointed (see Micro-decision).

**Why this shape (grounded in repo patterns, all verified):**

- `useSearch()` + `new URLSearchParams(search)` is the established read idiom in this codebase. We reuse it verbatim.
- We adopt **`applyFocusToElement`** (the helper used by `apply-focus-target.ts:97`) — **not** the route hook's mechanism. `useFocusOnRouteChange` uses an _inline_ `target.focus({ preventScroll: true })` with **no** `scrollIntoView` (`use-focus-on-route-change.ts:51-53`). The section anchor specifically needs the scroll-into-view that the route hook deliberately omits, which is why `applyFocusToElement` (focus + `scrollIntoView({ block:"nearest" })` + `prefers-reduced-motion`, with each throw caught separately, `apply-focus-to-element.ts:29-42`) is the right helper here.
- A new attribute (`data-settings-section`) keeps the section contract **local to Settings** and out of the global `[data-route-heading]` namespace. Reusing `data-route-heading` would put two such nodes in one page (the `<h1>` and a `<section>`), breaking the "first heading wins" `document.querySelector(ROUTE_HEADING_SELECTOR)` assumption (`use-focus-on-route-change.ts:56`). The route `<h1>` keeps owning route-level focus; the section hook owns sub-section focus — orthogonal.
- The hook mounts unconditionally in `SettingsPage`. `SettingsGroupList` is rendered only when `tab === undefined` (`SettingsPage.tsx:48-49`); the hook no-ops when `?section=` is absent, so the landing-list and back-nav paths are unaffected. Tab views are **statically imported** (`settings-tab-views.tsx:1-6` — `AiTab`, `PrivacyTab`, etc. are direct imports, not `React.lazy`), so on a single index→`/settings/ai?section=...` click the path and query change in one commit and the target section mounts synchronously — a **single `requestAnimationFrame`** suffices; **no `MutationObserver`** is needed (the route hook needs one only because its routes are lazy chunks).

**No persistence touched.** `?section=` is pure URL/UI state. No Dexie, no Zod, no repository/port — R-DexieImport is not in play.

### Contract (settings anchors)

#### Query-param vocabulary

- Param name: `section` (lowercase, kebab values).
- Values are a **closed enum**: `"providers" | "custom-instructions" | "data-management"`.
- Absent / unknown `section` → hook is a no-op (page renders tab top, exactly as today). Unknown values are silently ignored (no redirect, no warn) — a missing section element is a non-fatal content-vs-URL drift, not a routing error (unlike the unknown-`tab` `Redirect` at `SettingsPage.tsx:21`, which guards a real 404-class path error).

#### Section id ↔ row ↔ element mapping

| Row label (settings-groups.ts) | `to` target                                 | `data-settings-section` | DOM node                                          |
| ------------------------------ | ------------------------------------------- | ----------------------- | ------------------------------------------------- |
| Provider                       | `/settings/ai?section=providers`            | `providers`             | `AiTab.tsx:15` `<section>` (LLM Providers)        |
| Custom instructions            | `/settings/ai?section=custom-instructions`  | `custom-instructions`   | `AiTab.tsx:34` `<section>` (Custom System Prompt) |
| Manage your data               | `/settings/privacy?section=data-management` | `data-management`       | `PrivacyTab.tsx:52` `<section>` (Data Management) |

#### Types / signatures

```ts
// settings-section.ts (new, dependency-free — mirrors routing/constants.ts)
export const SETTINGS_SECTION_ATTR = "data-settings-section" as const;
export const SETTINGS_SECTION_SELECTOR = `[${SETTINGS_SECTION_ATTR}]` as const;
export type SettingsSectionId =
  | "providers"
  | "custom-instructions"
  | "data-management";

// use-focus-on-section-change.ts (new) — no args, no return; self-contained side
// effect, matching useFocusOnRouteChange(): void at use-focus-on-route-change.ts:40
export function useFocusOnSectionChange(): void;
```

The hook reads its own `useSearch()`; it takes **no** props.

### New files (settings anchors)

#### `src/components/pages/SettingsPage/settings-section.ts` (~10 lines)

The DOM-contract constant + selector + closed section-id union. Dependency-free so both the hook and the tab components import _down_ to it (resolves the backwards-dependency the draft introduced by exporting `SETTINGS_SECTION_ATTR` from the hook file).

```ts
export const SETTINGS_SECTION_ATTR = "data-settings-section" as const;
export const SETTINGS_SECTION_SELECTOR = `[${SETTINGS_SECTION_ATTR}]` as const;
export type SettingsSectionId =
  | "providers"
  | "custom-instructions"
  | "data-management";
```

#### `src/hooks/use-focus-on-section-change.ts` (~30 lines, under the 100 cap; function under 40)

Reads `?section=`, resolves the element by **iterating** `querySelectorAll(SETTINGS_SECTION_SELECTOR)` and comparing `getAttribute` values — **no `CSS.escape`** (it is `undefined` in jsdom 29.1.1 and not polyfilled in `test-setup.ts`; a `CSS.escape` selector would `ReferenceError` in every test that exercises the focus path). Closed kebab values need no escaping anyway. Focuses via `applyFocusToElement`. Keyed on the section value (`lastRef` dedupe) so it re-fires on query-only transitions; **re-selecting the same section does not re-fire** — identical semantics to `useFocusOnRouteChange`'s `lastPathRef` (`use-focus-on-route-change.ts:42,45`). Single `requestAnimationFrame` (no `MutationObserver`) since the target tab is statically imported and already committed.

```ts
import { useEffect, useRef } from "react";
import { useSearch } from "wouter";

import {
  applyFocusToElement,
  prefersReducedMotion,
} from "./focus/apply-focus-to-element";
import { SETTINGS_SECTION_SELECTOR } from "../components/pages/SettingsPage/settings-section";

export function useFocusOnSectionChange(): void {
  const search = useSearch();
  const section = new URLSearchParams(search).get("section");
  const lastRef = useRef<string | null>(null);

  useEffect(() => {
    if (section === null || section === lastRef.current) return;
    lastRef.current = section;
    const raf = requestAnimationFrame(() => {
      const el = Array.from(
        document.querySelectorAll<HTMLElement>(SETTINGS_SECTION_SELECTOR)
      ).find((n) => n.getAttribute("data-settings-section") === section);
      if (el) applyFocusToElement(el, { reduceMotion: prefersReducedMotion() });
    });
    return () => cancelAnimationFrame(raf);
  }, [section]);
}
```

_(`applyFocusToElement`'s `telemetry` arg is optional — `apply-focus-to-element.ts:22` — so we omit it, consistent with not threading the focus-telemetry provider into Settings. In jsdom, `el.focus()` works but `el.scrollIntoView()` throws; `applyFocusToElement` catches the scroll throw silently when no telemetry is passed — `apply-focus-to-element.ts:40-42` — so focus still lands. `apply-focus-to-element.test.ts` already proves both behaviors in jsdom.)_

#### `src/hooks/use-focus-on-section-change.test.tsx` (new test — see Test plan)

Mirrors the `use-focus-on-route-change.test.tsx` harness (`FAKE_RAF` + `memoryLocation` + `Router`, AAA bodies, "should " titles).

### Edit points (settings anchors)

| File:line                                              | Change                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/pages/SettingsPage/SettingsPage.tsx:18`    | Call `useFocusOnSectionChange()` at the top of the component (alongside `useParams`/`useLocation`); add the import. No-ops when `?section=` absent. **Function-cap check:** the component is lines 17–61 (44 lines) vs the 60-line React cap — one hook call + one import keeps it well under.  |
| `components/pages/SettingsPage/settings-groups.ts:22`  | `to: "/settings/ai"` → `to: "/settings/ai?section=providers"` (the "Provider" row).                                                                                                                                                                                                             |
| `components/pages/SettingsPage/settings-groups.ts:25`  | `to: "/settings/ai"` → `to: "/settings/ai?section=custom-instructions"` (the "Custom instructions" row).                                                                                                                                                                                        |
| `components/pages/SettingsPage/settings-groups.ts:43`  | "Export everything" row — relabel + re-point (see Micro-decision). **Note:** this also changes the `data-testid` from `settings-row-Export everything` to `settings-row-Manage your data` (`SettingsRow.tsx:45,56`); `grep` confirms no test references either testid today, so nothing breaks. |
| `components/organisms/SettingsPanel/AiTab.tsx:15`      | Add `tabIndex={-1}` + `{...{ [SETTINGS_SECTION_ATTR]: "providers" }}` to the **LLM Providers** `<section>`; add the `settings-section` import.                                                                                                                                                  |
| `components/organisms/SettingsPanel/AiTab.tsx:34`      | Add `tabIndex={-1}` + `{...{ [SETTINGS_SECTION_ATTR]: "custom-instructions" }}` to the **Custom System Prompt** `<section>`.                                                                                                                                                                    |
| `components/organisms/SettingsPanel/PrivacyTab.tsx:52` | Add `tabIndex={-1}` + `{...{ [SETTINGS_SECTION_ATTR]: "data-management" }}` to the **inline Data Management** `<section>` (line 52, NOT the imported `PrivacyInformationSection` at line 31); add the import.                                                                                   |

**Function-cap watch (AiTab):** the `AiTab` component is lines 7–56 (**49 lines** against the **60-line React cap** — only 11 lines of headroom). Dropping the `id` (per the review) and using the bare `{...{ [SETTINGS_SECTION_ATTR]: "..." }}` + `tabIndex={-1}` spread keeps each `<section>` open tag to ~2 added attribute lines after Prettier (~4 total across both sections), landing ~53. **If it crosses 60 after `pnpm format`, extract the two addressable sections into a tiny attribute-bearing wrapper.** This is a real constraint the draft missed (it only checked the file cap). The marker-spread `{...{ [ATTR]: "" }}` idiom is the same one already used for `ROUTE_HEADING_ATTR` at `SettingsPage.tsx:43`.

**Routing note:** `SettingsRow.tsx:54` calls `onNavigate(to)` → wouter `navigate(to)` (`SettingsPage.tsx:49`). wouter's `navigate` accepts a full `path?query` string, so `"/settings/ai?section=providers"` routes correctly and `useSearch()` inside `SettingsPage` exposes `section=providers`. **No change to `SettingsRow.tsx` or the `<Route path="/settings/:tab?">` pattern** — wouter matches on pathname and ignores the query.

### Call sites to thread (settings anchors)

Not applicable. The only producers of these section links are the three `settings-groups.ts` rows (edited above). No `?from=`-style origin threading is involved (that is the separate WP-11 mechanism — `resolve-back-target.ts`, origin vocab `library|calendar|...`). The two query contracts can coexist on one URL (`/settings/ai?section=providers&from=...`) without collision, since each reader pulls its own key; `?section=` is consumed once by `useFocusOnSectionChange` and is otherwise inert.

### Schema impact (settings anchors)

**None.** No Dexie table, index, or migration; no Zod schema. `?section=` is ephemeral URL state — the correct tier per the repo rule "Local UI → React state / URL" (CLAUDE.md State Management). R-DexieImport guard is not triggered (the hook imports only `wouter`, the focus helper, and the dependency-free `settings-section.ts`). The closed `SettingsSectionId` union is the only "schema" and lives as a plain `type` (per "Use `type` not `interface`").

### Test plan (settings anchors)

#### New tests

1. **`src/hooks/use-focus-on-section-change.test.tsx`** (new) — mirror the `use-focus-on-route-change.test.tsx` harness (`FAKE_RAF` that calls `cb(0)` synchronously; `memoryLocation`; `Router`; AAA markers; "should " titles). A `Harness` mounts `useFocusOnSectionChange()` plus two stub `<section data-settings-section="...">` with `tabIndex={-1}`. Cases:
   - `should focus the element matching the section query on change` — navigate to `?section=custom-instructions`; assert `document.activeElement.getAttribute("data-settings-section") === "custom-instructions"`.
   - `should no-op when the section query is absent` — render with no query; assert no stub section is `document.activeElement`.
   - `should ignore an unknown section value` — navigate to `?section=nope`; assert no throw and no section focused.
   - `should not re-fire focus when re-selecting the same section` — focus elsewhere, re-navigate to the same `?section=`; assert focus is not stolen back (pins the `lastRef` dedupe).

2. **`SettingsPage.test.tsx`** (extend, additive) — using the existing `renderAtPath` helper (`SettingsPage.test.tsx:39`, which records full path+query in `memory.history`). Because `renderAtPath` mounts `SettingsPage` in a bare `<Router>`+`<Route>` with **no `MainLayout`** (lines 42-47), `useFocusOnRouteChange` never runs here — no competing `[data-route-heading]` race. `useSearch()` resolves against the test `Router`. New cases:
   - `should focus the providers section for the providers query` — `renderAtPath("/settings/ai?section=providers")`; `await waitFor` that the element with `data-settings-section="providers"` is `document.activeElement`.
   - `should focus the data management section for the data-management query` — `renderAtPath("/settings/privacy?section=data-management")`; assert the Data Management `<section>` (the one wrapping "Clear All API Keys") is focused.
   - `should still render the ai tab top with no section query` — `renderAtPath("/settings/ai")` still shows "LLM Providers" and focuses no in-tab section (guards the no-op path).
   - `should point the manage-your-data row at the privacy data-management section` — from `/settings`, click `settings-row-Manage your data`; `await waitFor` that `memory.history.at(-1)` equals the **exact** string `"/settings/privacy?section=data-management"` (query included, since `record:true` captures the full path).

#### Existing tests that pin OLD behavior

- **`SettingsPage.test.tsx` — none must be rewritten.** The "landing list" / "detail views" cases (lines 66-191) assert text/panel presence, not `to` values or query strings. The one row-navigation pin, `"should navigate to a tab when clicking a navigating row"` (line 97), clicks the **Extensions** row (`to` unchanged) and asserts `memory.history.at(-1) === "/settings/extensions"` — unaffected.
- The eyebrow pin `"should render every group eyebrow"` (lines 79-95) asserts only four eyebrows (`AI generation`, `Preferences`, `Privacy & data`, `Advanced`) and **already omits** `Cross-device sync` (the `SyncTab` group at `settings-groups.ts:29`). The Export relabel does not touch any eyebrow, so this pin keeps passing — **no rewrite**. (Flagged so future section work on the Sync row knows this pin would need updating.)
- **No existing test pins** `to: "/settings/ai"` (bare) or the "Export everything" → `/settings/privacy` target (confirmed: `settings-groups` has no co-located test; `SettingsPage.test.tsx` never inspects these `to` values). All `settings-groups.ts` edits are additive.

**AAA / title compliance:** every new `it()` title starts with `"should "` (`R-ItTitleShould`) and every body carries the literal `// Arrange` / `// Act` / `// Assert` markers in order (`R-ItBodyAAA`, enforced by `scripts/check-test-aaa.mjs`).

### Tradeoffs (settings anchors)

- **New attribute vs reusing `data-route-heading`:** reusing it would put two `[data-route-heading]` nodes in one page, breaking the "first heading wins" `querySelector` assumption (`use-focus-on-route-change.ts:56`). A distinct keyed-by-value `data-settings-section` keeps the two focus owners orthogonal. Cost: one attribute constant.
- **Constant in a dependency-free module vs in the hook file:** the constant + union live in `settings-section.ts` (not the hook) so a presentational tab never imports from a focus hook — mirroring `routing/constants.ts`. Cost: one tiny extra file.
- **Value-iteration vs `CSS.escape` selector:** iterating `querySelectorAll` + `getAttribute` sidesteps the `CSS.escape` `ReferenceError` under jsdom 29.1.1 (not polyfilled) and works in prod too. Cost: an O(n) scan over a handful of sections — negligible.
- **rAF-only vs `MutationObserver`:** the section hook skips the observer because tab views are statically imported and committed before `?section=` is read. Acceptable now; if a future Settings tab becomes lazy-loaded _and_ section-addressable, the hook would need the observer pattern — noted as a trip-wire.
- **Silent ignore of unknown section vs redirect:** unlike the unknown-`tab` `Redirect` (`SettingsPage.tsx:21`), a bad `?section=` lands at tab top (cosmetic), so matching the heavier path-level treatment would be over-engineering. Cost: a typo'd section link degrades silently.

### Micro-decision + recommended default (settings anchors)

**"Export everything" row (`settings-groups.ts:43`). ✅ ACCEPTED (product, 2026-06-03): RELABEL + RE-POINT to the existing Data Management block — do not remove the row, do not build export.**

```ts
// before (settings-groups.ts:43)
{ icon: "upload", label: "Export everything", to: "/settings/privacy" },
// after
{ icon: "shield", label: "Manage your data", to: "/settings/privacy?section=data-management" },
```

and add `tabIndex={-1}` + `data-settings-section="data-management"` to the inline **Data Management** `<section>` at `PrivacyTab.tsx:52`.

**Why relabel over remove:** the row currently 404s its own promise (no export feature exists) and duplicates the sibling "Data & privacy" row (`settings-groups.ts:42`, same `to`). Re-pointing it to the real Data Management block (the only data-control surface that exists — "Clear All API Keys", `PrivacyTab.tsx:56`) keeps an affordance that does something true and discoverable, satisfies D4, and adds **zero** new feature surface. The `upload` icon (which implies export) is swapped for `shield` (the privacy/data icon already used by the sibling row at line 42). Removing the row is the fallback if product wants a leaner index, but it loses a real affordance. _(If product insists on keeping the word "Export", second-best is to drop this duplicate row entirely — but that loses a slot and is more disruptive.)_

### Risks (settings anchors)

- **wouter query round-trip:** relies on `navigate("/path?query")` preserving the query into `useSearch()`. Established read idiom in this codebase. Low risk.
- **Function-line cap on `AiTab`:** the component is 49/60 lines; adding markers to two `<section>`s lands ~53 after format but is tight. Mitigation: drop the `id` (done) and, if it still crosses 60, extract a wrapper. Must re-check `AiTab` function length after `pnpm format` during apply.
- **Focus-before-paint race:** if a Settings tab becomes a Suspense boundary in the future, the rAF could fire before the section commits and silently no-op. Not possible today (static imports); flagged as a trip-wire.
- **`tabIndex={-1}` on `<section>`:** makes a non-interactive landmark programmatically focusable — the same pattern the route `<h1>` uses (`SettingsPage.tsx:42`) and the accepted a11y idiom for scroll-to-focus anchors. No new lint/a11y violation expected; verify against the zero-IDE-warning policy during apply.
- **jsdom `scrollIntoView`:** unimplemented in jsdom; `applyFocusToElement` catches the throw silently (no telemetry passed), so focus still lands — proven by `apply-focus-to-element.test.ts`. Tests assert `document.activeElement`, not scroll position. Low risk.
- **Coverage:** the new hook + additive page tests keep the 70% frontend threshold satisfied (new code fully exercised; no source deleted).

### Estimated size (settings anchors)

~5 files edited (`SettingsPage.tsx`, `settings-groups.ts`, `AiTab.tsx`, `PrivacyTab.tsx`, `SettingsPage.test.tsx`) / 3 new files (`settings-section.ts`, `use-focus-on-section-change.ts`, `use-focus-on-section-change.test.tsx`) / **0 pinned tests to rewrite** (all test changes additive).
