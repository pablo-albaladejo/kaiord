---
"@kaiord/fit": patch
---

Activity FIT files import again. The FIT reader rejected every recorded activity (`Activity.fit`, pool swims, multisport, files with developer data) with a ZodError, because the session, lap, record and event schemas expected `timestamp` and `startTime` as numbers while the Garmin SDK decoder returns them as `Date`. Session and lap durations were also divided by 1000 although the decoder already returns seconds (a one-hour activity came out as 3.6 s), and a lap's swim stroke, which the decoder returns as a name such as `freestyle`, was rejected. Records that carry no timestamp cannot be placed on the timeline, so they are now dropped with a warning instead of failing the whole import.
