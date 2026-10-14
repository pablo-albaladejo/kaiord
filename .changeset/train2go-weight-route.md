---
"@kaiord/train2go-bridge": minor
"@kaiord/workout-spa-editor": minor
---

Train2Go is a proper weight source in the Data Hub. The Train2Go extension announces `read:body` (manifest and page announcement alike) and its popup lists Weight among the types it feeds; it reads nothing new, the weight already came from the zones sync. The editor narrows Train2Go to planned sessions, training zones and weight, seeds the weight route when Train2Go is linked, lets the weight row switch it on and off, and lets Train2Go be ranked as the weight's source of truth. The zones sync obeys that route: switched off, the weight is neither recorded nor offered as a conflict. With no route at all (an extension released before this one, or a link made before the update) the weight is recorded exactly as before.
