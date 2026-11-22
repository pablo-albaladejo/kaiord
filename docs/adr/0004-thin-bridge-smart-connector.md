---
status: accepted
---

# A Bridge only lends the Session; the Connector holds the logic

A Bridge is unbundled extension code that reaches the athlete only after a store review, and every Bridge once stayed broken for about eleven weeks without any guard noticing. So a Bridge does one thing: it lends the athlete's Session and executes requests from a closed list of allowed paths. What to ask for, how to read the answer, retries and the mapping to KRD live in the Connector, inside the Kaiord App, where they are typed, tested and shipped without a store release.

## Consequences

- A Bridge accepts messages from the exact origin of the Kaiord App and from no other, subdomains included.
- The Kaiord App accepts the previous version of the Bridge protocol, so an outdated Bridge keeps working while it updates.
- Writes are safe by construction: Kaiord keeps a record of what it created on each Platform, never deletes or overwrites anything outside that record, and sending twice does not duplicate. The live state is read before a write is decided.
- A nightly canary reads through every published Bridge with real accounts, and sends and withdraws a test Workout on Garmin. A failure is reported the same day.
- Checking whether there is a Session uses the cheapest request there is. It never downloads the athlete's data and never mints a token; a token is minted only when it is about to be used.
- When something is wrong, the athlete sees one notice naming the consequence, with one of four fixes: Install, Update, Sign in to the Platform, Try again. The wording is one, shared by the Kaiord App and the extensions, in English and Spanish.
- Connecting a Platform opens its store listing directly; the Kaiord App notices the extension without a reload and carries on by itself. WHOOP appears only after the athlete activates the experimental Capability.
- When a Bridge works, its popup still shows what is useful to the athlete from that Platform, such as the coach's notes or zones. This is in tension with the rule above that a Bridge holds no logic and that checking fetches nothing: where that information comes from without the Bridge fetching and presenting it by itself is not decided.
