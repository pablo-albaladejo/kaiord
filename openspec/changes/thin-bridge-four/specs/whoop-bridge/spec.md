## ADDED Requirements

### Requirement: Kaiord for WHOOP is a thin Bridge

Kaiord for WHOOP SHALL speak protocol version 2 and answer the Kaiord App's reads only through `{ action: "request", method: "GET", path }` on the closed list in `background.js` (the cycles, heart-rate metrics, sports catalog, biomarker tests, one test's summary and daily stress paths the Connector builds), relaying each to the content script of the open `app.whoop.com` tab, which runs it and hands WHOOP's answer back unread. A read SHALL still fail without an open WHOOP tab. It SHALL no longer serve `whoop-fetch`, SHALL answer its internal channel only to its popup (`popup-status`, `tab-open`), and SHALL take `capture-token` only from its own content script on `app.whoop.com`, answering nothing.

#### Scenario: A bearer from another page is not taken

- **GIVEN** a `capture-token` message from this extension's content script on `https://kaiord.com`
- **WHEN** it reaches the service worker
- **THEN** nothing is stored and nothing is answered
