---
"@kaiord/workout-spa-editor": patch
---

The Units, Language and Notifications preferences and the editor's "Send to Garmin" button stay disabled until the record they write to has loaded. Before, a tap that landed first, which is likely on a slow phone, looked accepted but was dropped: the preference never saved and nothing was sent to Garmin.
