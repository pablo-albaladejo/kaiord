> Completed: 2026-10-15

# Proposal: the AI settings page shows what runs

## Why

An audit of `/settings/ai` in production (2026-10-15) found the page saying
things that were not true:

1. Each model row showed the first provider and the first catalog model, not
   what the resolver actually runs. With no bindings the rows read
   "Mi Claude / claude-haiku-4-5-20251001" while chat ran another model.
2. Changing only the provider of a row stored the binding with `modelId: ""`;
   chat then ran with an empty model.
3. Two "default" concepts competed: the provider-level "Default" badge (the
   `isDefault` flag) and the athlete's `default` binding. The binding wins in
   the resolver, so the badge lied as soon as both existed.
4. Editing a provider put the decrypted API key back into the DOM as the
   value of the password field.
5. Removing a provider asked nothing and left its bindings behind.
6. A binding cleared ("Same as main model") or removed with its provider came
   back from another device on the next sync: composite-key bindings had no
   tombstone.
7. The workout generator's model select showed the `isDefault` account, while
   generation ran the athlete's binding, and its choice was never read.

## What Changes

- One main model: the athlete's `default` binding. The provider badge and the
  "Set Default" button are gone; `isDefault` stays only as the resolver's
  internal fallback when the athlete has no binding.
- Every model row is ONE select of account and model together (one group
  per account, plus "Custom…"), so a provider can no longer be stored without
  a model. Each select shows the effective resolution; a purpose without its
  own binding shows "Same as main model (<model> · <account>)", and choosing
  that option clears the override.
- `setModelBinding` rejects a blank model id; the resolver treats a stored
  blank model as unset and runs the bound provider's model, which heals the
  rows already stored empty.
- A provider row shows the key's last four characters only; editing opens an
  empty key field, and leaving it empty keeps the stored key.
- Remove asks for confirmation, and removing a provider deletes every
  athlete's bindings that pointed at it.
- The Settings index names the account the athlete's main model runs on.
- Deleting a binding records a tombstone `<profileId>:<purpose>`, so the merge
  and the sync's import stop resurrecting it; a later re-set still wins.
- The workout generator's model select is the same select for the
  `workout_generation` purpose: it shows what runs and stores the choice.

## Impact

- `@kaiord/ai`: `resolveModelForPurpose` heals blank bound models (patch).
- `@kaiord/workout-spa-editor`: AI settings tab, workout generator model
  select, `setModelBinding`, `removeProvider`, binding tombstones; `setDefaultProvider` is removed (no caller is left).
- No Dexie schema change. The layout redesign is a separate change.
