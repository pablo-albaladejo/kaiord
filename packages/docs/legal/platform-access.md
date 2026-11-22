---
title: Platform Access
description: How Kaiord reaches Garmin, Train2Go, Tanita, TrainingPeaks and WHOOP through your own sign-in, what each Platform's terms say about it, and what you lose if that access is cut off.
---

<!-- cSpell:words garth MyTANITA Anubis PLATAFORMA ponerlos disposición terceros extracción masiva autorizada datos caso producirse autorizado -->

# Platform Access

Kaiord has no partner agreement or official API access with any of the Platforms below. It reaches each one through your own sign-in, in your own browser, lent to the Kaiord App by a Chrome extension named "Kaiord for" that Platform. This access is unofficial: it can stop working without notice, and it may conflict with a Platform's terms. This page says so for each Platform instead of hiding it.

Any token an extension keeps is kept in your browser and is sent only to its own Platform. It never travels to Kaiord.

If access to a Platform is cut off, the Kaiord App keeps working without that extension, and what it already holds stays in your browser. You lose what that extension reads and writes from then on.

"What its terms say" is a reading of each Platform's own published terms on 2026-11-22, quoted narrowly and linked. It is not legal advice and draws no conclusion from them. A Platform can change its terms at any time, so the reading below may be out of date.

## Garmin

### How Kaiord reaches it

- Kaiord for Garmin reuses your Garmin Connect sign-in in Chrome. It is not a Garmin partner API.
- To mint tokens from that sign-in, the extension uses Garmin's consumer key and secret as published by third parties (the open-source garth project). Garmin did not issue them to Kaiord.
- The tokens are kept in your browser (`chrome.storage.local`) and are sent only to Garmin. They never travel to Kaiord.
- Kaiord for Garmin is published in the Chrome Web Store.

### What its terms say

- Garmin's [Terms of Use](https://www.garmin.com/en-US/legal/terms-of-use/) (effective April 1, 2026), Rules of Conduct, list as an example of a violation "Using any process, whether automated or manual, that accesses, copies, or scrapes content from the Site through any means not purposely made available through the Site". Under Your Account: "You must not share your account credentials with any third party."
- Garmin's [Connect Developer Program Agreement](https://developerportal.garmin.com/sites/default/files/Garmin%20Connect%20Developer%20Program%20Agreement.pdf) (FRM-0952 Rev. B) governs Garmin's official API: Garmin delivers a license key to a developer who accepts it (§3.1) and may review an application before it is published (§4.2). Kaiord has not entered this agreement.

### What you lose if access is cut off

- Sending workouts from the Kaiord App to your Garmin Connect workout library, and placing them on their day in your Garmin Connect calendar.
- Reading your recent Garmin Connect activities into the Kaiord App, where they are matched to what you planned.
- Uploading a body-composition measurement from the Kaiord App to Garmin Connect.

## Train2Go

### How Kaiord reaches it

- Kaiord for Train2Go reuses the session cookie of your Train2Go sign-in in Chrome. It is not a Train2Go API, and the extension keeps no token.
- It only reads: every request is a `GET` on a fixed list of paths, and it writes nothing to Train2Go.
- Kaiord for Train2Go is published in the Chrome Web Store.

### What its terms say

- Train2Go's [legal terms](https://train2go.com/legal/) (in Spanish, no date shown) contain, in the sections read, no general clause on automated access, scripts or unofficial clients. The one clause on scraping is in the section on Train2Go's own MCP connector, §4, which prohibits "extracción masiva no autorizada de datos de la PLATAFORMA (scraping)" (unauthorized mass extraction of the Platform's data).
- On credentials, the user undertakes to use them diligently "y a no ponerlos a disposición de terceros" (and not to make them available to third parties). Train2Go may terminate the contract or suspend the account "en caso de producirse un uso no autorizado de la PLATAFORMA" (in the event of unauthorized use of the Platform).

### What you lose if access is cut off

- Reading your coach's weekly and daily plan, with the day's comments, into the Days of the Kaiord App.
- Importing your training zones from your Train2Go profile.
- The notice that the coach moved a coaching activity to another day.

## Tanita

### How Kaiord reaches it

- Kaiord for Tanita reuses the session cookie of your MyTANITA sign-in (mytanita.eu) in Chrome. It is not a Tanita API, and the extension keeps no token.
- It reads one thing, the CSV export of your measurements, and writes nothing to MyTANITA.
- Kaiord for Tanita is not published in the Chrome Web Store today.

### What its terms say

- We could not read them. mytanita.eu shows no link to terms of use, and tanita.eu, where TANITA Europe publishes its [Terms of Use for the TANITA App Universe](https://tanita.eu/terms-of-use-tanita-app-universe), answered our reading with a bot check (Anubis) that we did not pass. Nothing is said here about what Tanita's terms contain.

### What you lose if access is cut off

- Importing your weight and body-composition measurements from MyTANITA into the Kaiord App, and so sending them on to Garmin Connect.

## TrainingPeaks

### How Kaiord reaches it

- Kaiord for TrainingPeaks uses the cookie of your TrainingPeaks sign-in in Chrome only to obtain an access token. It is not a TrainingPeaks API.
- The token is kept in your browser (`chrome.storage.local`) and is sent only to TrainingPeaks. It never travels to Kaiord.
- Kaiord for TrainingPeaks is not published in the Chrome Web Store today.

### What its terms say

- TrainingPeaks' [Terms of Use](https://www.trainingpeaks.com/terms-of-use/) (last updated July 28, 2026), §23 "Your Obligations to Us", list among what a user may not do: "Access or attempt to access the Sites or Services by any means other than the interface provided or authorized by us" and "Access the Sites or Services by means of automated process, spiders, bots, or similar device".
- §18 restricts using "automated scripts to collect information from or otherwise interact with the Technology".

### What you lose if access is cut off

- Sending structured workouts from the Kaiord App to TrainingPeaks.
- Importing your weight from TrainingPeaks into the Kaiord App.

## WHOOP

### How Kaiord reaches it

- Kaiord for WHOOP is experimental. It is not published in the Chrome Web Store, and it can only be loaded into Chrome unpacked, by hand.
- It works only while a WHOOP web app tab (app.whoop.com) is open: it copies the token that the WHOOP web app itself sends, and only reads. It is not a WHOOP API.
- The token is kept in your browser's memory only (`chrome.storage.session`) and never travels to Kaiord.

### What its terms say

- WHOOP's [Terms of Use](https://www.whoop.com/es/en/whoop-terms-of-use/) (last updated August 3, 2026), §4.4 "Actions you are specifically prohibited from taking", expressly prohibit "use of web scraping, web harvesting, or web data extraction methods from WHOOP Services even if the Account owner gives permission", and reverse engineering the Services.
- WHOOP's [API Terms of Use](https://developer.whoop.com/api-terms-of-use/) (effective October 6, 2026) govern its official API, §1.4: "Company will only access (or attempt to access) any API by the means described in the WHOOP documentation for that API." Kaiord does not use WHOOP's official API.

### What you lose if access is cut off

- Importing your WHOOP recovery data into the Kaiord App: heart-rate variability, sleep, strain, vitals, heart rate, stress and activities.
- Importing your WHOOP Advanced Labs biomarker results.
