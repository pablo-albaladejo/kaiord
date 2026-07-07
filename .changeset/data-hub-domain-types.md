---
"@kaiord/core": minor
---

feat(core): add `planned-session` and `activity` managed data types

Replace the decorative `training-plan` type with first-class `planned-session`
(a single coach-prescribed session) and add `activity` (an executed session:
mandatory summary + optional recorded KRD). Give `training-zones` a real schema
so `MANAGED_DATA_REGISTRY` carries zero `z.unknown()` passthroughs. The
`read:training-plan` capability token stays mapped N:1 to `planned-session`
(no rename); `read:activities` is introduced for the executed-activity pull.
