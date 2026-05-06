---
"@kaiord/train2go-bridge": patch
---

Fix `read-day` clobbering activity dates with `""`. The daily HTML fragment from `/api/v2/workplan/daily/{date}` contains no date anchor (the weekly endpoint uses the CSS class `workplan-table-date-YYYY-MM-DD`, absent in the daily endpoint), so `parseDailyHtml` left every activity with `date: ""`. The bridge transport now backfills the date from the request param before returning, restoring the SPA's per-day calendar bucketing.

Visible symptom this resolves: when the user clicked a Train2Go coaching activity card to open its detail dialog, the dialog's lazy description-fetch (`expandDay`) upserted the activity with `date: ""`, dropping it out of every calendar day bucket. The card vanished from the calendar the moment the dialog opened, even after the dialog was dismissed.
