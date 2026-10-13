> Completed: 2026-10-13

# Proposal: The Athletes page replaces the Profile Manager

## Why

Audit findings P-15, P-23 and P-24. Athletes were managed in a modal, the
Profile Manager, that had grown into a second Athlete page: its list, its
create form, its personal-data tab and its import/export all lived behind
"Edit profile" on `/athlete` and "Manage athletes…" in the account menu, which
opened yet another dialog. Switching athlete took four clicks. The per-athlete
export sat next to the full backup with no word on which file was which. The
copy said "profile" where the rest of the app says "athlete", the privacy text
named two of the six connections, and the AI usage panel spoke of a "batch
run".

## What Changes

- `/athletes` is a lazy routed page that lists every athlete on this browser,
  marks the active one, and creates, renames in place, makes active, deletes
  (behind a confirmation, never the last one), imports and exports one athlete.
  It points to Settings → Data for the full backup.
- The account menu's "Manage athletes…" and the `/athlete` empty state go to
  `/athletes`. The athlete's name is renamed in place on `/athlete`; height,
  birth date, sex, resting heart rate and activity level are edited in the Body
  section.
- The Profile Manager organism, its two dialogs on `/athlete`, the
  ManageAthletesDialog and the unused `profile-storage` and `secure-storage`
  modules are deleted.
- The per-athlete export downloads as `athlete-<name>.json`.
- Copy in English and Spanish follows the glossary: Athlete/Atleta instead of
  profile, Connections instead of linked integrations. The privacy text names
  every connection and the AI usage empty state says what fills it.

## Impact

- No Dexie schema change. `importProfile` still keeps zones and personal data.
- verify:prod: F-46b checks the Body section on `/athlete`, the i18n scan
  covers `/athletes`, and the gate checks look for the new copy.
