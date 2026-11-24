# Chrome Web Store Listing

The **Short Description** and **Detailed Description** below are a registered
claims surface: every paragraph and list item in them is an entry in
[`claims/garmin.json`](../../claims/garmin.json) with the code or test that
proves it, and `pnpm lint:claims` fails on any sentence that is not. See
[`claims/README.md`](../../claims/README.md).

## Extension Name

Kaiord for Garmin

## Short Description (132 chars max)

Lets the Kaiord App send workouts to Garmin Connect and read your activities, using your own Garmin sign-in

## Detailed Description

Kaiord for Garmin connects the Kaiord App (https://kaiord.com/app) to your Garmin Connect account. You sign in to Garmin Connect in Chrome as usual; the extension never sees your password.

What it does:

• Sends the workouts you create in the Kaiord App to your Garmin Connect workout library.
• Places those workouts on their day in your Garmin Connect calendar, and moves them when the date changes. It removes only calendar entries Kaiord itself placed, never one you added. It never deletes anything from your Garmin Connect workout library: when you change a workout and send it again, Kaiord adds the new version and the earlier one stays in your library.
• Reads your 20 most recent Garmin Connect activities for the Kaiord App.
• Uploads a body-composition measurement (your weight and related values) to Garmin Connect when you send one from the Kaiord App.
• Shows in its popup whether it can currently read from Garmin Connect.

How it works:

1. Sign in to Garmin Connect in Chrome.
2. The extension exchanges that sign-in for Garmin access tokens. No password is entered or seen.
3. Open the Kaiord App and send a workout.

Your tokens and your data:

• The Garmin tokens are kept in your browser (chrome.storage.local) and are sent only to Garmin. They never travel to Kaiord.
• The extension sends requests only to Garmin, and answers only the Kaiord App at https://kaiord.com.
• Before it hands the Kaiord App an answer, the extension removes anything in it tied to your Garmin sign-in: a field named as a token, CSRF, session or nonce value, or a JSON entry named as a token, key, password, cookie or session id. Garmin's answers carry none today.
• It also removes the personal details the Kaiord App does not read: a workout's author (your name and profile pictures), an activity's owner names and pictures and the places it started and ended, and any field named as your name, birth date, gender, email, phone or address.
• No analytics and no tracking. The extension keeps a short log of its own errors in your browser and sends it nowhere.
• Removing the extension from Chrome deletes everything it stored.
• Access through your own Garmin sign-in is unofficial: it is not a Garmin partner API, and it can stop working without notice.
• Open source: https://github.com/pablo-albaladejo/kaiord

## Short Description, Spanish (132 chars max)

Permite que Kaiord App envíe entrenamientos a Garmin Connect y lea tus actividades, con tu propio inicio de sesión de Garmin

## Detailed Description, Spanish

Kaiord for Garmin conecta Kaiord App (https://kaiord.com/app) con tu cuenta de Garmin Connect. Inicias sesión en Garmin Connect en Chrome como siempre; la extensión nunca ve tu contraseña.

Qué hace:

• Envía los entrenamientos que creas en Kaiord App a tu biblioteca de entrenamientos de Garmin Connect.
• Coloca esos entrenamientos en su día en tu calendario de Garmin Connect, y los mueve cuando cambia la fecha. Solo quita las entradas del calendario que puso el propio Kaiord, nunca una que añadieras tú. Nunca borra nada de tu biblioteca de entrenamientos de Garmin Connect: cuando cambias un entrenamiento y lo envías de nuevo, Kaiord añade la versión nueva y la anterior se queda en tu biblioteca.
• Lee tus 20 actividades más recientes de Garmin Connect para Kaiord App.
• Sube una medición de composición corporal (tu peso y los valores relacionados) a Garmin Connect cuando envías una desde Kaiord App.
• Muestra en su ventana emergente si ahora mismo puede leer de Garmin Connect.

Cómo funciona:

1. Inicia sesión en Garmin Connect en Chrome.
2. La extensión cambia ese inicio de sesión por tokens de acceso de Garmin. No se introduce ni se ve ninguna contraseña.
3. Abre Kaiord App y envía un entrenamiento.

Tus tokens y tus datos:

• Los tokens de Garmin se guardan en tu navegador (chrome.storage.local) y solo se envían a Garmin. Nunca viajan a Kaiord.
• La extensión solo envía peticiones a Garmin, y solo responde a Kaiord App en https://kaiord.com.
• Antes de entregar una respuesta a Kaiord App, la extensión quita lo que en ella esté ligado a tu inicio de sesión de Garmin: un campo con nombre de token, CSRF, sesión o nonce, o una entrada JSON con nombre de token, clave, contraseña, cookie o id de sesión. Hoy las respuestas de Garmin no traen ninguno.
• También quita los datos personales que Kaiord App no lee: el autor de un entrenamiento (tu nombre y tus fotos de perfil), los nombres y fotos del propietario de una actividad y los lugares donde empezó y terminó, y cualquier campo con nombre de tu nombre, fecha de nacimiento, género, email, teléfono o dirección.
• Sin analítica y sin rastreo. La extensión guarda en tu navegador un breve registro de sus propios errores y no lo envía a ningún sitio.
• Quitar la extensión de Chrome borra todo lo que guardó.
• El acceso a través de tu propio inicio de sesión de Garmin no es oficial: no es una API de socio de Garmin, y puede dejar de funcionar sin aviso.
• Código abierto: https://github.com/pablo-albaladejo/kaiord

## Metadata

- **Category**: Productivity
- **Languages**: English and Spanish (`_locales/en` is the default; the store and Chrome pick the locale from the browser language)
- **Publisher**: Pablo Albaladejo
- **Privacy policy URL**: https://kaiord.com/docs/legal/privacy-policy
- **Website**: https://kaiord.com
- **Support URL**: https://github.com/pablo-albaladejo/kaiord/issues

## Submission Checklist (Initial Setup)

- [x] Create Chrome Web Store developer account ($5 one-time fee)
- [x] Register as "Pablo Albaladejo"
- [x] Fill in listing fields from this document
- [x] Upload icon (128x128 from `packages/garmin-bridge/icons/icon128.png`)
- [x] Upload at least one screenshot (1280x800 or 640x400)
- [x] Paste permission justifications from `privacy-justification.md` into the CWS dashboard
- [x] Set privacy policy URL to `https://kaiord.com/docs/legal/privacy-policy`
- [x] Submit for review

## Automated Publishing

After initial setup, updates are published automatically via GitHub Actions:

1. Create a changeset: `pnpm exec changeset` (select `@kaiord/garmin-bridge`)
2. Merge to main — changesets creates a "Version Packages" PR
3. Merge the Version Packages PR — `cws-publish.yml` detects the version bump and uploads to CWS

The workflow uploads the package only. The name and the Short Description reach the store through `extName` and
`extDescription` in `_locales/en/messages.json` and
`_locales/es/messages.json`. The name is "Kaiord for Garmin" in both: it is
the product name and is not translated. The Detailed Description (English
and Spanish, one per store language) and the permission justifications are
pasted into the CWS dashboard by hand.

See `docs/cws-credentials-setup.md` for the one-time CWS API credentials setup.

## Screenshots

`assets/screenshot-1280x800.png` shows an older popup (a green "Connected to
Garmin Connect" bar and "List Workouts" / "Check Session" buttons) that no
longer exists. Replace it with captures of the current popup. Its states, from `popup.js`:

1. **Connected**: after the Kaiord App has read from or sent to Garmin Connect once, the extension holds access that has not expired; the popup shows "Connected" ["Conectado"] and "Open Kaiord editor" ["Abrir el editor de Kaiord"].
2. **Not checked yet**: with no access held yet (a fresh install), the popup shows "Not checked yet" ["Todavía sin comprobar"] and "Kaiord asks Garmin Connect the first time it reads or sends, so looking here mints no access." ["Kaiord pregunta a Garmin Connect la primera vez que lee o envía, así que mirar aquí no genera ningún acceso."]. The check asks Garmin nothing, so the popup never shows "Sign in to Garmin".
3. **Not answering**: only when the extension's own worker does not answer; the popup shows "Garmin is not answering, so you cannot use it in Kaiord right now." ["Garmin no responde, así que ahora mismo no puedes usar Garmin en Kaiord."] and "Try again" ["Reintentar"]. It is hard to stage and not needed for the listing.

Capture each state twice: once with Chrome's interface in English, for the English listing, and once in Spanish (`chrome://settings/languages`, "Display Google Chrome in this language"), for the Spanish listing. The Spanish popup shows the text in brackets.

Steps to capture:

1. Load the extension from the extracted zip (`chrome://extensions` → Load unpacked)
2. Open Garmin Connect and log in, then send one workout from the Kaiord App
3. Use Chrome DevTools "Capture screenshot" or a screenshot tool
4. Crop to 1280x800 or 640x400
