## Context

#1651 left `priceRun` returning a `RunCost` per run, and the telemetry
events carry every request. #1655 left the data-flow registry
(`application/data-flows/`) as the one list of what can go where, and the
per-Provider health decision. The App had no record per run the athlete can
read: `usageEvents` are a synced monthly summary, and generation printed a
`console.debug` line.

## Decisions

### D1. A run is what the athlete started, not what the model was called for

A chat turn runs from the athlete's message to the reply, across any action
the athlete confirms or refuses in between (each resume is another model
call of the same turn). A batch is one run however many workouts it
generates. A workout the chat generates through `create_workout` belongs to
that chat turn's Trace. So the App opens a `TraceRun` where the athlete
starts something and closes it where that settles; every model call inside
reports through the run's telemetry sink. `generateWorkoutKrd` takes the run
it belongs to, and opens its own when given none, so no generation can be
left without a Trace.

Rejected: one Trace per telemetry event (it splits a confirmed action from
its turn and a batch into dozens), and an ambient "current Trace" (a
concurrent generation in another screen would join the wrong run).

### D2. What a Trace holds

`{ id, feature, startedAt, finishedAt, latencyMs, outcome, modelCalls,
retries, units, tools, cost, totalUsd, sent }`, `.strict()` and parsed at the
single write.

- `units`: the versioned prompt unit of each model call, deduplicated:
  `agentId`, `agentVersion`, `promptId`, `promptVersion` for a generate
  agent; the chat prompt version for a chat turn.
- `tools`: each Tool called, with `confirmation` (`athlete`, `automatic` for
  the auto-approved Garmin send, `not_needed` for a read Tool) and `result`
  (`ok`, `refused`, `failed`, `unanswered` when the athlete left with the
  action waiting). Never its input or output.
- `cost`: `priceRun`'s `RunCost`, as is, one per model the run reached (a
  chat turn that generates a workout may reach two). `totalUsd` is null when
  any is unknown.
- `retries`: a generate run's retry reasons; a chat turn has none.
- `outcome`: `failed` when any model call failed or the run threw, `stopped`
  when it was stopped, `ok` otherwise. A batch fails only when nothing in it
  went through; its failed attempts are in its cost.
- `sent`: per Provider, the kinds the flow carries in the registry
  (`kindsSent(flow, healthSent)`), less its health kinds when the athlete did
  not let them go. It names what the flow can carry, not a field-by-field
  audit of the request: an athlete with no custom instructions still reads
  "your instructions for the AI" for a generation.

### D3. Device only

The store `traces` is in the snapshot port's `DEVICE_LOCAL` set, so a sync
export leaves it out and a sync import never touches it, and `exclude` in the
backup policy, so a file neither carries nor restores it. No write is
tombstoned. The export is a file the athlete saves; nothing sends it.

### D4. Retention

The newest 200, none started more than 90 days ago, applied after each
write (`pruneTraces`). A Trace is a few hundred bytes, so the store stays
under a few hundred kilobytes. The athlete deletes all of them in Settings,
Privacy; "Delete all data" clears the store with every other one. A Trace is
not per athlete profile: deleting a profile does not delete Traces, which
name no profile.

### D5. The name

GLOSSARY.md: "Trace", and "Traza" in Spanish, in both dictionaries and the
UX glossary; never "log" or "registro".

### D6. What stays

`usageEvents` stay as they are: synced, monthly, read by the Usage tab, the
assistant card and the batch estimate. Each now carries the Trace's id as
its `traceId`. The generation `console.debug` line is removed: its phase
timings and retries are in the Trace.

## Risks

- A turn left while an action waits is closed on leaving the conversation;
  closing the tab first leaves no Trace for that turn.
- `sent` is the flow's declared kinds (D2), coarser than the request.
