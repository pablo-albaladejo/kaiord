---
"@kaiord/workout-spa-editor": patch
---

fix(spa-editor): Data Flows zero-state no longer dead-ends a fresh profile

The "Data Flows" tab keyed its zero-state banner on whether any
IntegrationPolicy already existed, so a profile with a connected bridge but
no policies showed "Connect a bridge to start syncing data with kaiord" and
rendered no groups — leaving the "+ Add source/destination" buttons (the only
way to create the first policy) unreachable. The banner is now keyed on bridge
presence: groups render as soon as a bridge is discovered, and the banner only
appears when no bridge is connected.
