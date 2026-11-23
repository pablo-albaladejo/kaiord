# Chrome Web Store Listing

The **Short Description** and **Detailed Description** below are a registered
claims surface: every paragraph and list item in them is an entry in
[`claims/tanita.json`](../../claims/tanita.json) with the code or test that
proves it, and `pnpm lint:claims` fails on any sentence that is not. See
[`claims/README.md`](../../claims/README.md).

## Extension Name

Kaiord for Tanita

## Short Description (132 chars max)

Lets the Kaiord App import your weight and body composition from MyTANITA, using your own MyTANITA sign-in

## Detailed Description

Kaiord for Tanita connects the Kaiord App (https://kaiord.com/app) to your MyTANITA account at mytanita.eu. You sign in to MyTANITA in Chrome as usual; the extension never sees your password and cannot read your sign-in cookie.

What it does:

• Downloads your MyTANITA export, which holds every measurement in your history, and hands it to the Kaiord App exactly as MyTANITA sent it. The extension does not interpret the measurements; the Kaiord App does.
• The Kaiord App asks for the export when you open its calendar, if Tanita is switched on for weight or body composition, and when you press Sync now. The Kaiord App turns it into weight and body-composition entries kept in your browser.
• Each time you open the extension's popup or press Refresh, it asks MyTANITA only for the export's headers, without downloading it, to learn whether you are still signed in. It shows only the answer.

How it works:

1. Sign in to MyTANITA at https://mytanita.eu in Chrome.
2. Open the Kaiord App and connect Tanita.
3. The extension sends its request with your MyTANITA sign-in, so no password is entered or stored.

Your sign-in and your data:

• The extension sends requests only to https://mytanita.eu/en/user/export-csv, and answers only the Kaiord App at https://kaiord.com.
• In your browser it keeps only when its popup last could and could not reach your export, and the Kaiord App's theme. It never keeps the export.
• No analytics and no tracking.
• Removing the extension from Chrome deletes everything it stored.
• Access through your own MyTANITA sign-in is unofficial: it is not a Tanita partner API, and it can stop working without notice.
• Open source: https://github.com/pablo-albaladejo/kaiord

## Short Description, Spanish (132 chars max)

Permite que Kaiord App importe tu peso y tu composición corporal de MyTANITA, con tu propio inicio de sesión de MyTANITA

## Detailed Description, Spanish

Kaiord for Tanita conecta Kaiord App (https://kaiord.com/app) con tu cuenta de MyTANITA en mytanita.eu. Inicias sesión en MyTANITA en Chrome como siempre; la extensión nunca ve tu contraseña y no puede leer tu cookie de inicio de sesión.

Qué hace:

• Descarga tu exportación de MyTANITA, que contiene todas las mediciones de tu historial, y se la entrega a Kaiord App tal como la envió MyTANITA. La extensión no interpreta las mediciones; lo hace Kaiord App.
• Kaiord App pide la exportación cuando abres su calendario, si Tanita está activado para el peso o la composición corporal, y cuando pulsas Sincronizar ahora. Kaiord App la convierte en entradas de peso y de composición corporal que se guardan en tu navegador.
• Cada vez que abres la ventana emergente de la extensión o pulsas Actualizar, pide a MyTANITA solo las cabeceras de la exportación, sin descargarla, para saber si sigues con la sesión iniciada. Solo muestra la respuesta.

Cómo funciona:

1. Inicia sesión en MyTANITA en https://mytanita.eu en Chrome.
2. Abre Kaiord App y conecta Tanita.
3. La extensión envía su petición con tu inicio de sesión de MyTANITA, así que no se introduce ni se guarda ninguna contraseña.

Tu inicio de sesión y tus datos:

• La extensión solo envía peticiones a https://mytanita.eu/en/user/export-csv, y solo responde a Kaiord App en https://kaiord.com.
• En tu navegador solo guarda cuándo pudo y cuándo no pudo su ventana emergente llegar a tu exportación por última vez, y el tema de Kaiord App. Nunca guarda la exportación.
• Sin analítica y sin rastreo.
• Quitar la extensión de Chrome borra todo lo que guardó.
• El acceso a través de tu propio inicio de sesión de MyTANITA no es oficial: no es una API de socio de Tanita, y puede dejar de funcionar sin aviso.
• Código abierto: https://github.com/pablo-albaladejo/kaiord

## Metadata

- **Category**: Productivity
- **Languages**: English and Spanish (`_locales/en` is the default; the store and Chrome pick the locale from the browser language)
- **Publisher**: Pablo Albaladejo
- **Privacy policy URL**: https://kaiord.com/docs/legal/privacy-policy
- **Website**: https://kaiord.com
- **Support URL**: https://github.com/pablo-albaladejo/kaiord/issues

## Submission Checklist (Initial Setup)

Not done yet: this extension has never been published.

- [ ] Create the listing in the Chrome Web Store Developer Dashboard
- [ ] Fill in listing fields from this document
- [ ] Upload icon (128x128 from `packages/tanita-bridge/icons/icon128.png`)
- [ ] Upload at least one screenshot (1280x800 or 640x400) of the current popup
- [ ] Paste permission justifications from `privacy-justification.md` into the CWS dashboard
- [ ] Set privacy policy URL to `https://kaiord.com/docs/legal/privacy-policy`
- [ ] Submit for review

The name and the Short Description reach the store through `extName` and
`extDescription` in `_locales/en/messages.json` and
`_locales/es/messages.json`. The name is "Kaiord for Tanita" in both: it is
the product name and is not translated. The Detailed Description (English
and Spanish, one per store language) and the permission justifications are
pasted into the CWS dashboard by hand.

## Screenshots

There are none yet (no `assets/` folder). Capture the current popup:

1. **Connected**: signed in to MyTANITA, click the extension icon; the popup shows "Connected" and "Open Kaiord editor".
2. **Not answering**: signed out of MyTANITA; the popup shows "Tanita is not answering, so you cannot use it in Kaiord right now." and "Try again".

## Automated Publishing (not wired yet)

`cws-publish.yml` currently only publishes `garmin-bridge` and
`train2go-bridge`. This extension has no Chrome Web Store Developer
Dashboard listing, extension ID, or publish secret yet, and is not in the
workflow's matrix — see `openspec/specs/cws-auto-publish/spec.md`,
Requirement "Onboarding a new bridge extension to automated publishing" for
the registration steps a maintainer must complete first. Once those steps
are done, a `package.json` version bump on `@kaiord/tanita-bridge` will be
picked up by the same upload → publish → verify flow `garmin-bridge` and
`train2go-bridge` already use.
