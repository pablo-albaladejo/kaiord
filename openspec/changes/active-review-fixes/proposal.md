## Why

Code review of the active-changes block (#1670; tickets #1633, #1634, #1635,
#1618, #1636). Writes to an athlete's Garmin calendar could take over and
later delete an entry the athlete placed, and a flickering calendar read
could leave two entries. A silent service-worker update could reload over
unsaved work. The TrainingPeaks limit notice and refusal were wrong when the
browser is ahead of the account's time zone. English written by an
extension or a library still reached the athlete, and the two copy lint
rules could be bypassed by ordinary code. A2A was described as served
although it is not deployed, and the Garmin public texts were behind the
code.

## What Changes

Each fix is recorded in the open change it belongs to; this change carries
what belongs to none of them (the i18n change is archived) and the index of
the pass:

- **Garmin** (`add-garmin-calendar-scheduling`, design "Ownership and
  flickering reads"): `created`/`recognized` facts on each calendar entry,
  revival of an entry a read left out, one live read; texts and claims.
- **Service worker** (`add-spa-offline-service-worker`): one registry of
  unsaved work, more kinds of input for the silent update, and the CSP
  `worker-src` decision.
- **TrainingPeaks** (`add-trainingpeaks-workout-push`): the notice and
  refusal in the account's time zone; the copy check as an application use
  case over the shared live-state decision.
- **A2A** (`add-a2a-endpoint`): every public sentence says the endpoint is
  not deployed yet; the owner's Cloudflare scripts tracked, dry run by
  default.
- **Athlete copy (this change):** extension and library failures are typed
  reasons worded from the dictionaries; an unrecognised failure names the
  consequence and "Try again"; the copy lint rules close the bypasses they
  can close without false positives, and the allow list's single letters
  and file types are scoped to the surfaces they belong to.
- **Structure:** layering fixes (an adapter wording copy, a duplicated date
  formatter, a six-argument helper, English locale defaults, type
  re-exports) and root scripts split under the line cap.

## Impact

`packages/workout-spa-editor` (application, hooks, components, i18n),
`scripts/` (eslint rules, service-worker emitter and guard),
`packages/docs/legal/privacy-policy.md`, the Garmin and TrainingPeaks store
texts, `claims/`, `packages/mcp-worker/ops/`, and the four open changes.
Nothing is deployed or published.
