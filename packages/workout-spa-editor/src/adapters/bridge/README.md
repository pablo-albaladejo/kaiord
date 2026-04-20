# Bridge Adapters

Runtime adapters for extension bridges (Garmin Connect, Train2Go). The
registry tracks each bridge's lifecycle (`verified` → `unavailable` →
`removed`) and persists it to Dexie via `dexie-bridge-repository.ts` so
the 24h timers survive browser restarts.

## Persistence boundary

- **Persisted (Dexie)**: the bridge registry — one row per extension
  keyed by `extensionId`, carrying `status`, `lastSeen`, `removedAt`
  and `failCount`. The lifecycle timers anchor on these fields.
- **Transient (Zustand)**: the bridge runtime stores
  (`train2go-store`, and any future `garmin-store`) remain in-memory
  — they hold ephemeral UX state (detection result, in-flight
  operations) that MUST NOT be written through the Dexie boundary.
  The non-regression guard lives in
  `bridge-store-persistence-boundary.test.ts`.

See `CLAUDE.md` ("Editor runtime → Zustand. Persisted data → Dexie.
Local UI → React state.") and the proposal's Dexie-vs-Zustand
boundary clause in `openspec/changes/fix-spec-code-drift/`.

## Wall-clock caveat (lifecycle timers)

The 24h-unavailable and 24h-removed intervals are measured against
`Date.now()` / `new Date(lastSeen).getTime()` — wall-clock time.

- A user whose system clock jumps (daylight-savings, NTP correction,
  laptop resume from sleep) can see earlier or later transitions than
  exactly 24h. This is acceptable; the spec allows approximate
  lifecycle transitions.
- We SHALL NOT substitute `performance.now()` here, because that clock
  resets on every browser session and the whole point of the Dexie
  persistence is to survive reloads.

## State machine

```
verified ──(3 failed heartbeats)──► unavailable
                                    │
                                    │  24h elapsed since lastSeen
                                    ▼
                                 removed   (notifier fires)
                                    │
                                    │  24h elapsed since removedAt
                                    ▼
                                 deleted   (row leaves map + repo)
```

A successful heartbeat from any non-`verified` state clears
`failCount`, resets `removedAt`, and returns the bridge to
`verified`.
