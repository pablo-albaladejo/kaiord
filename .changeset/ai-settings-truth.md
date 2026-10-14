---
"@kaiord/workout-spa-editor": patch
"@kaiord/ai": patch
---

AI settings show what actually runs. Each model row is one select of account and model together, shows the effective resolution, and a purpose without its own model says it follows the main model. The main model is the athlete's default binding (the provider "Default" badge and "Set Default" button are gone). A blank model id is rejected when saved, and `resolveModelForPurpose` heals bindings already stored blank by running the bound provider's model. Provider rows show only the key's last four characters, editing no longer puts the key back into the page, and removing a provider asks for confirmation and deletes the bindings that used it.
