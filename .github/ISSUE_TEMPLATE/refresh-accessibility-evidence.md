---
name: Refresh accessibility evidence
about: Quarterly re-capture of AT transcripts and screenshots for focus management
title: "chore(a11y): refresh focus-management AT evidence — [QUARTER]"
labels: accessibility, maintenance
assignees: ""
---

## Accessibility evidence refresh — quarterly

This issue is opened automatically on the first day of each quarter by the
`accessibility-evidence-refresh.yml` workflow.

**Due date:** _Fill in: trigger date + 14 days_

---

## Checklist

### 1. VoiceOver (macOS)

- [ ] Enable VoiceOver (⌘F5).
- [ ] Open Accessibility Inspector (Xcode → Open Developer Tool).
- [ ] Enable Speech panel with timestamps.
- [ ] Load the editor with `e2e/fixtures/focus-workout.krd.json`.
- [ ] Perform the action sequence: Delete → Paste → Undo → Group → Ungroup.
- [ ] Export log: File → Save Log. Name it `voiceover-macos.log`.
- [ ] Paste timestamped events into `voiceover-macos.md` with action annotations.
- [ ] Update pinned versions in `README.md` (macOS + Safari versions).

### 2. NVDA (Windows)

- [ ] Set NVDA log level to Debug (NVDA menu → Preferences → Settings → General).
- [ ] Restart NVDA.
- [ ] Load the editor with `e2e/fixtures/focus-workout.krd.json`.
- [ ] Perform the same action sequence: Delete → Paste → Undo → Group → Ungroup.
- [ ] Filter `%APPDATA%\nvda\nvda.log` for `speakText`/`speakMessage` lines.
- [ ] Copy filtered lines into `nvda-windows.md` with action annotations.
- [ ] Reset NVDA log level to Info.
- [ ] Update pinned versions in `README.md` (NVDA + Windows + Firefox versions).

### 3. Screenshots

- [ ] Capture Accessibility Inspector screenshots (macOS) for each action.
- [ ] Capture NVDA Speech Viewer screenshots (Windows) for each action.
- [ ] Save screenshots under `docs/accessibility-evidence/<date>-focus-management/screenshots/`.

### 4. Acceptance criteria

- [ ] New transcripts diff against the previous baseline at ≤ 10% changed lines
  (timestamp drift only — no structural announcement changes).
- [ ] If > 10% changed, investigate and document whether the change is a
  regression or an expected improvement.

### 5. PR

- [ ] Open a PR updating `docs/accessibility-evidence/` with the fresh evidence.
- [ ] Reference this issue in the PR description.
- [ ] Close this issue after the PR is merged.

---

## Evidence directory

`packages/workout-spa-editor/docs/accessibility-evidence/<date>-focus-management/`

## Reference

See the full runbook in `README.md` inside the evidence directory.
