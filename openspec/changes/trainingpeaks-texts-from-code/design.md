## Context

The TrainingPeaks texts described a body-metrics reader. The code also writes
Workouts to the athlete's TrainingPeaks calendar, and every session check
mints and stores a token. No text said either.

## Decisions

### D1. Disclose the Workout write and the token, prove both

`test/token-confinement.test.js` in the bridge proves the token is kept in
`chrome.storage.local`, minted on every session check, in no answer to an
external action, and sent only to `tpapi.trainingpeaks.com`, and that the
allowlist has no `DELETE`, `PUT` or `PATCH`. A Kaiord App test proves a
Workout is placed on its own day.

### D2. Say only what the App uses

- **A.** Keep "weight and more" and the weight write the bridge accepts:
  both describe capability the Kaiord App never uses.
- **B.** Say the App reads weight only, and that the bridge accepts a weight
  write the App does not send today.

B is chosen: a listing describes what the athlete gets, and a policy what
the code may do.

### D3. Split the shared policy by section

As for Train2Go, the TrainingPeaks section of the privacy policy is owned by
`claims/trainingpeaks.json` while other sections stay with their own
register files.
