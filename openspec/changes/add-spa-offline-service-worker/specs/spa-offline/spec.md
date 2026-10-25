## ADDED Requirements

### Requirement: Build-consistent, verified precache

The deploy SHALL publish a service worker at `<base>sw.js`. Its precache SHALL list every file the shipped tree serves under `<base>`, except source maps, `version.json`, `AGENTS.md`, `.nojekyll` and `og-image-editor.png`. Each entry's revision SHALL be the SHA-256 of the shipped bytes, computed after the last assembly step that mutates the tree. Files that are not content-hashed SHALL be requested and stored as `<url>?__rev=<revision>`. Install SHALL fetch with `cache: "reload"`, SHALL digest every response, and SHALL fail on any digest that differs from its revision. Install SHALL copy an entry from an existing editor cache when the same request key is found there and its digest matches, and fetch only the rest. The worker SHALL NOT cache any response on first use.

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

A controlled page SHALL report the URL of its entry module to the worker when it boots. The worker SHALL record which cached versions contain that entry, against the reporting client's id. On activation, and after each report, the worker SHALL delete an editor cache only when it is not the worker's own cache and no live window client is recorded against it. Lookups SHALL search the worker's own cache first and then every retained editor cache. Writes to that record and deletions SHALL be serialised.

#### Scenario: A window survives two deploys

- **GIVEN** a window running deploy N while deploys N+1 and N+2 are each activated
- **WHEN** the window lazily imports a chunk of N that it never loaded before
- **THEN** the import SHALL resolve from N's cache, and no reload SHALL happen

#### Scenario: A version no live window runs is deleted

- **GIVEN** N's cache, and every window that reported N has closed
- **WHEN** the next activation or report triggers a prune
- **THEN** N's cache SHALL be deleted

### Requirement: Gated, prompted update

The editor SHALL NOT reload on its own while the user has interacted or has unsaved edits. A newer worker found within 10 seconds of load, before any pointer or key input, and with no unsaved edits SHALL be applied without a prompt. Otherwise, while a newer worker is waiting, the editor SHALL show a persistent toast titled "New version available" with a "Reload" action ("Nueva versión disponible" and "Recargar" in Spanish). Activating it SHALL go through these steps, in order:

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

Before Dexie first opens the editor database, the editor SHALL read the installed IndexedDB version without requesting an upgrade. If that version is higher than the native version its own code declares, the editor SHALL NOT open the database. It SHALL then look for a newer worker, activate it, and reload, at most once per session, with no dialog. If no newer worker is available, or that reload already happened, it SHALL show the blocking dialog.

When another connection upgrades the database past the declared version mid-session, the editor SHALL close its connection with auto-reopen disabled and SHALL show the blocking dialog.

The dialog SHALL NOT be dismissible. Its title SHALL be "Kaiord was updated in another window" and it SHALL have a "Reload" action, both in English and Spanish. The action SHALL activate a newer worker if one exists, then reload. A database delete SHALL keep the existing close-and-reopen behaviour.

#### Scenario: An old shell boots against an upgraded database

- **GIVEN** the database installed at a version higher than the shell declares, and a newer worker available
- **WHEN** the editor boots
- **THEN** Dexie SHALL NOT open the database, no read or write SHALL reach it, and the editor SHALL activate the newer worker and reload without a dialog

#### Scenario: Another tab upgrades the database

- **GIVEN** an open editor tab, and another tab upgrading the database to a higher version
- **WHEN** the `versionchange` event arrives
- **THEN** the tab SHALL close its connection, the next query SHALL reject without reopening, and the dialog SHALL be shown

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
- the manifest's hashed entries and the non-map files under `assets/` differ as sets;
- a listed file is missing, or its bytes do not digest to its revision;
- an excluded file is listed;
- the worker's mode (normal or kill) differs from the one the deploy requested.

CI SHALL run the same assembly and the guard over a `/app/` build, and SHALL run the `@service-worker` e2e.

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
