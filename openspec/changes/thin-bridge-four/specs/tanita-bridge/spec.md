## ADDED Requirements

### Requirement: Kaiord for Tanita is a thin Bridge

Kaiord for Tanita SHALL speak protocol version 2 and answer the Kaiord App's export read only through `{ action: "request", method, path }` on its closed list (`GET` and `HEAD` of `/en/user/export-csv`), answering MyTANITA's raw answer `{ status, contentType, body }` unread; telling a login page from the export is the App's. Its Session check stays a `HEAD` answering yes or no. It SHALL no longer serve `read-export-csv`, and SHALL answer its internal channel only to its popup (`checkSession`).

#### Scenario: A login page served in place of the export is handed over unread

- **GIVEN** MyTANITA answers the export with an HTML page
- **WHEN** the App asks for `GET /en/user/export-csv`
- **THEN** the answer carries that page and its `text/html` content type, unread
