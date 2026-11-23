## Why

The athlete cannot see what a run of the assistant did, when, with what
result or at what cost (#1670, stories 76 and 77; #1652). The App keeps
monthly usage events and prints a debug line per generation, and neither is
something the athlete can read or keep. The owner's value "Observability"
asks that whoever uses Kaiord can see who reached what of theirs and when,
our own agents included.

## What Changes

- **One Trace per run of the assistant** (a chat turn, a workout generation,
  a batch, a lab document read), stored only on the athlete's device in a new
  Dexie store `traces` (schema v38). It holds when, which feature, the
  Provider and model, the versioned prompt unit the run used, each Tool called
  with whether the athlete confirmed it and how it ended, the retries, the
  latency, the outcome, `priceRun`'s `RunCost` per model as is, and which
  kinds of data went to which Provider, read from the data-flow registry.
  Never a message, prompt, document or model answer.
- **Never sent.** `traces` is device-local: out of the Drive sync snapshot
  and out of a backup file, and neither can write one.
- **Kept bounded.** The newest 200, none older than 90 days, applied after
  every write. The athlete deletes them all in Settings, Privacy; wiping the
  App's data deletes them too.
- **Read and export.** Settings, Privacy lists the Traces, opens each one and
  exports them all as one JSON file (`kaiord-traces`), English and Spanish.
- **The inventory** lists the Traces as data kept on this device.
- **The generation's debug line goes**: the Trace holds what it printed.
  The usage events stay, as the synced monthly cost the Usage tab and the
  batch estimate read, and now name their Trace by `traceId`.
- The privacy policy states it; its check gains a rule.

## Capabilities

### New Capabilities

- `spa-ai-trace`: the Trace, its writer, retention, the Settings view, the
  export and the device-only guarantee.

### Modified Capabilities

- `privacy-policy`: the policy discloses the Traces.

## Impact

- `@kaiord/workout-spa-editor` (private): `types/trace-schemas.ts`,
  `application/trace/`, the Dexie store and v38, the snapshot device-local
  set, the backup policy, the chat turn, `generateWorkoutKrd`, the batch
  runner, the lab extraction, Settings, Privacy, `settings` and `dataFlows`
  dictionaries, one new e2e spec.
- `claims/data-flows.json` (the inventory's new sentence, English and Spanish).
- `packages/docs/legal/privacy-policy.md` and its check.
- `@kaiord/ai` unchanged.
