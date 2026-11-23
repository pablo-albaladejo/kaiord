<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-05-14 | Updated: 2026-05-14 -->

# test/fixtures/

Test data: HTML fragments and JSON responses from Train2Go APIs, used to validate what the extension still reads for its popup and Session check, without a live session. The daily and profile-page fixtures moved with their parsers to the Kaiord App's Train2Go Connector (`packages/workout-spa-editor/src/adapters/train2go/connector/fixtures/`); a copy of two of them stays here to prove that the extension removes Train2Go's anti-forgery token from every answer.

## Files

| File                       | Source                                                       | Purpose                                       |
| -------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| `weekly.html`              | Train2Go `/api/v2/workplan/weekly/{date}` response           | Tests the popup's `parseWeeklyHtml` counts    |
| `ping-active.json`         | Train2Go `/api/v2/profile/ping` response                     | Tests active session detection                |
| `ping-expired.json`        | Train2Go `/api/v2/profile/ping` response                     | Tests expired session detection               |
| `details-active.html`      | Train2Go `/user/details` page (copy of the App's fixture)    | Its `_token` field is removed from the answer |
| `daily-with-comments.html` | Train2Go daily workplan fragment (copy of the App's fixture) | Its `_token` field is removed from the answer |

## Usage in Tests

```javascript
import fs from "fs";
import { parseWeeklyHtml } from "../parser.js";

const fixturesDir = import.meta.dirname;

it("should parse activities from weekly HTML", () => {
  // Arrange
  const html = fs.readFileSync(fixturesDir + "/weekly.html", "utf-8");

  // Act
  const activities = parseWeeklyHtml(html);

  // Assert
  expect(activities).toBeInstanceOf(Array);
  expect(activities[0]).toMatchObject({
    id: expect.any(Number),
    date: expect.stringMatching(/\d{4}-\d{2}-\d{2}/),
    status: expect.any(Number),
  });
});
```

## Fixture Formats

### weekly.html

HTML fragments containing:

- Activity table rows with `data-id`, `data-status`, `class="measured"`, etc.
- Sport icons: `icon-sportsCycling`, `icon-sportsRunning`, etc.
- Workload values in `data-value="..."` attributes
- Titles in `title="..."` attributes

Used by `parser.js` with regex-based extraction (no DOM parsing in fixtures).

### ping-active.json, ping-expired.json

JSON responses from `/api/v2/profile/ping`:

```json
{
  "status": "ok",
  "profile_id": 12345,
  "name": "John Doe",
  "zones": { ... }
}
```

or

```json
{
  "status": "unauthenticated"
}
```

## Updating Fixtures

When Train2Go HTML structure changes:

1. Capture live HTML from `app.train2go.com` (F12 → Network → Copy Response)
2. Save to fixture file, **redacting any PII** (real names, profile IDs, email addresses)
3. Verify parser tests still pass: `pnpm --filter @kaiord/train2go-bridge test:watch`
4. Commit fixture change with explanation in commit message

**Privacy:** All fixtures must be **anonymized** — no real user data.

## For AI Agents

- Load fixtures via `fs.readFileSync(import.meta.dirname + "/filename", "utf-8")`
- Pass to parser functions; parsers expect raw HTML/JSON strings, not DOM objects
- Use fixtures to test graceful degradation (malformed HTML should not throw)
- When adding new parser functions, add corresponding fixture files

<!-- MANUAL: Log Train2Go HTML schema changes and zone format evolution here -->
