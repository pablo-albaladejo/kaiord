## ADDED Requirements

### Requirement: Build-consistent, verified precache

The deploy SHALL publish a service worker at `<base>sw.js`. Its precache SHALL list every file the shipped tree serves under `<base>`, except `sw.js` itself, source maps, `version.json`, `AGENTS.md`, `.nojekyll` and `og-image-editor.png`. Each entry's revision SHALL be the SHA-256 of the shipped bytes, computed after the last assembly step that mutates the tree. Files that are not content-hashed SHALL be requested and stored as `<url>?__rev=<revision>`. Install SHALL fetch with `cache: "reload"`, SHALL digest every response, and SHALL fail on any digest that differs from its revision. Install SHALL copy an entry from an existing editor cache when the same request key is found there and its digest matches, and fetch only the rest. The worker SHALL NOT cache any response on first use.

#### Scenario: An installed client starts offline

- **GIVEN** a client controlled by the worker of deploy N
- **WHEN** it starts with no network and opens a lazy route it never opened online
- **THEN** the shell and every chunk SHALL load from deploy N's cache and the route SHALL render

#### Scenario: Stale bytes never become a cache

- **GIVEN** an install of deploy N during which the host serves deploy N-1's bytes for any listed URL
- **WHEN** that entry's digest is compared with its revision
- **THEN** the install SHALL fail, the previous worker SHALL stay active, and no cache named for N SHALL be left holding that entry

#### Scenario: Unchanged files are not downloaded again

- **GIVEN** deploy N+1 whose vendor chunks are byte-identical to deploy N's
- **WHEN** the worker of N+1 installs on a client that holds N's cache
- **THEN** those chunks SHALL be copied from N's cache without a network request

#### Scenario: Requests outside the precache pass through

- **WHEN** the page requests `version.json`, a source map, a cross-origin URL, or any URL under `<base>` that is neither precached nor exactly `<base>` or `<base>index.html`
- **THEN** the worker SHALL NOT respond to it and the browser SHALL fetch it from the network

### Requirement: Client-keyed cache retention

A page under `<base>` SHALL report the URL of its entry module to the worker when it boots and again on every `controllerchange`; a page with no controller SHALL report it to the registration's active worker. The worker SHALL record which cached versions contain that entry in a separate meta entry for each reporting client id. On activation, and after each report, the worker SHALL delete nothing while any live window client whose URL is under `<base>` has no record; window clients outside `<base>` SHALL NOT count as live. Otherwise it SHALL delete an editor cache only when that cache is neither the worker's own nor recorded for a live window client, and SHALL delete only the meta entries of clients that are gone. Lookups SHALL search the worker's own cache first and then every retained editor cache. Writes to that record and deletions SHALL be serialised.

#### Scenario: A window survives two deploys

- **GIVEN** a window running deploy N while deploys N+1 and N+2 are each activated
- **WHEN** the window lazily imports a chunk of N that it never loaded before
- **THEN** the import SHALL resolve from N's cache, and no reload SHALL happen

#### Scenario: An unrecorded window defers deletion

- **GIVEN** a live window whose report has not reached the worker yet
- **WHEN** an activation triggers a prune
- **THEN** no editor cache SHALL be deleted in that round

#### Scenario: A version no live window runs is deleted

- **GIVEN** N's cache, and every window that reported N has closed
- **WHEN** the next activation or report triggers a prune
- **THEN** N's cache SHALL be deleted

### Requirement: Gated, prompted update

The editor SHALL NOT reload on its own while the user has interacted or has unsaved edits. A newer worker SHALL be applied without a prompt only when it is found within 10 seconds of load, before any pointer or key input, with no unsaved edits, and while the worker reports exactly one window client. Otherwise, while a newer worker is waiting, the editor SHALL show a persistent toast titled "New version available" with a "Reload" action ("Nueva versión disponible" and "Recargar" in Spanish). Activating it SHALL go through these steps, in order:

1. While the unsaved-edits flag is set (the same condition that arms `beforeunload`), it SHALL show "Save your changes to update" and stop, without messaging the worker.
2. It SHALL await every pending debounced autosave.
3. It SHALL post `SKIP_WAITING` to the waiting worker.
4. It SHALL reload only the tab where it was activated, once that worker takes control.

The page SHALL check for an update on navigation, when it becomes visible, and every 60 minutes, at most once per 60 minutes.

#### Scenario: A new deploy is found mid-session

