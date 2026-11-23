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
• Fetches your Train2Go profile page when the Kaiord App asks, and the Kaiord App keeps from it only your heart-rate, power and pace zones per sport, your maximum and resting heart rate, and your weight. The rest of that page (gender, birthday, body fat, height, contact details, records and tests) reaches the Kaiord App in your browser and is dropped there as the page is read.
• Hands the Kaiord App what Train2Go answers, as it came, and makes only the requests on its fixed list of read-only Train2Go addresses. It refuses any other request without sending it.
• Checking the connection tells the Kaiord App only whether you are signed in. When you connect Train2Go, the Kaiord App reads who is signed in from Train2Go's answer, which also holds your coach's name and the notes your coach keeps about you when Train2Go provides them, and keeps only your id and name.
• Shows in its popup whether it can currently read from Train2Go, your coach's name and notes, and this week's planned and completed sessions and workload.
• Only reads. It never changes anything on Train2Go.

How it works:

1. Sign in to Train2Go in Chrome.
2. When the Kaiord App asks, the extension requests the page from Train2Go and Chrome adds your own Train2Go sign-in cookie. The extension cannot read that cookie.
3. Open the Kaiord App; it reads your plan through the extension.

Your session and your data:

• The extension stores no password, cookie or token. It keeps in your browser (chrome.storage.local) only what its popup shows: the profile summary the Kaiord App sends, this week's totals, the app's theme preference, when it last could and could not read from Train2Go, and a log of its last 25 errors.
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
• Pide tu página de perfil de Train2Go cuando Kaiord App lo solicita, y Kaiord App guarda de ella solo tus zonas de frecuencia cardiaca, potencia y ritmo por deporte, tu frecuencia cardiaca máxima y en reposo, y tu peso. El resto de esa página (género, cumpleaños, grasa corporal, altura, datos de contacto, marcas y tests) llega a Kaiord App en tu navegador y se descarta allí al leer la página.
• Entrega a Kaiord App lo que responde Train2Go, tal como llegó, y solo hace las peticiones de su lista fija de direcciones de Train2Go de solo lectura. Rechaza cualquier otra petición sin enviarla.
• Comprobar la conexión solo le dice a Kaiord App si tienes la sesión iniciada. Cuando conectas Train2Go, Kaiord App lee quién tiene la sesión iniciada en la respuesta de Train2Go, que también contiene el nombre de tu entrenador y las notas que tu entrenador guarda sobre ti cuando Train2Go las da, y guarda solo tu id y tu nombre.
• Muestra en su ventana emergente si ahora mismo puede leer de Train2Go, el nombre y las notas de tu entrenador, y las sesiones planificadas y completadas y la carga de esta semana.
• Solo lee. Nunca cambia nada en Train2Go.

Cómo funciona:

1. Inicia sesión en Train2Go en Chrome.
2. Cuando Kaiord App lo solicita, la extensión pide la página a Train2Go y Chrome añade tu propia cookie de inicio de sesión de Train2Go. La extensión no puede leer esa cookie.
3. Abre Kaiord App; lee tu plan a través de la extensión.

Tu sesión y tus datos:

• La extensión no guarda ninguna contraseña, cookie ni token. Solo guarda en tu navegador (chrome.storage.local) lo que muestra su ventana emergente: el resumen del perfil que envía Kaiord App, los totales de esta semana, la preferencia de tema de la app, cuándo pudo y cuándo no pudo leer de Train2Go por última vez, y un registro de sus últimos 25 errores.
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

Capture popup screenshots at 640x400 or 1280x800:

1. **Connected state**: Sign in to Train2Go, click the extension icon, capture the popup showing "Connected as …", the coach line and this week's figures
2. **Not-answering state**: Sign out of Train2Go, click the extension icon, capture the popup showing "Train2Go is not answering, so you cannot use it in Kaiord right now." and "Try again"

Steps to capture:

1. Load the extension from the extracted zip (`chrome://extensions` → Load unpacked)
2. Open Train2Go and log in
3. Use Chrome DevTools "Capture screenshot" or a screenshot tool
4. Crop to 1280x800 or 640x400
