# Chrome Web Store Listing

The **Short Description** and **Detailed Description** below are a registered
claims surface: every paragraph and list item in them is an entry in
[`claims/train2go.json`](../../claims/train2go.json) with the code or test that
proves it, and `pnpm lint:claims` fails on any sentence that is not. See
[`claims/README.md`](../../claims/README.md).

## Extension Name

Kaiord for Train2Go

## Short Description (132 chars max)

Lets the Kaiord App read the plan your coach sets on Train2Go, your training zones and your weight, using your own Train2Go sign-in

## Detailed Description

Kaiord for Train2Go connects the Kaiord App (https://kaiord.com/app) to your Train2Go account. You sign in to Train2Go in Chrome as usual; the extension never sees your password.

What it does:

• Fetches the week your coach planned on Train2Go when the Kaiord App asks, and the Kaiord App reads from it each coaching activity's date, sport, title, duration, workload and completion status.
• Fetches one day in full when the Kaiord App asks, and the Kaiord App reads from it the coach's description of each session, and that day's comments with who wrote them.
• Fetches your Train2Go profile page when the Kaiord App asks, and the Kaiord App keeps from it only your heart-rate, power and pace zones per sport, your maximum and resting heart rate, and your weight. The extension first removes from that page your gender, birthday, body fat, BMI, height and smoking, the notes your coach keeps about you and your contact details; the rest of it (records and tests) reaches the Kaiord App in your browser and is dropped there as the page is read.
• Hands the Kaiord App what Train2Go answers, as it came, except that it first removes the anti-forgery token tied to your Train2Go sign-in (the hidden _token field of Train2Go's pages) and any other field named as a token, CSRF, session or nonce value. It makes only the requests on its fixed list of read-only Train2Go addresses. It refuses any other request without sending it.
• Checking the connection tells the Kaiord App only whether you are signed in. When you connect Train2Go, the Kaiord App reads who is signed in from Train2Go's answer and keeps only your id and name; the extension first removes from that answer your surname, gender, height, weight and heart rates, and your coach's name and notes.
• Shows in its popup whether it can currently read from Train2Go, your coach's name and notes, and this week's planned and completed sessions and workload, read at most once every 5 minutes unless you press Refresh, and never stored on disk.
• Only reads. It never changes anything on Train2Go.

How it works:

1. Sign in to Train2Go in Chrome.
2. When the Kaiord App asks, the extension requests the page from Train2Go and Chrome adds your own Train2Go sign-in cookie. The extension cannot read that cookie.
3. Open the Kaiord App; it reads your plan through the extension.

Your session and your data:

• The extension stores no password, cookie or token. It keeps in your browser (chrome.storage.local) only what its popup shows: the profile summary the Kaiord App sends, the app's theme preference, when it last could and could not read from Train2Go, and a log of its last 25 errors.
• The extension sends requests only to app.train2go.com, and answers only the Kaiord App at https://kaiord.com.
• What it reads goes only to the Kaiord App in your browser; the extension sends nothing to a Kaiord server.
• No analytics and no tracking. The extension keeps a short log of its own errors in your browser and sends it nowhere.
• Removing the extension from Chrome deletes everything it stored.
• Access through your own Train2Go sign-in is unofficial: it is not a Train2Go partner API, and it can stop working without notice.
• Open source: https://github.com/pablo-albaladejo/kaiord

## Short Description, Spanish (132 chars max)

Permite que Kaiord App lea el plan de tu entrenador en Train2Go, tus zonas y tu peso, con tu propio inicio de sesión de Train2Go

## Detailed Description, Spanish

Kaiord for Train2Go conecta Kaiord App (https://kaiord.com/app) con tu cuenta de Train2Go. Inicias sesión en Train2Go en Chrome como siempre; la extensión nunca ve tu contraseña.

Qué hace:

• Pide a Train2Go la semana que tu entrenador planificó cuando Kaiord App lo solicita, y Kaiord App lee de ella la fecha, el deporte, el título, la duración, la carga y el estado de cada actividad de entrenamiento.
• Pide un día completo cuando Kaiord App lo solicita, y Kaiord App lee de él la descripción que hace tu entrenador de cada sesión, y los comentarios de ese día con quién los escribió.
• Pide tu página de perfil de Train2Go cuando Kaiord App lo solicita, y Kaiord App guarda de ella solo tus zonas de frecuencia cardiaca, potencia y ritmo por deporte, tu frecuencia cardiaca máxima y en reposo, y tu peso. Antes, la extensión quita de esa página tu género, cumpleaños, grasa corporal, IMC, altura y si fumas, las notas que tu entrenador guarda sobre ti y tus datos de contacto; el resto (marcas y tests) llega a Kaiord App en tu navegador y se descarta allí al leer la página.
• Entrega a Kaiord App lo que responde Train2Go, tal como llegó, salvo que antes quita el token antifalsificación ligado a tu inicio de sesión de Train2Go (el campo oculto _token de las páginas de Train2Go) y cualquier otro campo con nombre de token, CSRF, sesión o nonce. Solo hace las peticiones de su lista fija de direcciones de Train2Go de solo lectura. Rechaza cualquier otra petición sin enviarla.
• Comprobar la conexión solo le dice a Kaiord App si tienes la sesión iniciada. Cuando conectas Train2Go, Kaiord App lee quién tiene la sesión iniciada en la respuesta de Train2Go y guarda solo tu id y tu nombre; antes, la extensión quita de esa respuesta tus apellidos, género, altura, peso y frecuencias cardiacas, y el nombre y las notas de tu entrenador.
• Muestra en su ventana emergente si ahora mismo puede leer de Train2Go, el nombre y las notas de tu entrenador, y las sesiones planificadas y completadas y la carga de esta semana, que lee como mucho una vez cada 5 minutos salvo que pulses Actualizar, y no guarda en disco.
• Solo lee. Nunca cambia nada en Train2Go.

Cómo funciona:

1. Inicia sesión en Train2Go en Chrome.
2. Cuando Kaiord App lo solicita, la extensión pide la página a Train2Go y Chrome añade tu propia cookie de inicio de sesión de Train2Go. La extensión no puede leer esa cookie.
3. Abre Kaiord App; lee tu plan a través de la extensión.

Tu sesión y tus datos:

• La extensión no guarda ninguna contraseña, cookie ni token. Solo guarda en tu navegador (chrome.storage.local) lo que muestra su ventana emergente: el resumen del perfil que envía Kaiord App, la preferencia de tema de la app, cuándo pudo y cuándo no pudo leer de Train2Go por última vez, y un registro de sus últimos 25 errores.
• La extensión solo envía peticiones a app.train2go.com, y solo responde a Kaiord App en https://kaiord.com.
• Lo que lee va solo a Kaiord App en tu navegador; la extensión no envía nada a un servidor de Kaiord.
• Sin analítica y sin rastreo. La extensión guarda en tu navegador un breve registro de sus propios errores y no lo envía a ningún sitio.
• Quitar la extensión de Chrome borra todo lo que guardó.
• El acceso a través de tu propio inicio de sesión de Train2Go no es oficial: no es una API de socio de Train2Go, y puede dejar de funcionar sin aviso.
• Código abierto: https://github.com/pablo-albaladejo/kaiord

## Metadata

- **Category**: Productivity
- **Languages**: English and Spanish (`_locales/en` is the default; the store and Chrome pick the locale from the browser language)
- **Publisher**: Pablo Albaladejo
- **Privacy policy URL**: https://kaiord.com/docs/legal/privacy-policy
- **Website**: https://kaiord.com
- **Support URL**: https://github.com/pablo-albaladejo/kaiord/issues

The name and the Short Description reach the store through `extName` and
`extDescription` in `_locales/en/messages.json` and
`_locales/es/messages.json`. The name is "Kaiord for Train2Go" in both: it is
the product name and is not translated. The Detailed Description (English
and Spanish, one per store language) and the permission justifications are
pasted into the dashboard by hand.

## Submission Checklist (Initial Setup)

- [ ] Fill in listing fields from this document
- [ ] Upload icon (128x128 from `packages/train2go-bridge/icons/icon128.png`)
- [ ] Upload at least one screenshot (1280x800 or 640x400)
- [ ] Paste the single purpose, permission justifications and remote-code answer from `privacy-justification.md` into the CWS dashboard
- [ ] Set privacy policy URL to `https://kaiord.com/docs/legal/privacy-policy`
- [ ] Submit for review

## Automated Publishing

After initial setup, updates are published automatically via GitHub Actions:

1. Create a changeset: `pnpm exec changeset` (select `@kaiord/train2go-bridge`)
2. Merge to main — changesets creates a "Version Packages" PR
3. Merge the Version Packages PR — `cws-publish.yml` detects the version bump and uploads to CWS

See `docs/cws-credentials-setup.md` for the one-time CWS API credentials setup.

## Screenshots

Capture popup screenshots at 640x400 or 1280x800. The states, from `popup.js`:

1. **Connected**: signed in to Train2Go, click the extension icon; the popup shows "Connected as …" ["Conectado como …"], the coach line and this week's figures.
2. **Signed out**: signed out of Train2Go (its check answers "Unauthenticated"); the popup shows "You cannot use Train2Go in Kaiord until you sign in to Train2Go in this browser." ["No puedes usar Train2Go en Kaiord hasta que inicies sesión en Train2Go en este navegador."] and "Sign in to Train2Go" ["Iniciar sesión en Train2Go"].
3. **Not answering**: only when Train2Go answers anything else; the popup shows "Train2Go is not answering, so you cannot use it in Kaiord right now." ["Train2Go no responde, así que ahora mismo no puedes usar Train2Go en Kaiord."] and "Try again" ["Reintentar"]. Not needed for the listing.

Capture each state twice: once with Chrome's interface in English, for the English listing, and once in Spanish (`chrome://settings/languages`, "Display Google Chrome in this language"), for the Spanish listing. The Spanish popup shows the text in brackets.

Steps to capture:

1. Load the extension from the extracted zip (`chrome://extensions` → Load unpacked)
2. Open Train2Go and log in
3. Use Chrome DevTools "Capture screenshot" or a screenshot tool
4. Crop to 1280x800 or 640x400
