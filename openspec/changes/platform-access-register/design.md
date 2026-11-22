## Context

ADR 0002 accepts reaching every Platform through the athlete's own Session
on condition that the risk is declared. The register is that declaration.

## Decisions

### D1. Report what the terms say, draw no conclusion

- **A.** State whether Kaiord's access breaks each Platform's terms: that is
  legal advice and would read as Kaiord's position.
- **B.** Quote narrowly, link and date each reading, and say plainly when a
  Platform's terms could not be read (Tanita).

B is chosen. The page says it is not legal advice.

### D2. Quotes of terms are external claims, read again in time

A quote of a Platform's terms cannot be proven by a test in this repository.
Its register entry is `kind: "external"`, carries the URL read and the
`read_on` date, and the claims guard fails when the reading is older than 180
days. The page states the date of the reading, and a docs test holds every
`read_on` in `claims/platform-access.json` equal to it.

### D3. What is lost comes from the Connectors, not from memory

"What you lose if access is cut off" lists what each Connector reads and
writes today, each line proven by the test of that read or write.
