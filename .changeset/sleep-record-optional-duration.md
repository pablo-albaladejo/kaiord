---
"@kaiord/core": minor
---

`sleepRecordSchema` can now hold a night whose stages or duration were not recorded. `stages: []` means the stages were not recorded, so the stage-sum check runs only when stages are present. `totalDurationSeconds` is now optional, and an absent value means the duration was not recorded, for example when only a sleep score was entered by hand. Before this change, the only valid duration for a night without stages was about 0 s, so producers had to choose between inventing stages and writing a zero-length session. A record with stages still needs `totalDurationSeconds`. Code that reads `SleepRecord.totalDurationSeconds` must now handle `undefined`.
