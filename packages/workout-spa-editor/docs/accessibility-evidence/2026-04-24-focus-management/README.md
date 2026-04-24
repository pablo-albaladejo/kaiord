# Focus Management AT Evidence — 2026-04-24

This directory contains assistive-technology capture logs and screenshots for
the focus-management hardening change. Evidence covers: delete, paste, undo,
group, and ungroup actions on the fixture workout.

## Fixture

`packages/workout-spa-editor/e2e/fixtures/focus-workout.krd.json`
(committed in task 5.1.a — load this file in the editor before capturing).

## Captured evidence

| File | Description |
|------|-------------|
| `voiceover-macos.md` | VoiceOver (macOS) transcript with timestamps |
| `nvda-windows.md` | NVDA (Windows) transcript with timestamps |
| `screenshots/` | Accessibility Inspector (macOS) + NVDA speech-viewer screenshots |

## Pinned versions at capture time

> **Note:** Transcripts in this directory require physical AT capture.
> See the **Regeneration runbook** below for exact procedures.
> When captures are recorded, update this table with the actual versions.

| Aspect | Version |
|--------|---------|
| macOS | _(to be filled at capture time)_ |
| VoiceOver | _(matches macOS)_ |
| Safari | _(to be filled at capture time)_ |
| NVDA | _(to be filled at capture time)_ |
| Windows | _(to be filled at capture time)_ |
| Firefox | _(to be filled at capture time)_ |

## Regeneration runbook

### VoiceOver (macOS)

1. Enable VoiceOver: press **⌘F5** (or Touch ID triple-press on MacBook).
2. Open **Accessibility Inspector** via Xcode → Open Developer Tool → Accessibility Inspector.
3. In Accessibility Inspector: enable the **Speech** panel and tick **Show timestamps**.
4. Load the editor with the fixture workout (`focus-workout.krd.json`).
5. Perform the action sequence in order:
   - Select first step → Delete via keyboard (Backspace / Delete key)
   - Paste (⌘V)
   - Undo (⌘Z)
   - Group two steps into a repetition block (context menu → Group)
   - Ungroup the block (context menu → Ungroup)
6. Stop recording. In Accessibility Inspector Speech panel: **File → Save Log**.
   Name the file `voiceover-macos.log` with an ISO date prefix.
7. Copy the timestamped speech events into `voiceover-macos.md` with
   annotations describing the expected announcement for each action.
8. Update the pinned-versions table above with exact macOS + Safari versions
   from System Information.

### NVDA (Windows)

Two options for timestamped capture (prefer Option A):

**Option A — NVDA debug log (no extra dependencies):**

1. NVDA menu → Preferences → Settings → General → Logging level: **Debug**.
2. Restart NVDA to apply.
3. Load the editor with the fixture workout.
4. Perform the same action sequence as VoiceOver above.
5. Open `%APPDATA%\nvda\nvda.log`. Filter lines containing `speakText` or
   `speakMessage` — these carry timestamps and the spoken text.
6. Copy the filtered lines into `nvda-windows.md` with action annotations.
7. Reset NVDA logging level to **Info** after capture.

**Option B — SpeechLogger add-on:**

1. Install the **SpeechLogger** NVDA add-on (no-dependency timestamped log).
2. Enable it. Perform the action sequence.
3. SpeechLogger writes a timestamped speech file; copy it to `nvda-windows.log`.
4. Summarise in `nvda-windows.md`.

> The NVDA Speech Viewer UI does NOT include timestamps natively; options A/B
> are required for timestamped evidence. Speech Viewer screenshots are still
> valuable — save them under `screenshots/`.

Update the pinned-versions table above with exact NVDA + Windows + Firefox
versions after capture.

## Acceptance criteria for a fresh contributor

A contributor following this runbook produces transcripts that diff against the
committed baseline at **≤ 10% changed lines** (mostly timestamp drift — not
structural changes in which elements are announced or in what order).

## Validity window

Evidence is considered valid for AT + OS + browser versions within **one major
release** of the pinned version in this README. Outside that window the
quarterly refresh cron (or a dependency-bump-triggered manual refresh)
re-captures evidence against then-current versions.

## Quarterly refresh

A GitHub Actions workflow (`accessibility-evidence-refresh.yml`) opens an
issue on the first day of each quarter to trigger a fresh capture. See
`.github/workflows/accessibility-evidence-refresh.yml`.
