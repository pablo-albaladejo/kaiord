## Why

Ticket #1631 (parent #1670, stories 60–61; ADR 0002). Kaiord reaches every
Platform through the athlete's own Session, not an official API. ADR 0002
accepts that risk on condition that it is declared: a public register says,
per Platform, that access is unofficial, what the Platform's terms say about
it, and what the athlete loses if it is cut off. No such page exists.

## What Changes

- **The register.** `packages/docs/legal/platform-access.md`, served at
  `https://kaiord.com/docs/legal/platform-access` and listed in the docs'
  Legal sidebar: one entry per Platform (Garmin, Train2Go, Tanita,
  TrainingPeaks, WHOOP), each with three parts: how Kaiord reaches it, what
  its terms say (a narrow, dated, linked reading of the Platform's own terms,
  or a plain statement that they could not be read), and what the athlete
  loses if access is cut off (from what each Connector reads and writes
  today). It says in plain words that Kaiord for Garmin mints tokens with
  Garmin's consumer key and secret as published by third parties, that WHOOP
  is experimental and not published to the extension store, and that tokens
  may be kept in the athlete's browser and never travel to Kaiord.
- **Its claims are registered** in `claims/platform-access.json`: code and
  tests for behaviour, the terms URL as an endpoint proof for what the terms
  say.
- **Linked** from the landing footer and from the Connections page of the
  Kaiord App (English and Spanish).

## Capabilities

### New Capabilities

- `platform-access-register`: the public register of unofficial access.

## Impact

- `@kaiord/docs`: a new legal page, a sidebar entry, a test.
- `@kaiord/landing`: one footer link and its Spanish string.
- `@kaiord/workout-spa-editor`: one link on the Connections page, one
  `connections` key in English and Spanish.
- `claims/`: a new register file.
- No legal advice: the page reports what the terms say, not what follows
  from them.
