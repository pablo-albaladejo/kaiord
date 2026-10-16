> Completed: 2026-10-14

# Proposal: Train2Go is a weight source with its own route

## Why

Since 2026-10-14-t2g-weight-is-current-weight the Train2Go zones sync records
the athlete's weight as a `train2go-bridge` weigh-in. But Train2Go had no
weight route: the extension announced only `read:training-plan` and
`read:training-zones`, and the SPA's supported-route table can only narrow the
tokens a bridge announces, never add one. So those weigh-ins were governed by
no integration policy: they could not be switched off from Connections, could
not be ranked under a priority source policy, and only the zones-sync toggle
decided whether they were written.

## What Changes

- The train2go-bridge extension announces `read:body` in both places a
  capability lives (`BRIDGE_MANIFEST` in `background.js` and the announce
  identity in `bridge-identity.js`, kept equal by the bridge-core parity
  guard). Its popup lists Weight among the types it feeds.
- The SPA narrows `train2go-bridge` to `planned-session`, `training-zones` and
  `weight`: `read:body` also spans hrv, daily-wellness, body-composition,
  stress and the wearable types, which Train2Go can never deliver.
- The zones sync is gated by the `weight · import · train2go-bridge` route:
  - route switched off: the weight is neither recorded nor offered as a
    conflict, and an accepted conflict commits no weigh-in;
  - route on: unchanged from today;
  - no route at all (an extension that does not announce `read:body`, or a
    link made before it did): unchanged from today, so nothing regresses for
    athletes who have not updated the extension.
- Linking Train2Go with an extension that announces `read:body` seeds the
  weight route like every other route it feeds, so Train2Go's weight can be
  ranked under a priority source policy and switched off from Connections.

## Impact

- No Dexie schema change, no new capability token (`read:body` already exists).
- The extension change reaches users only with a new extension release; until
  then every athlete is in the "no route" case, which behaves as before.
