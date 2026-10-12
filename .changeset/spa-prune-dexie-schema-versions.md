---
"@kaiord/workout-spa-editor": patch
---

The local database now declares 21 schema versions instead of 37, so the app builds it about 2.5 times faster at startup. Only the versions that carry a data upgrade are kept, plus the latest one. A browser left on a version that is no longer declared still upgrades to today's schema with all its data, and every data upgrade still runs exactly once. Tests now upgrade a real database from each of the 37 past versions and compare the result with the full version history.
