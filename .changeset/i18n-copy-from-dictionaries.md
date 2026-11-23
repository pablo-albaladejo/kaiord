---
"@kaiord/workout-spa-editor": patch
---

Every string the athlete reads in the Kaiord App now comes from the English and Spanish dictionaries, and `pnpm lint` fails on one typed into the code. The remaining English surfaces are translated: toasts, import and file errors, the zones-conflict and repetition-block dialogs, Train2Go sport names, trend metric names, the swim step editor, the activity dialog and the TrainingPeaks send refusals. An import failure is worded in the athlete's language around the converter's own detail, which stays in English until each converter reports a stable code.
