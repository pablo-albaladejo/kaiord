# Runbook: the Kaiord App's service worker

The Kaiord App (`https://kaiord.com/app/`) ships a service worker,
`/app/sw.js`, so it opens with no network. It is emitted by
`scripts/assemble-site.mjs` as the last assembly step and checked by
`scripts/check-spa-service-worker.mjs` as the last step of
`.github/workflows/deploy-site.yml` before the Pages upload. Design:
`openspec/changes/add-spa-offline-service-worker/design.md` (D1-D8), or its
archived copy.

## Prerequisites

- Repository admin rights, for the repository variable `SPA_SW_KILL_SWITCH`.
  Setting a variable is the repo-settings class of `CLAUDE.md`: Pablo runs
  it, never an agent.
- `gh` signed in to `pablo-albaladejo/kaiord`.

## Normal flow

1. A push to `main` runs the deploy. The worker lists every file under
   `app/` with the SHA-256 of its shipped bytes.
2. A browser that already runs the App finds the new `sw.js` on its next
   navigation, when the tab becomes visible, or within the hourly check.
3. The new worker installs in the background. It copies unchanged files
   from the previous cache and downloads the rest. Any byte that differs
   from the manifest fails the install, and the browser keeps the running
   version and tries again on the next check.
4. If the App was opened less than 10 s ago, with no input, nothing unsaved
   and one window, the update applies silently. Otherwise the athlete sees
   "New version available · Reload". Unsaved edits block it with "Save your
   changes to update". Only the tab that clicks reloads.

## Symptoms that call for the kill switch

- The App shows a blank page or an error on every load for athletes who
  visited before, while a private window works.
- The App keeps showing an old version after several deploys and the update
  prompt never appears.
- `curl -s https://kaiord.com/app/sw.js | head -c 300` shows a worker you
  did not expect, or the guard was bypassed.

## Turning the kill switch on

1. Set the variable and re-run the deploy (Pablo, with `!`):

   ```bash
   gh variable set SPA_SW_KILL_SWITCH --body 1 -R pablo-albaladejo/kaiord
   gh workflow run deploy-site.yml -R pablo-albaladejo/kaiord --ref main
   ```

2. The deploy emits the kill worker. The guard step then expects mode
   `kill` and fails the deploy on a normal worker, or on a kill worker with
   a fetch handler or a `clients.claim()`.
3. Check what Pages serves:

   ```bash
   curl -s https://kaiord.com/app/sw.js | head -n 1
   # const SW = {"mode":"kill","scope":"/app/"};
   ```

## What the athlete sees, and how long it takes

- The edge caches `/app/sw.js` for up to 10 minutes (`max-age=600`), so the
  kill worker reaches browsers up to about 10 minutes after the deploy.
- A browser picks it up on its next navigation to `/app/`, when an open tab
  becomes visible, or within its 60-minute check.
- The kill worker deletes every `kaiord-app-*` cache, unregisters itself and
  reloads each window it controls, once. **That reload drops unsaved edits**
  in those windows: saved data in IndexedDB is untouched.
- A reloaded window loads from the network. It registers `sw.js` again, gets
  the kill worker again, which finds no window to reload and unregisters, so
  it cannot loop.

## Failure modes and recovery

- **The deploy fails at "Check the App's service worker".** The tree changed
  after the worker was emitted, or the emitter missed a file. Fix the
  assembly step that wrote last; never move the guard or skip it.
- **The kill worker does not reach a device.** Wait out the 10-minute edge
  delay, then open `/app/` once. As a last resort, on that device: site
  settings for `kaiord.com` → clear data, or DevTools → Application →
  Service workers → Unregister. Clearing site data also deletes the App's
  IndexedDB: export a backup first.
- **A worker is broken but the kill switch was not deployed yet.** Reverting
  the change on `main` is not enough: a registered worker survives the host
  ceasing to serve it. Use the kill switch.

## Rollback (turning the kill switch off)

```bash
gh variable delete SPA_SW_KILL_SWITCH -R pablo-albaladejo/kaiord
gh workflow run deploy-site.yml -R pablo-albaladejo/kaiord --ref main
```

The next deploy emits the normal worker again; browsers register it on
their next visit.

## Invariant

The URL `/app/sw.js` is never renamed. The kill switch reaches browsers only
because they keep checking that URL.
