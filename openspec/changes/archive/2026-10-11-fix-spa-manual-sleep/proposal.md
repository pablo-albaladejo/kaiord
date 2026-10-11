> Completed: 2026-10-11

# Proposal: Manual sleep records hours, not a 0 h night

## Why

The manual wellness entry asked only for a "Sleep score". The SPA stored a
score of 81 as a sleep session of 0 h 0 min (`totalDurationSeconds: 0`,
`startTime = endTime`). The Sleep page showed "0 h 0 min", Daily showed
"SLEEP 0.0h", and the readiness card showed "81 READY — based on your
overnight HRV and sleep" when the 81 was the number the user had typed
(audit finding F-34). The chat tool `log_health_metric` described its sleep
value as hours, but the same mapper stored it as a score.

The root cause is in the domain model. `sleepRecordSchema` required
`totalDurationSeconds`, and it required the stages to sum to it within 60 s.
With `stages: []` the only valid duration was about 0. A hand-entered night
had two options: invent stages, or store a zero-length session. The SPA
stored the zero-length session.

The Sleep, Weight, Recovery and Activity pages also had no way to add a
value. Manual entry was reachable only from Calendar → "+ Add" → Wellness
(F-37).

## What Changes

- `@kaiord/core` `sleepRecordSchema`:
  - `stages: []` means the stages were not recorded. The stage-sum check
    applies only when stages are present.
  - `totalDurationSeconds` is optional. When it is absent, the duration was
    not recorded.
- Manual wellness entry asks for the hours slept (h:mm), an optional score,
  and an optional bedtime and wake time:
  - The duration comes from the hours, or from bedtime → wake time.
  - Hours that disagree with the clock times are refused.
  - A score alone is stored without a duration.
  - A 0-length night is never written.
- The chat tool's sleep value is stored as hours slept.
- Existing rows written as score + `totalDurationSeconds: 0` are read as
  "duration not recorded". There is no migration. The Sleep page shows
  "Duration not recorded" with the score, Daily shows "—", and the calendar
  shows the score.
- The readiness rationale names only the inputs the composite was built
  from, and it says when the sleep score was typed in.
- Each of `/health/{sleep,weight,recovery,activity}` gets an "Add data"
  action. It opens the same dialog for today, focused on that page's metric.
- The health page date windows use the local calendar day, like the
  calendar and Daily. With UTC days, a value entered for today after local
  midnight fell outside the window.
- The dialog copy is localized (EN/ES) in the `health` namespace.

## Impact

- Specs: `health-data` (Sleep Record Sub-Schema), `spa-routing` (Manual
  wellness entry; Daily readiness names its inputs).
- Code: `packages/core` (schema), `packages/workout-spa-editor`.
