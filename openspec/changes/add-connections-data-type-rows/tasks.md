## 1. Origin derivation

- [x] 1.1 `application/connections/data-type-routing.ts`: derive
      `sources = enabled import routes ∪ manual (where MANUAL_ENTRY_TYPES has
    the type)`, appending `manual` last so a saved bridge order keeps deciding
      the head. See design.md D1.
- [x] 1.2 Report `none` / `only` / `primary` / `unranked`, taking the ranked
      head from the shared `orderSources` so the pill and
      `resolveEffectiveSource` cannot disagree.
- [x] 1.3 Carry `exportable` from `MANAGED_DATA_REGISTRY[...].capabilities
    .export`, and `sentTo` from enabled export routes only. See design.md D4.
- [x] 1.4 Leave `buildSourcePolicyRows` untouched — its `< 2 sources` skip is
      correct for gating a reorder control and is pinned by its test. See
      design.md D2.

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
