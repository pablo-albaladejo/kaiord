# Permission Justification

Why Kaiord for TrainingPeaks asks for each permission in `manifest.prod.json`, for Chrome Web Store review. Every paragraph and list item in this file is an entry in `claims/trainingpeaks.json`, with the code or test that proves it.

## Permissions

### `storage`

**Why**: Keep the TrainingPeaks access token across service-worker restarts, so a request made before the token expires reuses it.

**Stored in `chrome.storage.local`**: the access token, the time it expires and your TrainingPeaks athlete number; the app's theme preference (`light`, `dark` or `system`); and when the popup last could and could not use your TrainingPeaks sign-in.

**Sent anywhere**: the token only to TrainingPeaks. The athlete number is also given to the Kaiord App just before it places a workout, which needs it. Nothing else the extension stores leaves your browser.

## Host Permissions

### `https://tpapi.trainingpeaks.com/*`

**Why**: TrainingPeaks' API host. Every request the extension makes goes here, from its service worker: the token exchange, which only the extension makes, and the four requests the Kaiord App may ask for. A request outside these five, or a write whose body is not the one shape declared for it, is refused before it is sent:

- `GET /users/v3/token` exchanges your TrainingPeaks sign-in for an access token. It carries your TrainingPeaks cookie (`credentials: "include"`) and no `Authorization` header; Chrome attaches the cookie, and the extension cannot read it.
- `GET /metrics/v3/athletes/{id}/consolidatedtimedmetrics/{start}/{end}` reads the metrics you logged over a date range. The answer may include metrics other than weight, such as pulse, sleep or steps; the extension passes it to the Kaiord App unread, and the Kaiord App keeps only your weight.
- `POST /fitness/v6/athletes/{id}/workouts` adds a workout you send from the Kaiord App to your TrainingPeaks calendar.
- `GET /fitness/v6/athletes/{id}/workouts/{workoutId}` reads one workout the Kaiord App sent earlier, to learn whether TrainingPeaks still has it before that workout is sent again. TrainingPeaks' answer reaches the Kaiord App in your browser, which keeps only the workout's id and day and drops the rest there.
- `POST /metrics/v3/athletes/{id}/consolidatedtimedmetric` adds one weight measurement. The extension accepts this request, but the Kaiord App does not send it today.

Every request except the token exchange carries the token as `Authorization: Bearer` and no cookies (`credentials: "omit"`).

## Content Script

### `kaiord-announce.js` on `https://kaiord.com/*`

**Why**: Tells the Kaiord App that the extension is installed, posting its id, version and capabilities to the page. It reads nothing from the page. No content script runs on TrainingPeaks pages.

## externally_connectable

### `https://kaiord.com/*`

**Why**: Lets the Kaiord App at https://kaiord.com send messages to the extension. Only this exact origin is declared; subdomains (`www` included) cannot reach the extension, and a message from any other origin gets no answer.

### `http://localhost:5173/*`, `http://localhost:5174/*`

**Why**: Development builds of the Kaiord App only. They are declared in `manifest.json` and absent from the published `manifest.prod.json`.

## Data Handling

- **No password**: The extension never reads, stores, or transmits your TrainingPeaks password. It reuses the browser's existing TrainingPeaks sign-in to get a token.
- **No cookie access**: The extension does not declare the `cookies` permission and cannot read your TrainingPeaks cookie; Chrome attaches it to the token request and to no other.
- **Token stays in your browser**: The token lives in `chrome.storage.local` and is sent only to TrainingPeaks. No answer the extension gives the Kaiord App contains it.
- **Sign-in secrets removed from answers**: Before the extension hands the Kaiord App an answer, it removes anything in it tied to your TrainingPeaks sign-in: each form field and meta tag named as a token, CSRF, session or nonce value, an inline CSRF token's value, and each JSON entry named as a token, key, password, cookie or session id. TrainingPeaks' answers carry none today.
- **Requests to TrainingPeaks only**: Every request the extension makes goes to `tpapi.trainingpeaks.com`. Opening TrainingPeaks from the popup only opens `https://app.trainingpeaks.com/` in a new tab.
- **No analytics or tracking**: The extension has no analytics, error reporting or telemetry.
