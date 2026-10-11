---
"@kaiord/workout-spa-editor": patch
---

A clean browser now starts with a default local profile ("My profile"), so scheduling, wellness, nutrition and preferences work without visiting the athlete page first. The profile is not uploaded to Drive until it is claimed: editing it, syncing against an empty Drive, or (when Drive already holds one profile) merging its data into that profile. With several profiles in Drive, sync asks which one this device belongs to. Source-policy rows no longer collapse into one row on every sync; rows already lost to that collapse before this fix cannot be recovered.
