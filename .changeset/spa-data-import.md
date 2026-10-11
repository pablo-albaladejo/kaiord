---
"@kaiord/workout-spa-editor": minor
---

Settings → Privacy can now import a backup made with "Export my data". The file is merged into this browser without deleting anything here: the newer copy of each record wins, and records you deleted after the backup stay deleted (nutrition entries are the exception for now and may come back; the summary says so). A clean browser adopts the backup's profile; a backup with several profiles asks which one to join. API keys are never in the file: restored AI providers show "Missing key" until you enter one, and no AI feature uses them meanwhile.
