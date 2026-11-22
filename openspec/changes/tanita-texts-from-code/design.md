## Context

`claims-register` (#1625) set the pattern on Garmin. Tanita is the first
extension to register a section of a file another register already holds:
the privacy policy.

## Decisions

### D1. Describe the expensive check, do not fix it here

The popup's `checkSession` and the external `ping` / `checkSession` actions
call the same `GET /en/user/export-csv` the import uses, so each check
downloads the athlete's whole history (`docs/connectors-research/tanita.md`).
The texts say so plainly. Making the check cheap is #1643; this ticket changes
no behaviour.

The review notes also said every App re-check downloads the export. The code
says otherwise: the Kaiord App never calls `checkSession` on Tanita
(`checkTanitaSession` has no caller; `tanita-bridge` is absent from
`SESSION_PROBES`). The App reads the export when the calendar mounts with a
Tanita import route on, and on "Sync now". The listing says that.

### D2. Ownership per section, not a Tanita entry in garmin.json

- **A.** Add "Kaiord for Tanita Extension" to the policy surface in
  `garmin.json` and put the Tanita policy claims there: what the README
  allowed, but every extension ticket would then edit `garmin.json`, which
  defeats "one file per group so parallel tickets edit different files".
- **B.** Key ownership by file and section or key. Two registers still cannot
  hold the same section, and a whole-file surface still cannot share its file.

B is chosen.

### D3. Spec delta as ADDED, not MODIFIED

The "Privacy policy content" requirement holds a Tanita bullet that says the
extension "stores no data locally" and performs "only a single fixed
read-only export request". A MODIFIED copy of that whole requirement already
lives in `bridges-exact-app-origin`, and parallel tickets would add more;
archiving them in turn would overwrite each other. This change ADDS a Tanita
requirement instead. When archiving, the stale Tanita bullet of "Privacy
policy content" is dropped in favour of it.
