> Completed: 2026-10-13

# Proposal: Thresholds in place, one zone editor at /athlete/zones

## Why

Audit findings P-01 and P-20. Thresholds had three editors: the Athlete
page's "Edit thresholds" dialog, the Profile Manager's "Training Zones" tab,
and the zone editor's own threshold inputs, which saved on every keystroke
(typing 185 stored 1, then 18). The zone editor had no address, so it could not
be linked, reloaded or opened on a given sport. The Athlete tagline named every
sport with a config ("Cyclist · Runner · Swimmer") even with no threshold set.

## What Changes

- The thresholds card on `/athlete` edits FTP, LTHR, threshold pace (CSS for
  swimming) and the maximum heart rate in place, saving on blur or Enter and
  saying "Saved". The threshold dialog is removed; the maximum heart rate moves
  from Body to this card.
- `/athlete/zones/:sport` is the one zone editor: a lazy routed page whose
  sport tabs replace the URL. It shows the thresholds read-only with a link
  back to `/athlete`; the generic sport edits its LTHR there.
- The zones card links to it ("Adjust zones"). The Profile Manager loses its
  zones tab (Personal Data and Linked Accounts remain).
- `updateSportThresholds` accepts an updater merged with what is stored at
  write time, and creates a missing sport config.
- The tagline names only sports with a threshold.

## Impact

- No Dexie schema change.
- verify:prod: F-24/F-25 follow the inline fields and the zones page, F-46b
  expects two tabs, the i18n scan covers the four zones pages, P-19 looks for
  the maximum heart rate in the thresholds card.
