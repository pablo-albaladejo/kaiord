## Context

The rule (`automatic-authority.ts`) picks a kind's Authority from the import
routes switched on; Connections names it (`buildDataTypeRoutingRows`, origin
`automatic`). Nothing records which Platform decided a kind before, so a
change of Authority cannot be noticed today.

## Decisions

### D1. Remember every Platform that decided a kind, on the athlete

`userPreferences.authorityDeciders`: per kind, every Platform that has decided
it, the one deciding now last. The row is per profile and rides the Drive
snapshot and the backup (as `dismissedCoachMarks` does), so a second device
does not repeat a notice the first one showed; the preferences writers keep
every field they do not know. Optional and unindexed: no Dexie version.
Rejected: a per-device memo (the zones offer's), which repeats on every
device. Rejected: a store of its own, a schema version for a hint.

### D2. What is news

`authorityChanges(rows, seen)` (`application/connections/`), pure:

- A Platform deciding a kind with an Authority (not Activities, planned
  sessions or Workouts), new to that kind's list and with another Platform
  before it, is a notice; it joins the list.
- A kind's first Platform, and a Platform that decided before (back after a
  disconnect), are remembered silently.
- A Platform the athlete chose in the matrix (origin `primary`) is
  remembered silently, so turning the matrix off later says nothing either.
- Own entries are not Platforms and are ignored; a kind no source sends any
  more keeps its list.
- Kinds taken by the same Platform from the same one are one notice
  ("Tanita now decides your weight and body composition…").

Rejected: comparing with the previous render only: a reload, a second device
or the App closed during the connect would miss it or repeat it.

### D3. Where it is read and shown

`useAuthorityChangeNotices` reads, in one live query, the athlete's import
routes, stored choices and `authorityDeciders`, waits for the Capabilities'
read API to be ready (a matrix choice still loading is never read as
Kaiord's), builds the rows with the choices in force, writes the new list and
hands each notice to the component once (a session memo covers the moment
before the write is read back). `AuthorityChangeNotice`, mounted once in
`App.tsx`, shows an info toast for 12 s with one link: `/connections?kind=<kind>`
(the row is brought into view and focused), or the matrix (`capabilityHome`)
while it is on. ADR 0003: no dialog, nothing asked.

### D4. Landing

"Kaiord picks" sentences say "health data" and that activities, planned
sessions and workouts are kept from every source. Proofs:
`automatic-authority.test.ts` asserts the rule is automatic for each health
kind listed literally and `union` for the three kept kinds, so a change to
either fails the claim.

### D5. Feature, not Capability, for the athlete

Only the section label carried the word ("Capabilities" / "Capacidades");
it reads "Features" / "Funciones". `ATHLETE_TERMS` gains
`/\bcapabilit(?:y|ies)\b|\bcapacidad(?:es)?\b/i`; `ATHLETE_ALLOWED` names
the exceptions, each with its reason: the extensions' declared data tokens
in the privacy texts (a different, technical sense), "Capacidad aeróbica" /
"anaeróbica" (zone names), and one developer log line the App-source scan
reads. Routes (`/settings/capabilities`) and identifiers stay.

## Risks

- Two devices open while the athlete connects can each show the notice once
  before the sync carries the list.
- An older build rewriting the preferences row from a fixed list of fields
  can drop the list; the next read then remembers silently (no repeat, no
  notice for that change).
- The notice is worded in the locale active when it fires; the App reads
  English until a Spanish catalogue has loaded.
