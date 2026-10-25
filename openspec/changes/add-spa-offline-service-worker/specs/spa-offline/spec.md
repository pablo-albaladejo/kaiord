## ADDED Requirements

### Requirement: Build-consistent precache

The deploy SHALL publish a service worker at `<base>sw.js` whose precache lists every file the shipped tree serves under `<base>`, except source maps, `version.json`, `AGENTS.md`, `.nojekyll` and `og-image-editor.png`. Each entry's revision SHALL be the SHA-256 of the shipped bytes, computed after the last deploy step that rewrites `index.html`. The worker SHALL store one deploy in a cache named for that deploy's manifest hash. It SHALL answer precached URLs and in-scope navigations from its caches, and it SHALL NOT cache any response on first use. On activation it SHALL keep its own cache and the previous deploy's, and delete older ones.

#### Scenario: An installed client starts offline

- **GIVEN** a client controlled by the worker of deploy N
- **WHEN** it starts with no network and opens a lazy route it never opened online
- **THEN** the shell and every chunk SHALL load from deploy N's cache and the route SHALL render

#### Scenario: A deploy does not break a running client

- **GIVEN** a client controlled by deploy N, after deploy N+1 removed N's chunks from the host
- **WHEN** the client lazily imports a chunk of N
- **THEN** the import SHALL resolve from N's cache and no chunk-reload recovery SHALL fire

#### Scenario: Requests outside the precache pass through

- **WHEN** the page requests `version.json`, a source map, a cross-origin URL, or a URL outside `<base>`
- **THEN** the worker SHALL NOT respond to it and the browser SHALL fetch it from the network

### Requirement: Prompted update

The editor SHALL NOT reload on its own when a new worker is installed. While a new worker is waiting, it SHALL show a persistent toast titled "New version available" with a "Reload" action ("Nueva versión disponible" and "Recargar" in Spanish). Activating that action SHALL go through the editor's discard-edits confirmation when there are unsaved edits. It SHALL then tell the waiting worker to skip waiting, and reload only the tab where it was clicked once that worker takes control. The page SHALL check for an update when it becomes visible, at most once an hour.

#### Scenario: A new deploy is found

- **GIVEN** a controlled tab with no interaction
- **WHEN** a new worker finishes installing
- **THEN** the toast SHALL appear and the tab SHALL NOT reload until the user activates "Reload"

#### Scenario: Other tabs are not reloaded

- **GIVEN** two tabs of the editor, and the user activates "Reload" in one
- **WHEN** the new worker takes control
- **THEN** only that tab SHALL reload, and the other SHALL keep working on its previous version

### Requirement: Scoped, production-only registration

The editor SHALL register the service worker only in production builds and only where `navigator.serviceWorker` exists, with scope equal to the Vite base. The worker SHALL intercept only same-origin GET requests under that scope. A failed registration SHALL be ignored silently. The development server SHALL NOT register a worker. Every Playwright project SHALL run with service workers blocked, except a Chromium spec dedicated to the worker.

#### Scenario: Landing and docs stay uncontrolled

- **GIVEN** a browser controlled at `/app/`
- **WHEN** it navigates to `/` or `/docs/`
- **THEN** no service worker SHALL control those pages

#### Scenario: Development has no worker

- **WHEN** the editor runs under `vite dev`
- **THEN** no service worker SHALL be registered

### Requirement: Service worker dist guard

A dist guard SHALL run over the tree the deploy publishes, after the worker is generated. It SHALL fail when `<base>sw.js` is missing, when its scope differs from the base, when its manifest is empty, when the manifest and the non-map files under `assets/` differ as sets, when a listed file is missing or its bytes do not match its revision, or when an excluded file is listed.

#### Scenario: A rewrite after generation is caught

- **GIVEN** a tree whose `index.html` was modified after the worker was generated
- **WHEN** the guard runs
- **THEN** it SHALL fail and name `index.html`

#### Scenario: An empty manifest is not a pass

- **GIVEN** a generated worker whose manifest lists no files
- **WHEN** the guard runs
- **THEN** it SHALL fail

### Requirement: Kill switch

The deploy SHALL emit a self-destructing worker in place of the normal one when the repository variable `SPA_SW_KILL_SWITCH` is `1`. The kill worker SHALL activate immediately, delete every editor cache, unregister itself, and navigate open windows so they reload without a worker. It SHALL have no fetch handler. The worker's URL SHALL never change, so every client can receive the kill worker. The procedure SHALL be documented in `docs/runbooks/spa-service-worker.md`, linked from the deploy step.

#### Scenario: A bad worker is neutralised

- **GIVEN** clients controlled by a faulty worker, and the variable set to `1`
- **WHEN** the deploy runs and a client next checks for an update
- **THEN** the client SHALL end with no registration and no editor caches, and SHALL load from the network

### Requirement: Stale code never touches a newer database

Before Dexie first opens the editor database, the editor SHALL read the installed IndexedDB version without requesting an upgrade. If that version is higher than the one its own code declares, it SHALL NOT open the database. When another connection upgrades the database past the declared version, the editor SHALL close its connection without auto-reopen. In both cases it SHALL show a blocking "Kaiord was updated in another window" dialog with a "Reload" action (en and es). The action SHALL activate a waiting worker if one exists, then reload. A database delete SHALL keep the existing close-and-reopen behaviour.

#### Scenario: An old shell starts against an upgraded database

- **GIVEN** the database installed at a version higher than the shell declares
- **WHEN** the editor boots
- **THEN** Dexie SHALL NOT open the database, no read or write SHALL reach it, and the dialog SHALL be shown

#### Scenario: Another tab upgrades the database

- **GIVEN** an open editor tab, and another tab upgrading the database to a higher version
- **WHEN** the `versionchange` event arrives
- **THEN** the tab SHALL close its connection, the next query SHALL reject without reopening, and the dialog SHALL be shown
