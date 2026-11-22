# Permission Justification

Why Kaiord for Garmin asks for each permission in `manifest.prod.json`, for Chrome Web Store review. Every paragraph and list item in this file is an entry in `claims/garmin.json`, with the code or test that proves it.

## Permissions

### `storage`

**Why**: Keep the Garmin tokens across service-worker restarts, so Chrome stopping the worker does not mean signing in again.

**Stored in `chrome.storage.local`**: the OAuth1 token and the OAuth2 access token minted from your Garmin sign-in; the profile summary the Kaiord App sends for the popup's athlete card, with the time and name of the last one received; the app's theme preference (`light`, `dark` or `system`); when the popup last could and could not read from Garmin; a log of the last 25 errors the extension handled without failing; and a switch that turns the activity read off.

**Stored in `chrome.storage.session`** (memory only): the time of the last activity read, so reads are at least 30 seconds apart.

**Sent anywhere**: only the tokens, and only to Garmin. Nothing stored by the extension is sent to Kaiord.

## Host Permissions

### `https://sso.garmin.com/*`

**Why**: Exchange your existing Garmin sign-in for a one-time service ticket. No password is entered or seen by the extension.

### `https://connectapi.garmin.com/*`

**Why**: Garmin's API host. The extension exchanges the ticket for tokens here, then makes every workout, activity, calendar and upload request with `Authorization: Bearer`. A request outside the allowlist of paths in the service worker is refused before it is sent.

**Calendar write and delete**: When you place workouts on your Garmin Connect calendar from the Kaiord App, the extension calls two calendar endpoints on this host. `POST /workout-service/schedule/{workoutId}` places a library workout on a date, sending only that date. `DELETE /workout-service/schedule/{workoutScheduleId}` removes one calendar entry. The allowlist accepts both paths only with a numeric id, and neither path can delete a library workout.

**Calendar read**: To check one workout's calendar entries, the extension calls `GET /calendar-service/year/{year}/month/{month}`. Garmin answers the whole month of your calendar; the extension keeps only the entries of that one workout, and passes back only each entry's id and date. Every other calendar item is discarded inside the extension and never reaches the Kaiord App.

### `https://connect.garmin.com/*`

**Why**: The Garmin Connect site, where you sign in. No request the extension makes is addressed to this host; the popup and the `open-garmin` action only open it in a new tab.

## Content Script

### `kaiord-announce.js` on `https://kaiord.com/*`

**Why**: Tells the Kaiord App that the extension is installed, posting its id, version and capabilities to the page. It reads nothing from the page.

## externally_connectable

### `https://kaiord.com/*`

**Why**: Lets the Kaiord App at https://kaiord.com send messages to the extension. Only this exact origin is declared; subdomains (`www` included) cannot reach the extension, and a message from any other origin gets no answer.

### `http://localhost:5173/*`, `http://localhost:5174/*`

**Why**: Development builds of the Kaiord App only. They are declared in `manifest.json` and absent from the published `manifest.prod.json`.

## Data Handling

- **No password**: The extension never reads, stores, or transmits your Garmin password. It reuses the browser's existing Garmin sign-in to mint a token.
- **Tokens stay in your browser**: The tokens live in `chrome.storage.local` and are sent only to Garmin. No answer the extension gives the Kaiord App contains a token.
- **Requests to Garmin only**: Every request the extension makes goes to `sso.garmin.com` or `connectapi.garmin.com`.
- **No analytics or tracking**: Its error log stays in `chrome.storage.local` and is never sent.