- **GIVEN** a controlled tab the user has interacted with
- **WHEN** a newer worker finishes installing
- **THEN** the toast SHALL appear and the tab SHALL NOT reload until the user activates "Reload"

#### Scenario: Unsaved edits block the update

- **GIVEN** the editor with unsaved edits and the update toast shown
- **WHEN** the user activates "Reload"
- **THEN** the editor SHALL show "Save your changes to update", SHALL NOT post `SKIP_WAITING`, and SHALL NOT reload

#### Scenario: Other tabs keep their version unless the schema moved

- **GIVEN** two tabs of the editor, and the user activates "Reload" in one
- **WHEN** the new worker takes control
- **THEN** only that tab SHALL reload. The other SHALL keep working on its previous version, unless the new version upgraded the IndexedDB schema; in that case it SHALL show the stale-code dialog

### Requirement: Stale code never touches a newer database

The editor SHALL treat the database as newer than its code when `Math.floor(nativeVersion / 10)` exceeds `DECLARED_VERNO`. `DECLARED_VERNO` SHALL be a constant captured after the versions are registered and before any open. A native version within the declared major, such as one bumped by Dexie's schema patching, SHALL NOT count as newer.

Before Dexie first opens the database, the editor SHALL read the installed version without requesting an upgrade, and then SHALL handle the result as follows:

- **Absent.** A database that does not exist SHALL be reported as absent, and the probe SHALL leave no database behind.
- **Failed.** A probe that fails for any reason, or that has not settled within about 1.5 seconds, SHALL let boot continue with the normal open, and SHALL NOT show the stale dialog. A probe connection that opens after that deadline SHALL be closed at once.
- **Newer.** The editor SHALL NOT open the database. It SHALL look up the existing registration and request an update. It SHALL show the blocking dialog immediately when no registration exists, or when the update yields no installing or waiting worker. Otherwise it SHALL wait for that worker to become installed or redundant, for at most about 15 seconds. When the worker is installed, the editor SHALL activate it and reload without waiting for a click. While it waits, the blocking dialog SHALL already be shown with its reload action busy, so the screen is never blank. When it becomes redundant or the wait times out, the editor SHALL show the dialog. The reload SHALL happen at most once per session, and a non-stale boot SHALL clear that limit.
- **Otherwise.** The probe SHALL keep its connection open until Dexie's open settles, and SHALL close itself on `versionchange`.

A ready subscriber SHALL be registered before every other ready subscriber, and SHALL check the opened version. If that version is newer, it SHALL throw a `StaleSchemaError`. No later ready subscriber SHALL run, `open()` SHALL reject with that error, every queued query SHALL reject with a `DatabaseClosedError` whose `inner` is that error, and none SHALL hang. Boot SHALL map `StaleSchemaError` to the stale state, not to a storage failure, and SHALL then close the database with auto-reopen disabled.

When a `versionchange` announces a newer version, the editor's handler SHALL close the database with auto-reopen disabled, SHALL enter the stale state, and SHALL return `false` so that Dexie's default handler does not re-enable auto-open. A database delete SHALL keep the existing close-and-reopen behaviour.

The stale dialog SHALL NOT be dismissible. Its title SHALL be "Kaiord was updated in another window", in English and Spanish. It SHALL offer a "Download draft" action whenever an in-memory workout exists. That action SHALL save the workout as a `.krd` file that the editor's import accepts. It SHALL also offer a "Reload" action that activates a newer worker if one exists, and then reloads. Without a registration, the action SHALL be a plain reload. When no newer worker was found, the dialog SHALL say to try again in a few minutes.

#### Scenario: An old shell boots against an upgraded database

- **GIVEN** the database installed at native version 380 or higher, a shell that declares 37, and a newer worker available
- **WHEN** the editor boots
- **THEN** Dexie SHALL NOT open the database, no read or write SHALL reach it, and the editor SHALL activate the newer worker and reload without a dialog

#### Scenario: A schema-patched database is not stale

- **GIVEN** the database installed at native version 371 and a shell that declares 37
- **WHEN** the editor boots
- **THEN** the editor SHALL open the database normally and SHALL NOT enter the stale state

#### Scenario: A later ready subscriber does not hang

- **GIVEN** a database that becomes newer between the probe and Dexie's open, and a promise-returning ready subscriber registered after the stale gate
- **WHEN** Dexie opens
- **THEN** `open()` SHALL reject with `StaleSchemaError`, that subscriber SHALL NOT run, and no pending query SHALL hang

#### Scenario: A first visit creates the database normally

