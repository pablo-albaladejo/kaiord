---
"@kaiord/workout-spa-editor": patch
---

Fix a lost-update race when pinning lab dashboard parameters in quick
succession: the toggle computed the new selection from the rendered
live-query snapshot, so a second pin arriving before the re-emission
overwrote the first. Pins now read the current persisted selection through
a dedicated use case and rapid toggles are serialized. Also stabilize the
Athlete threshold-persistence e2e by waiting for the background Dexie write
to commit before reloading.
