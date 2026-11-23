# Permission Justification

Why Kaiord for Tanita asks for each permission in `manifest.prod.json`, for Chrome Web Store review. Every paragraph and list item in this file is an entry in `claims/tanita.json`, with the code or test that proves it.

## Permissions

### `storage`

**Why**: Remember, between popup opens, when the extension last could and could not reach your MyTANITA export, so the popup can say since when it has been unable to; and keep the Kaiord App's theme preference, so the popup matches it.

**Stored in `chrome.storage.local`**: `bridgeHealth`, the time of the last check that reached the export and the time of the first check that failed after it; and `kaiordTheme`, the theme preference (`light`, `dark` or `system`). The popup also copies the theme into its own `localStorage`, so it opens in the right theme at once. No measurement, export, cookie or password is stored.

**Sent anywhere**: nothing the extension stores is sent anywhere.

## Host Permissions

### `https://mytanita.eu/*`

**Why**: The extension's service worker makes requests to one address, `https://mytanita.eu/en/user/export-csv`: a `GET` that downloads the export, and a `HEAD` that asks only whether you are signed in. Both are sent with `credentials: "include"` so that Chrome attaches your MyTANITA sign-in cookie. A request to any other path, or with any other method, is refused before it is sent.

**What MyTANITA answers**: to the `GET`, your whole measurement history. When the Kaiord App asks for it (`read-export-csv`), the extension hands it over unchanged. To the `HEAD`, sent when the popup opens, when you press Refresh, and when anything asks whether it can reach MyTANITA (`ping`, `checkSession`), only headers: the extension keeps only whether you are signed in, and no measurement is downloaded.

## Content Script

### `kaiord-announce.js` on `https://kaiord.com/*`

**Why**: Tells the Kaiord App that the extension is installed, posting its id, version and capabilities to the page. It reads nothing from the page.

The extension runs no script on `mytanita.eu`.

## externally_connectable

### `https://kaiord.com/*`

**Why**: Lets the Kaiord App at https://kaiord.com send messages to the extension. Only this exact origin is declared; subdomains (`www` included) cannot reach the extension, and a message from any other origin gets no answer.

### `http://localhost:5173/*`, `http://localhost:5174/*`

**Why**: Development builds of the Kaiord App only. They are declared in `manifest.json` and absent from the published `manifest.prod.json`.

## Data Handling

- **No password**: The extension never reads, stores, or transmits your MyTANITA password. It reuses your existing MyTANITA sign-in in Chrome.
- **No cookie access**: The extension does not declare the `cookies` permission and cannot read your MyTANITA session cookie; Chrome attaches it to the request without exposing it to the extension.
- **The export is passed on, not kept**: The extension hands the export to the Kaiord App as MyTANITA sent it and never writes it to storage.
- **Requests to MyTANITA only**: Every request the extension makes goes to `https://mytanita.eu/en/user/export-csv`.
- **No analytics or tracking**: The extension contains no analytics, error reporting or tracking, and sends nothing anywhere else.
