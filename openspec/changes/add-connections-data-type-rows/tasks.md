## 1. Origin derivation

- [x] 1.1 `application/connections/data-type-routing.ts`: derive
      `sources = enabled import routes ∪ manual (where MANUAL_ENTRY_TYPES has
the type)`, appending `manual` last so a saved bridge order keeps deciding
      the head. See design.md D1.
- [x] 1.2 Report `none` / `only` / `primary` / `unranked` /
      `rankedUnavailable`, taking the ranked head as the first saved entry
      still available — the element `resolveEffectiveSource` picks — so the
      pill and the resolver cannot disagree.
- [x] 1.3 Carry `exportable` from `MANAGED_DATA_REGISTRY[...].capabilities
.export`, and `sentTo` from enabled export routes only. See design.md D4.
- [x] 1.4 Leave `buildSourcePolicyRows` untouched — its `< 2 sources` skip is
      correct for gating a reorder control and is pinned by its test. See
      design.md D2.
- [x] 1.5 Stop naming `sources[0]` when a `priority` policy's saved order pins
      none of the available sources. Reachable through the chat tool (ids that
      pass its raw-length check and then fail to resolve) and through the Data
      Hub (rank a bridge, then switch its import off). See design.md D1a.
- [x] 1.6 Refuse the write that mints that state: `applySourcePolicy` returns
      `unresolvable_source_order` and persists nothing unless EVERY named source
      resolves — a partial drop silently promotes a source the request ranked
      lower. See design.md D1b.
- [x] 1.7 Consult the mode for a single source too, so a ranked order excluding
      the lone source reports `rankedUnavailable` instead of naming it. See
      design.md D1c.
- [x] 1.8 Give `rankedUnavailable` its own label, note and amber ring rather
      than folding it into `unranked`, whose note says the opposite. See
      design.md D1d.
- [x] 1.9 Render both explanatory notes as visible text; drop the native
      `title`, which no keyboard user can reach. See design.md D1e.
- [x] 1.10 Comment the manual-source asymmetry: this derivation gates `manual`
      on `MANUAL_ENTRY_TYPES` while `resolveEffectiveSource` exempts it
      unconditionally, so adding a manual path without updating that set makes
      pill and resolver diverge silently.
- [x] 1.11 Rebuild the test fixtures on capability-legal routes and name the
      writer that creates each state; four described routes the capability gate
      forbids. See design.md D4a.
- [x] 1.12 Populate `syncedAt` in the freshness tests — the spec'd "no owning
      source, no time" scenario ran against an empty map and could not fail.

## 2. Grouping

- [x] 2.1 `application/connections/data-type-groups.ts`: Training / Recovery /
      Body as an SPA-side constant.
- [x] 2.2 `data-type-groups.test.ts`: assert the partition in both directions —
      every managed type grouped exactly once, and no group entry the domain no
      longer manages. See design.md D5.

## 3. Hooks

- [x] 3.1 Extract the `dataTypeSourcePolicy` live query out of
      `useSourcePolicies` into `hooks/data-hub/use-data-type-source-policies.ts`;
      both consumers read the same query.
- [x] 3.2 `hooks/connections/use-data-type-routing.ts`: take `byDataType` from
      the page rather than opening a second `useDataFlows` subscription, and read
      freshness with `useBridgeSyncStates` rather than through the Data Hub
      matrix. See design.md D3.

## 4. UI

- [x] 4.1 `DataTypeRoutingSection` / `DataTypeRoutingGroup` /
      `DataTypeRoutingRow`, each row addressable as `routing-row-<dataType>` and
      exposing its origin kind as `data-origin`.
- [x] 4.2 `RoutingFreshness`: name the source as the subject; render nothing
      without a stored timestamp.
- [x] 4.3 Omit the "Also sent to" affordance on the eleven types with no export
      capability; say "Nowhere" only where an export route could exist.
- [x] 4.4 Mount the section in `ConnectionsTab` under the source cards, reusing
      the page's single `useDataFlows` result.
- [x] 4.5 Theme tokens only (`bg-surface`, `border-edge`, `text-ink-*`) — the
      design's palette would trip `check-theme-dialect`.

## 5. Copy

- [x] 5.1 `connections.routing.*` in `en` and `es`, including the header hint
      that states freshness is per source.
- [x] 5.2 `connections.dataTypeHints.*` for all thirteen types in both locales,
      written from what each schema carries (`daily-wellness` is steps /
      calories / intensity minutes, not "body battery", which nothing ingests).
- [x] 5.3 Extend `connections-data-types.test.ts` to the hint catalog.

## 6. Verification

- [x] 6.1 `pnpm -r build`
- [x] 6.2 SPA `pnpm test` and `pnpm lint` (`tsc -b --noEmit`)
- [x] 6.3 `pnpm test:scripts`, root `pnpm lint`, `pnpm lint:specs`
- [x] 6.4 `npx playwright test --list`