- **GIVEN** no editor database exists
- **WHEN** the editor boots
- **THEN** the probe SHALL report absent and leave no database behind, and Dexie SHALL create the database as a new one

#### Scenario: Another tab upgrades the database

- **GIVEN** an open editor tab, and another tab upgrading the database to native version 380
- **WHEN** the `versionchange` event arrives
- **THEN** the tab SHALL close its connection, the next query SHALL reject with `DatabaseClosedError` without reopening, and the dialog SHALL be shown

#### Scenario: A draft is never stranded

- **GIVEN** the stale dialog shown while the editor holds an unsaved workout
- **WHEN** the user activates "Download draft"
- **THEN** a `.krd` file of that workout SHALL be downloaded, and importing it SHALL restore the workout

### Requirement: Scoped, deferred, production-only registration

The editor SHALL register the service worker only in production builds, only where `navigator.serviceWorker` exists, and never when `navigator.connection.saveData` is true. Registration SHALL happen after the `load` event, when the browser is idle. Its scope SHALL equal the Vite base. The worker SHALL answer navigations only for exactly `<base>` and `<base>index.html` (ignoring the query), and SHALL intercept only same-origin GET requests. A failed registration SHALL be ignored silently. The development server SHALL NOT register a worker. Every Playwright spec SHALL run with service workers blocked, except the Chromium spec tagged `@service-worker`.

#### Scenario: Landing and docs stay uncontrolled

- **GIVEN** a browser controlled at `/app/`
- **WHEN** it navigates to `/` or `/docs/`
- **THEN** no service worker SHALL control those pages

#### Scenario: Save-Data skips the worker

- **GIVEN** a production load with `navigator.connection.saveData` true
- **WHEN** the editor finishes loading
- **THEN** no service worker SHALL be registered

### Requirement: One assembly, guarded last

A single script SHALL assemble the published tree for both the deploy and CI, running these steps in order:

1. merge the dists;
2. write `version.json`;
3. substitute the analytics id;
4. inject the SPA route fallback;
5. emit the legacy `/editor/` page;
6. emit the service worker, which SHALL be the last mutation.

The service-worker dist guard SHALL be the last deploy step before the Pages artifact upload. It SHALL fail when any of these holds:

- `<base>sw.js` is missing;
- its scope differs from the base;
- the manifest is empty;
- the manifest's entries and the files of the shipped `<base>` tree, minus `sw.js` and the files the precache excludes, differ as sets;
- a listed file is missing, or its bytes do not digest to its revision;
- an excluded file is listed;
- the worker's mode (normal or kill) differs from the one the deploy requested.

CI SHALL run the same assembly and the guard over a `/app/` build, and SHALL run the `@service-worker` e2e. Apart from the emitted worker, the assembly SHALL produce a tree byte-identical to the inline deploy steps it replaces. In particular, it SHALL copy top-level dotfiles only where those steps copied them (the landing `.nojekyll`), SHALL write `version.json` as `{"sha":"<sha>"}` followed by a newline, and SHALL fail when an analytics placeholder remains after substitution.

#### Scenario: A rewrite after emit is caught

- **GIVEN** a tree whose `index.html` was modified after the worker was emitted
- **WHEN** the guard runs
- **THEN** it SHALL fail and name `index.html`

#### Scenario: An empty manifest is not a pass

- **GIVEN** an emitted worker whose manifest lists no files
- **WHEN** the guard runs
- **THEN** it SHALL fail

### Requirement: Kill switch

The deploy SHALL emit a self-destructing worker in place of the normal one when the repository variable `SPA_SW_KILL_SWITCH` is `1`. The kill worker SHALL:

- call `skipWaiting` on install;
- on activate, delete every editor cache and unregister itself;
- navigate only the window clients it controls, using `clients.matchAll` with `includeUncontrolled` false;
- never call `clients.claim()`;
- have no fetch handler.

The worker's URL SHALL never change. The procedure SHALL be documented in `docs/runbooks/spa-service-worker.md`, linked from the deploy step. The runbook SHALL include the propagation delay of up to 10 minutes at the edge, and the fact that `navigate()` drops unsaved edits.

#### Scenario: A bad worker is neutralised without a loop

- **GIVEN** a page controlled by a normal worker, and the tree re-assembled in kill mode
- **WHEN** the page checks for an update
- **THEN** the page SHALL navigate exactly once, SHALL end uncontrolled with no registration and no editor caches, and SHALL load from the network
