# Bridge Adapters

Runtime adapters for extension bridges (Garmin Connect, Train2Go).

## Source of truth

The registry of currently-installed bridges lives in the in-memory
`bridgeDiscovery` singleton (`bridge-discovery.ts`). Bridges announce
themselves on page load via `kaiord-announce.js`, the discovery layer
verifies them with a `ping`, and the result is exposed reactively to
React via the `useDiscoveredBridges` hook
(`useSyncExternalStore` over the singleton).

There is intentionally no Dexie persistence layer for bridges:
keeping a single source of truth (the singleton) avoids the class of
bugs where the SPA reads from one place while the discovery layer
writes to another. The non-regression guard lives in
`bridge-store-persistence-boundary.test.ts`.

## Persistence boundary

- **In-memory (singleton)**: the bridge registry — discovered on every
  SPA load, never persisted.
- **Transient (Zustand)**: the bridge runtime stores
  (`train2go-store`, and any future `garmin-store`) remain in-memory
  — they hold ephemeral UX state (detection result, in-flight
  operations) that MUST NOT be written through the Dexie boundary.

See `CLAUDE.md` ("Editor runtime → Zustand. Persisted data → Dexie.
Local UI → React state.")

## Profile snapshot push

The SPA pushes the active profile to every discovered bridge via
`use-profile-snapshot-push.ts`:

- Content-fingerprint dedup (`fingerprintSnapshot` from `@kaiord/core`)
  collapses identical consecutive pushes to a single transport call.
- A shared `OperationQueue` enforces the 60/h-per-bridge cap mandated
  by the SPA Bridge Protocol spec.
- Each bridge writes `lastPushReceipt` to its own
  `chrome.storage.local` atomically with the snapshot, so the popup
  can render "Last push · N min ago — <name>" without a second round
  trip.
- Deleting the active profile while no bridges are reachable parks a
  `pendingClear` flag; the next tick where bridges are present emits
  `profile-snapshot-clear` to honour right-to-be-forgotten.
