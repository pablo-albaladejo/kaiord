## Context

Chrome localises an extension through `_locales/<locale>/messages.json`:
`__MSG_extName__` and `__MSG_extDescription__` in the manifest, and
`chrome.i18n.getMessage` at run time, in the browser's UI language with
`default_locale` as fallback. The extensions already used `__MSG_*__` and a
single `en` catalog; the shared notices had both languages and the popups
asked for English.

## Decisions

### D1. One name in every language

The name is "Kaiord for <Platform>" in `en` and `es`. The App's Spanish
notices already say "Kaiord for Garmin", and a second name ("Kaiord para
Garmin") would be a sixth spelling of the same product. Rejected: translating
"for".

### D2. The popup's language is the catalog's language

`uiLocale()` maps `chrome.i18n.getUILanguage()` to `es` when its primary
subtag is `es`, else `en`: with exactly two catalogs this is the catalog
Chrome renders, so the notice and the date never mix languages with the rest
of the popup. Rejected: a per-catalog `locale` message (a key with no words);
`navigator.language` (the content language, not the UI language Chrome uses
for `_locales`).

### D3. popup.html holds no words

Each element that shows text is empty and names its message
(`data-i18n`, `data-i18n-aria-label`); `localizePage()` fills it before the
first render and sets `<html lang>`. Rejected: English text in the markup
replaced at load (a second English source the guard would have to compare).

### D4. The fallback table repeats the English catalog

`KAIORD_POPUP_MESSAGES` stays, because the jsdom suites have no
`chrome.i18n`; the locale rule asserts each value equals `_locales/en` with
positional placeholders, so it is a copy, never a source.

### D5. The vocabulary guard reads the texts the other guards already collect

The athlete-facing word check reuses the claims register's surfaces and
`athleteTexts()` of the Connection-notices guard (App dictionaries, App UI
literals, `_locales`, popup strings), plus a short list of files and
sections. Code, package names and developer docs keep "bridge"; an allowed
phrase that no text holds any more fails, so the allowlist cannot rot.

## Risks

- Renaming a published listing changes what the store shows only when the
  next version is published; until then the store shows the old name while
  the policy and docs show the new one.
- The Spanish copy is written by an agent and is the owner's to approve.
