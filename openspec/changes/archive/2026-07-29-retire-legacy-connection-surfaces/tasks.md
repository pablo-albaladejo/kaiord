> Tasks: 27 completed, 0 deferred

## 1. Redirect the retired paths

- [x] 1.1 Add `retiredSectionTarget` to `settings-tab-views.tsx`, mapping `data-hub` and `extensions` to `connections`, and drop both from `SettingsTab`, `TAB_ORDER` and `TAB_VIEWS`.
- [x] 1.2 In `SettingsPage.tsx`, resolve a retired section to `<Redirect replace>` on `/settings/connections` before the unknown-section fallback to `/settings`.
- [x] 1.3 Remove the `extensions` and `dataHub` rows from `settings-groups.ts`.
- [x] 1.4 Unit-test the redirect by rendering at the OLD path: assert the Connections panel and that history holds exactly `/settings/connections` (proves `replace`). Assert a genuinely unknown section still lands on the index.
- [x] 1.5 e2e: `settings.spec.ts` navigates to `/settings/extensions` and `/settings/data-hub` and asserts the URL settles on `/settings/connections`; assert the index no longer renders the two rows.

## 2. Delete the retired UI

- [x] 2.1 Delete `organisms/DataHub/**` (14 files) and `SettingsPanel/{ExtensionsTab,BridgeStatusRow,BridgeStatusRow.test,TanitaGarminSyncCard}`.
- [x] 2.2 Delete the `AthleteConnections` row tree: `AthleteConnections`, `index.ts`, `ConnectedRow`, `AvailableRow`, `ApiKeyRow`, `ApiKeyRowHeader`, `NotSupportedRow` (+test), `connection-config` (+test).
- [x] 2.3 Move the five surviving files out of the retired folder: `ConnectionMark`, `DisconnectConfirmation`, `ApiKeyConnectForm` (+test) and `data-flow-lookup` (+test) to `organisms/Connections/`, `use-policy-toggle` to `hooks/connections/`. Delete the empty folder.
- [x] 2.4 Delete `hooks/data-hub/use-{data-hub-matrix,data-hub-toggle,data-hub-route-editor,source-policies,source-policy-editor}` and the route-editor test.
- [x] 2.5 Move `orderSources` to `application/connections/order-sources.ts` with the applicable half of its test; delete `application/data-hub/source-policy-rows.{ts,test.ts}` and its two caller-less exports.
- [x] 2.6 Preserve the per-provider mechanism assertions the deleted `connection-config.test.ts` carried by re-pinning them on `INTEGRATION_REGISTRY`, so the `athlete-connections` "Mechanism per current provider" scenario keeps mechanical backing.
- [x] 2.7 Delete the `data-hub` i18n namespace in EN and ES, and the `extensions` / `bodyCompositionSync` / `rows.{dataHub,extensions}` / `tabs.{data-hub,extensions}` keys from both `settings.json` files.
- [x] 2.8 Sweep every namespace for keys present in both locales that nothing references. Remove the one pre-existing orphan found (`library.staleDialog.*`, added by `add-i18n-foundation` and never wired).

## 3. Athlete page

- [x] 3.1 Remove `AthleteConnections` from `AthletePageBody`.
- [x] 3.2 Unit-test that the profile body renders and carries no Connections heading — waiting for the body first, so the assertion cannot pass on the spinner.
- [x] 3.3 Repoint `e2e/profiles.spec.ts`, which asserted the section was visible, and delete `e2e/data-flows-density.spec.ts` (its whole subject is gone).

## 4. Tanita → Garmin export

- [x] 4.1 Add `Connections/ConnectionBodyExport.tsx` wrapping `useTanitaGarminSync`, rendered by `ConnectionManagePanel` for `tanita-bridge` only (design.md D2).
- [x] 4.2 Move the copy to the `connections` namespace as `manage.bodyExport` + `manage.bodyExportStatus.*` in both locales, folding the separate reauth hint into the `needsReauth` line.
- [x] 4.3 Repoint `e2e/tanita-garmin-sync-via-policy.spec.ts` at the Tanita card's Manage panel; both the fires-and-ledgers case and the fail-closed kill test keep their assertions.

## 5. Documentation and stale prose

- [x] 5.1 `docs/navigation-map.md`: route table, Athlete screen block, Settings screen block, component inventory and the retirement note. Also corrects drift that predates this change (the section list was missing `connections`; the inventory named a `SettingsSidebar` that does not exist; the attention slots were described as permanently empty).
- [x] 5.2 Close the two open findings in `docs/navigation-fix-plan.md` and `docs/navigation-implementation-readiness.md` that prescribe work on `AvailableRow` / `/settings/extensions`.
- [x] 5.3 Refresh the docblocks that describe retired surfaces in `AppRoutes`, `types/connection`, `manual-entry-types`, `ProfileTabs`, `application/data-hub/*`, `hooks/data-hub/use-bridge-sync-states` and `hooks/connections/use-data-type-routing`.

## 6. Spec sync

- [x] 6.1 `spa-connections-page`: add the retired-path requirement.
- [x] 6.2 `athlete-connections`: drop the retired-page framing and the connect-opens-the-provider-site behaviour the code never had.
- [x] 6.3 `spa-routing`: Settings is a routed page, not a meta modal.
- [x] 6.4 `spa-persistence-port`: stop asserting a user-triggered route deletion that has no producer (design.md D5).
- [x] 6.5 Archive the six shipped changes of the programme plus this one; refresh `archive/README.md` and the specs inventory.
