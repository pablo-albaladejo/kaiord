---
"@kaiord/core": minor
---

Add a `write:body` export capability to the `body-composition` managed data
type. Previously it declared only `import: "read:body"`, so
`eligibleBridgeIds("body-composition", "export", …)` resolved to no bridges and
no governed body-composition export route could be declared. With
`export: "write:body"`, garmin-bridge (which announces `write:body`) becomes an
eligible export sink, unblocking the Data Hub export route and
`resolveExportPolicies` for the Tanita → Garmin body-composition sync.
