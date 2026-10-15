> Completed: 2026-10-15

# Proposal: the AI settings page leads with the athlete's assistant

## Why

With the AI settings telling the truth (`ai-settings-truth`), the page was
still laid out around providers rather than around what the athlete uses.
The production audit of 2026-10-15 found:

1. The main model sat in a long "Models" list next to three per-task rows
   that most athletes never change, and the page never said which athlete
   those choices belong to, nor that accounts are shared by all athletes.
2. Models were listed by raw ids, with dated snapshots duplicating their
   aliases (`claude-haiku-4-5` and `claude-haiku-4-5-20251001`).
3. The add form was always open, required a label, kept the previous type
   selected and left "Saved, but the key could not be checked" behind after
   a successful add.
4. Nothing said whether a stored key was ever accepted by its provider.
5. The custom instructions were written on every keystroke, with no sign of
   being saved.
6. On a 390px screen the provider type was clipped next to three buttons.
7. The Settings index row for AI named an account, not the model in use.

## What Changes

- "Your assistant (for <athlete>)" card first: the main model by its product
  name, the account it runs on, the key status (verified / not checked /
  missing), this month's requests, tokens and estimated cost, and the main
  model select.
- "AI accounts", stated as shared by every athlete: each row shows the label,
  the provider (unless the label already names it), the masked key and its
  status, "Replace key", and an overflow menu with Rename and Remove (with
  confirmation). "Add account" reveals the form; the label is optional and
  defaults to the provider's name, numbered when taken ("Anthropic 2"); a
  stored key closes the form, which reopens blank.
- The outcome of the key check is stored with the account (`keyCheck`), so
  the status survives a reload.
- "Advanced: model per task (for <athlete>)" is collapsed while every task
  follows the main model and opens by itself when one has its own.
- Custom instructions save after a pause in typing or when the field is left,
  and say "Saved ✓" (or that saving failed).
- Model names come from `@kaiord/ai` (`modelDisplayName`, `listedModels`):
  product names, dated snapshots of a listed alias left out; a custom id is
  still accepted.
- The Settings index row for AI names the main model.

## Impact

- `@kaiord/ai`: `modelDisplayName` and `listedModels` (minor).
- `@kaiord/workout-spa-editor`: AI settings layout, optional account label,
  stored key-check outcome, autosaved instructions, index row (minor).
- No Dexie schema change: `keyCheck` is an optional field of the provider row.
