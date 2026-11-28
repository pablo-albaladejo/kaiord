# Chrome Web Store Listing

The **Short Description** and **Detailed Description** below are a registered
claims surface: every paragraph and list item in them is an entry in
[`claims/trainingpeaks.json`](../../claims/trainingpeaks.json) with the code or
test that proves it, and `pnpm lint:claims` fails on any sentence that is not.
See [`claims/README.md`](../../claims/README.md).

## Extension Name

Kaiord for TrainingPeaks

## Short Description (132 chars max)

Lets the Kaiord App send workouts to your TrainingPeaks calendar and read your weight, using your own TrainingPeaks sign-in

## Detailed Description

Kaiord for TrainingPeaks connects the Kaiord App (https://kaiord.com/app) to your TrainingPeaks account. You sign in to TrainingPeaks in Chrome as usual; the extension never sees your password.

What it does:

• Sends the workouts you create in the Kaiord App to your TrainingPeaks calendar, each on its day.
• Each send adds a new workout in TrainingPeaks. Before sending a workout again, the Kaiord App checks whether TrainingPeaks still has the copy it sent: if it does, an unchanged workout adds nothing, and for one you changed the Kaiord App asks you first, because TrainingPeaks would then hold two copies. The extension cannot delete anything in TrainingPeaks or change a workout already there.
• If a send gets no answer, the workout may still have reached TrainingPeaks: before that workout is sent again, the Kaiord App reads the workouts of that day and, if one has the same title, sends nothing and asks you first.
• On a Basic TrainingPeaks account, TrainingPeaks accepts workouts only for today and tomorrow, counted in the account's time zone; for any day that may be later there, the Kaiord App tells you so before you send, and says the same if TrainingPeaks refuses it.
• Reads the metrics you logged in TrainingPeaks over the last 30 days, from which the Kaiord App keeps only your weight.
• Shows in its popup whether your TrainingPeaks sign-in can be used.

How it works:

1. Sign in to TrainingPeaks in Chrome.
2. The extension exchanges that sign-in for a short-lived TrainingPeaks access token. No password is entered or seen.
3. Open the Kaiord App and send a workout to TrainingPeaks.

Your token and your data:

• The access token is kept in your browser (chrome.storage.local) and is sent only to TrainingPeaks. It never travels to Kaiord.
• Checking your sign-in, from the Kaiord App or the popup, asks TrainingPeaks nothing and mints no token. The extension asks TrainingPeaks for a token, and stores it, only when the Kaiord App is about to read or send.
• The extension gives the Kaiord App your TrainingPeaks athlete number just before it places a workout or imports your weight, because TrainingPeaks needs it for both, and never the token.
• The extension sends requests only to TrainingPeaks, and answers only the Kaiord App at https://kaiord.com.
• Before it hands the Kaiord App an answer, the extension removes anything in it tied to your TrainingPeaks sign-in: a field named as a token, CSRF, session or nonce value, or a JSON entry named as a token, key, password, cookie or session id. TrainingPeaks' answers carry none today.
• It also removes a workout's comments, your coach's and yours, which the Kaiord App does not read, and any field named as your name, birth date, gender, email, phone or address.
• No analytics and no tracking.
• Removing the extension from Chrome deletes everything it stored.
• Access through your own TrainingPeaks sign-in is unofficial: it is not a TrainingPeaks partner API, and it can stop working without notice.
• Open source: https://github.com/pablo-albaladejo/kaiord

## Short Description, Spanish (132 chars max)

Kaiord App envía entrenamientos a tu calendario de TrainingPeaks y lee tu peso, con tu propio inicio de sesión de TrainingPeaks

## Detailed Description, Spanish

Kaiord for TrainingPeaks conecta Kaiord App (https://kaiord.com/app) con tu cuenta de TrainingPeaks. Inicias sesión en TrainingPeaks en Chrome como siempre; la extensión nunca ve tu contraseña.

Qué hace:

• Envía los entrenamientos que creas en Kaiord App a tu calendario de TrainingPeaks, cada uno en su día.
• Cada envío añade un entrenamiento nuevo en TrainingPeaks. Antes de volver a enviar un entrenamiento, Kaiord App comprueba si TrainingPeaks todavía tiene la copia que envió: si la tiene, un entrenamiento sin cambios no añade nada, y para uno que cambiaste Kaiord App te pregunta primero, porque TrainingPeaks tendría entonces dos copias. La extensión no puede borrar nada en TrainingPeaks ni cambiar un entrenamiento que ya esté allí.
• Si un envío no recibe respuesta, el entrenamiento puede haber llegado igualmente a TrainingPeaks: antes de volver a enviar ese entrenamiento, Kaiord App lee los entrenamientos de ese día y, si uno tiene el mismo título, no envía nada y te pregunta primero.
• En una cuenta Basic de TrainingPeaks, TrainingPeaks solo acepta entrenamientos para hoy y mañana, contados en la zona horaria de la cuenta; para cualquier día que allí pueda ser posterior, Kaiord App te lo dice antes de enviar, y dice lo mismo si TrainingPeaks lo rechaza.
• Lee las métricas que registraste en TrainingPeaks en los últimos 30 días, de las que Kaiord App guarda solo tu peso.
• Muestra en su ventana emergente si se puede usar tu inicio de sesión de TrainingPeaks.

Cómo funciona:

1. Inicia sesión en TrainingPeaks en Chrome.
2. La extensión cambia ese inicio de sesión por un token de acceso de TrainingPeaks de corta duración. No se introduce ni se ve ninguna contraseña.
3. Abre Kaiord App y envía un entrenamiento a TrainingPeaks.

Tu token y tus datos:

• El token de acceso se guarda en tu navegador (chrome.storage.local) y solo se envía a TrainingPeaks. Nunca viaja a Kaiord.
• Comprobar tu inicio de sesión, desde Kaiord App o desde la ventana emergente, no pregunta nada a TrainingPeaks ni genera ningún token. La extensión pide un token a TrainingPeaks, y lo guarda, solo cuando Kaiord App está a punto de leer o enviar.
• La extensión le da a Kaiord App tu número de atleta de TrainingPeaks justo antes de colocar un entrenamiento o importar tu peso, porque TrainingPeaks lo necesita para ambos, y nunca el token.
• La extensión solo envía peticiones a TrainingPeaks, y solo responde a Kaiord App en https://kaiord.com.
• Antes de entregar una respuesta a Kaiord App, la extensión quita lo que en ella esté ligado a tu inicio de sesión de TrainingPeaks: un campo con nombre de token, CSRF, sesión o nonce, o una entrada JSON con nombre de token, clave, contraseña, cookie o id de sesión. Hoy las respuestas de TrainingPeaks no traen ninguno.
• También quita los comentarios de un entrenamiento, los de tu entrenador y los tuyos, que Kaiord App no lee, y cualquier campo con nombre de tu nombre, fecha de nacimiento, género, email, teléfono o dirección.
• Sin analítica y sin rastreo.
• Quitar la extensión de Chrome borra todo lo que guardó.
• El acceso a través de tu propio inicio de sesión de TrainingPeaks no es oficial: no es una API de socio de TrainingPeaks, y puede dejar de funcionar sin aviso.
• Código abierto: https://github.com/pablo-albaladejo/kaiord

## Metadata

- **Category**: Productivity
- **Languages**: English and Spanish (`_locales/en` is the default; the store and Chrome pick the locale from the browser language)
- **Publisher**: Pablo Albaladejo
- **Privacy policy URL**: https://kaiord.com/docs/legal/privacy-policy
- **Website**: https://kaiord.com
- **Support URL**: https://github.com/pablo-albaladejo/kaiord/issues

## Submission Checklist (first publish, not done)

This extension has never been published. A maintainer completes these by hand:

- [ ] Create the Chrome Web Store Developer Dashboard listing
- [ ] Fill in the listing fields from this document
- [ ] Upload icon (128x128 from `packages/trainingpeaks-bridge/icons/icon128.png`)
- [ ] Capture and upload at least one screenshot (1280x800 or 640x400) of the current popup; none exists yet
- [ ] Paste the permission justifications from `privacy-justification.md` into the dashboard
- [ ] Set privacy policy URL to `https://kaiord.com/docs/legal/privacy-policy`
- [ ] Submit for review

The name and the Short Description reach the store through `extName` and
`extDescription` in `_locales/en/messages.json` and
`_locales/es/messages.json`. The name is "Kaiord for TrainingPeaks" in both: it is
the product name and is not translated. The Detailed Description (English
and Spanish, one per store language) and the permission justifications are
pasted into the dashboard by hand.

## Automated Publishing (not wired yet)

`cws-publish.yml` currently only publishes `garmin-bridge` and
`train2go-bridge`. This extension has no Chrome Web Store Developer
Dashboard listing, extension ID, or publish secret yet, and is not in the
workflow's matrix — see `openspec/specs/cws-auto-publish/spec.md`,
Requirement "Onboarding a new bridge extension to automated publishing" for
the registration steps a maintainer must complete first. Once those steps
are done, a `package.json` version bump on `@kaiord/trainingpeaks-bridge`
will be picked up by the same upload → publish → verify flow `garmin-bridge`
and `train2go-bridge` already use.

## Screenshots

There are none yet. Capture the current popup. Its states, from `popup.js`:

1. **Connected**: after the Kaiord App has read from or sent to TrainingPeaks once, the extension holds a token that has not expired; the popup shows "Connected" ["Conectado"] and "Open Kaiord editor" ["Abrir el editor de Kaiord"].
2. **Not checked yet**: with no token held yet (a fresh install), the popup shows "Not checked yet" ["Todavía sin comprobar"] and "Kaiord asks TrainingPeaks the first time it reads or sends, so looking here mints no token." ["Kaiord pregunta a TrainingPeaks la primera vez que lee o envía, así que mirar aquí no genera ningún token."]. The check asks TrainingPeaks nothing, so the popup does not show "Sign in to TrainingPeaks" from a check.

Capture each state twice: once with Chrome's interface in English, for the English listing, and once in Spanish (`chrome://settings/languages`, "Display Google Chrome in this language"), for the Spanish listing. The Spanish popup shows the text in brackets.

Steps to capture:

1. Load the extension from the extracted zip (`chrome://extensions` → Load unpacked)
2. Open TrainingPeaks and log in, then import your weight once from the Kaiord App
3. Use Chrome DevTools "Capture screenshot" or a screenshot tool
4. Crop to 1280x800 or 640x400
