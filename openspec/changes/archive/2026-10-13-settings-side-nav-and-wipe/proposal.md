> Completed: 2026-10-13

# Proposal: The Settings index is the side nav, and Data offers a full wipe

## Why

The Settings index had 11 rows grouped under headings, and several rows led to
the same page: three rows opened Preferences, two opened Privacy. The rail
listed 8 sections with other names, so the index and the rail never matched
(audit findings P-10, P-11). Wiping the browser was not offered anywhere: the
only destructive control cleared API keys (P-12).

## What Changes

- Six pages: General, AI, Sync, Data & backup, Privacy, About. Connections stays
  as a seventh entry, set apart, until it moves out of Settings.
- The index lists exactly the rail's entries, in the rail's order, under the
  same names, each with its own icon. General (language, units, notifications,
  theme) is edited inline on the index, without opening a page.
- Usage moves into the AI page; export, import and the API-key clear move from
  Privacy to Data & backup; "Replay tips" and the docs link move to About.
- Retired section names redirect, replacing the history entry: `preferences` to
  `general`, `usage` to `ai?section=usage`, `extensions` and `data-hub` to
  `connections`, `privacy?section=data-management` to `data`.
- Data & backup gains "Delete all my data": a typed, localized confirmation word;
  it stops sync, empties every IndexedDB store by enumerating the database
  (writing no tombstone), clears this origin's localStorage and sessionStorage,
  and reloads into first run. The Google Drive copy is kept and the dialog says
  so.

## Impact

- A later sync after a wipe re-imports the Drive copy rather than deleting it,
  because nothing removed by the wipe is recorded as a delete.
- Other tabs of the app keep their in-memory state until they are reloaded.
