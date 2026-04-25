# NVDA (Windows) Transcript — Focus Management

> **Status:** Pending physical capture.
> Follow the runbook in `README.md` to record this evidence.

## Capture metadata

| Field             | Value                                                           |
| ----------------- | --------------------------------------------------------------- |
| Captured by       | _(to be filled)_                                                |
| Capture date      | _(to be filled)_                                                |
| Windows version   | _(to be filled)_                                                |
| NVDA version      | _(to be filled)_                                                |
| Browser + version | _(to be filled)_                                                |
| Capture method    | _(Option A: NVDA debug log / Option B: SpeechLogger — fill in)_ |
| Fixture           | `focus-workout.krd.json`                                        |

## Transcript

_(Paste the timestamped speech events from the NVDA debug log or SpeechLogger
here. Format: `[HH:MM:SS.mmm] <spoken text>` followed by an annotation line.)_

### Action: Delete first step

```text
[00:00:00.000] (expected: focus announced on the step that was selected)
[00:00:00.000] (expected: deletion announced, focus moves to next step or Add Step button)
```

### Action: Paste

```text
[00:00:00.000] (expected: paste announced, focus moves to the pasted step)
```

### Action: Undo

```text
[00:00:00.000] (expected: undo announced, focus returns to expected target)
```

### Action: Group two steps into a repetition block

```text
[00:00:00.000] (expected: block creation announced, focus moves to the new block)
```

### Action: Ungroup the repetition block

```text
[00:00:00.000] (expected: ungroup announced, focus moves to first ungrouped step)
```
