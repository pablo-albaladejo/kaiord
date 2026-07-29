## 1. One definition of a type's sources

- [x] 1.1 `application/connections/data-type-sources.ts`: move
      `availableSources`, `rankedHead`, `toIntegrationId` and `MANUAL_SOURCE_ID`
      out of `data-type-routing.ts`, which now imports them. The pill and the
      control must range over the same set or the row can name a source the
      control cannot offer. See design.md D3.
- [x] 1.2 Keep `rankedHead`'s contract explicit in its own comment: the first
      SAVED entry still available, never `orderSources(...)[0]`, which appends
      sources the resolver never reaches.
- [x] 1.3 Leave `buildSourcePolicyRows` and its `< 2 sources` skip untouched.

## 2. What the control may offer and what it stores

- [x] 2.1 `application/connections/source-of-truth-options.ts`:
      `buildSourceOfTruthOptions` → `{ mode, choices, current }`, with `current`
      derived by `rankedHead` so the marked choice is the one
      `resolveEffectiveSource` consults. See design.md D3.
- [x] 2.2 `canServe`: filter candidates by `bridgeSupportsRoute` AND the
      announced wire token. Chat `enable_route` has no capability check
      (issue #1085), so an enabled route exists for pairings the Data Hub
      renders `na`. See design.md D5.
- [x] 2.3 Treat `null` capabilities as unverified, not incapable — an enabled
      route whose extension is not running still owns records the resolver
      reads. See design.md D5.
- [x] 2.4 `canChooseSource`: two or more sources, or one under a stored ranking.
      The `priority` half exists for reversibility, not symmetry — a `>= 2` rule
      alone strands a ranked type whose second source is switched off. A ranked
      row with NO source left is excluded: both modes read nothing there and the
      panel could only describe a ranking problem the row does not have. See
      design.md D2.
- [x] 2.5 `promoteSource`: reuse `orderSources` to COMPOSE the stored order
      (`[picked, ...the rest]`), never to read a head out of one. After the write
      every source really is in the order. See design.md D3.
- [x] 2.6 Add NO runtime guard against an empty stored order: `picked` is always
      one of `choices` and the control is absent where there is nothing to pick,
      so the state has no construction site. A guard against an unreachable state
      is the same defect as a test aimed at one. See design.md D4.

## 3. Write path

- [x] 3.1 `hooks/connections/use-source-of-truth-editor.ts`: `pick` and
      `keepAll` through `persistence.dataTypeSourcePolicy.put` — the same port
      the chat tool writes. No new write path, no new table.
- [x] 3.2 `keepAll` clears `sourceOrder`, as `useSourcePolicyEditor` already
      does, so a stale ranking cannot decide the type again.
- [x] 3.3 `use-data-type-routing.ts` returns the per-type options, reading
      capabilities inside the memo keyed on the connection rows (the
      `useConnectionSources` shape), so nothing re-reads discovery on every render.

## 4. UI

- [x] 4.1 `RoutingSourcePicker`: a disclosure that stores nothing on open; the
      consequence sits above the buttons that would cause it.
- [x] 4.2 `RoutingSourceChoices`: "Keep every source" first and always, peers
      with the sources, `aria-pressed` on the current one.
- [x] 4.3 `routing-change-copy.ts` `pickerIntro`: three intros — unranked (state + consequence + reversal), ranked (what it reads today, no warning),
      ranked-to-nothing (nothing is being read, pick one). See design.md D1a.
- [x] 4.4 Thread `profileId` and the options map through
      `DataTypeRoutingSection` → `Group` → `Row`; render the control only when
      `canChooseSource`.
- [x] 4.5 Theme tokens only (`border-edge`, `border-edge-soft`,
      `bg-surface-page`, `text-ink-*`, `text-accent`) — `check-theme-dialect`
      rejects a bare `border` with no colour token.

## 5. Copy

- [x] 5.1 `connections.routing.change.*` in `en` and `es`, both in one commit
      (`resource-parity.test.ts`).
- [x] 5.2 The unranked intro names the row's own data type, states today's
      behaviour AND the new one, and states the reversal. See design.md D1.

## 6. Verification

- [x] 6.1 Each test states the reachable state it fails on and the writer that
      creates it: the Data Hub cell toggle, its priority editor, chat
      `set_source_policy`, chat `enable_route`, or this control.
- [x] 6.2 Mutate each guard in turn and record the failing test — proof the tests
      are not vacuous. Table in design.md D6.
- [x] 6.3 `pnpm -r build`
- [x] 6.4 SPA `pnpm test` and `pnpm lint` (`tsc -b --noEmit`)
- [x] 6.5 `pnpm test:scripts`, root `pnpm lint`, `pnpm lint:specs`
- [x] 6.6 `npx playwright test --list`
