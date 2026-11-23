# Chrome Web Store Listing

**Status: NOT YET SUBMITTED.** This extension has no Chrome Web Store
Developer Dashboard listing, no extension ID, and no publish secret. It is
also absent from the `cws-publish.yml` matrix, so none of the "Automated
Publishing" steps below apply until the manual registration steps are
completed — see `openspec/specs/cws-auto-publish/spec.md`, Requirement
"Onboarding a new bridge extension to automated publishing".

The copy below is prepared ahead of that registration so the dashboard
listing can be filled in directly once created.

## Extension Name

Kaiord for WHOOP

## Short Description (132 chars max)

Connects the Kaiord workout editor to your WHOOP recovery & sleep data via your own browser session

## Detailed Description

Kaiord for WHOOP connects the Kaiord workout editor (https://kaiord.com/app) to your WHOOP account through your existing signed-in app.whoop.com session. No passwords, no developer app, and no API key — the extension rides your own WHOOP login.

Features:
• Import recovery, HRV, sleep, vitals, strain, and stress data
• Import heart-rate series and workouts as activities
• Import Advanced-Labs biomarker test results as lab reports
• Session status indicator in the popup

How it works:

1. Log into WHOOP in your browser (app.whoop.com)
2. Open the Kaiord workout editor
3. The editor imports your WHOOP data through the extension

Privacy:
• No data collection, no analytics, no telemetry
• No OAuth, no developer API key, no password stored — the extension captures the session bearer your own signed-in WHOOP tab already uses, and holds it only in memory (`chrome.storage.session`), never on disk
• Read-only: the extension exposes no path to write to WHOOP
• Open source: https://github.com/pablo-albaladejo/kaiord

## Short Description, Spanish (132 chars max)

Conecta el editor de Kaiord con tus datos de recuperación y sueño de WHOOP a través de tu propia sesión del navegador

## Detailed Description, Spanish

Kaiord for WHOOP conecta el editor de Kaiord (https://kaiord.com/app) con tu cuenta de WHOOP a través de la sesión de app.whoop.com que ya tienes iniciada. Sin contraseñas, sin app de desarrollador y sin clave de API: la extensión aprovecha tu propio inicio de sesión de WHOOP.

Funciones:
• Importa datos de recuperación, VFC, sueño, constantes vitales, esfuerzo y estrés
• Importa series de frecuencia cardiaca y entrenamientos como actividades
• Importa los resultados de los análisis de biomarcadores de Advanced Labs como informes de laboratorio
• Indicador del estado de la sesión en la ventana emergente

Cómo funciona:

1. Inicia sesión en WHOOP en tu navegador (app.whoop.com)
2. Abre el editor de Kaiord
3. El editor importa tus datos de WHOOP a través de la extensión

Privacidad:
• Sin recogida de datos, sin analítica, sin telemetría
• Sin OAuth, sin clave de API de desarrollador y sin contraseña guardada: la extensión captura el token de sesión que ya usa tu propia pestaña de WHOOP con la sesión iniciada, y lo guarda solo en memoria (`chrome.storage.session`), nunca en disco
• Solo lectura: la extensión no ofrece ninguna forma de escribir en WHOOP
• Código abierto: https://github.com/pablo-albaladejo/kaiord

## Metadata

- **Category**: Health & Fitness
- **Languages**: English and Spanish (`_locales/en` is the default; the store and Chrome pick the locale from the browser language)
- **Publisher**: Pablo Albaladejo
- **Privacy policy URL**: https://kaiord.com/docs/legal/privacy-policy
- **Website**: https://kaiord.com
- **Support URL**: https://github.com/pablo-albaladejo/kaiord/issues

The name and the Short Description reach the store through `extName` and
`extDescription` in `_locales/en/messages.json` and
`_locales/es/messages.json`. The name is "Kaiord for WHOOP" in both: it is
the product name and is not translated. The Detailed Description (English
and Spanish, one per store language) and the permission justifications are
pasted into the dashboard by hand.

## Submission Checklist (Initial Setup — NOT started)

- [ ] Create the Chrome Web Store Developer Dashboard listing for this extension
- [ ] Record the assigned extension ID
- [ ] Add a `CWS_WHOOP_EXTENSION_ID` repository secret
- [ ] Widen `cws-publish.yml`'s `decide`/`act` matrices and `on.push.paths` to include `whoop-bridge` (see `openspec/specs/cws-auto-publish/spec.md`)
- [x] Add `@kaiord/whoop-bridge` to changesets versioning — already done; `.changeset/config.json` links it
- [ ] Fill in listing fields from this document
- [ ] Upload icon (128x128 from `packages/whoop-bridge/icons/icon128.png`)
- [ ] Upload at least one screenshot (1280x800 or 640x400)
- [ ] Paste permission justifications from `privacy-justification.md` into the CWS dashboard
- [ ] Set privacy policy URL to `https://kaiord.com/docs/legal/privacy-policy`
- [ ] Submit for review

## Automated Publishing (not wired yet)

`cws-publish.yml` currently only publishes `garmin-bridge` and
`train2go-bridge`. Once the Submission Checklist above is complete, a
`package.json` version bump on `@kaiord/whoop-bridge` will be picked up by
the same upload → publish → verify flow those two extensions use — no
further workflow changes required at that point.

## Screenshots

Capture popup screenshots at 640x400 or 1280x800:

1. **Connected state**: Open WHOOP, log in, click extension icon, capture popup showing "Connected"
2. **Sign-in state**: Sign out of WHOOP, click extension icon, capture popup showing "You cannot use WHOOP in Kaiord until you sign in to WHOOP in this browser." and "Sign in to WHOOP"

Steps to capture:

1. Load the extension unpacked (`chrome://extensions` → Load unpacked)
2. Open `app.whoop.com` and log in
3. Use Chrome DevTools "Capture screenshot" or a screenshot tool
4. Crop to 1280x800 or 640x400
