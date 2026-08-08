---
"@kaiord/workout-spa-editor": patch
---

Retire the accent blue from the feature surfaces it survived in. The AI banner, prompt panel and success strip drop their blue-tinted gradients for neutral elevated surfaces; profile and sport-zone tabs, zone-editor fields, the context menu's focus ring and the coaching inline link all move to the `accent` role; the three remaining raw blue submit buttons take the neutral primary fill; and the five per-format import chips become one neutral chip, since the format's name already says which one it is. The zone editor also stops painting zones with a seven-hue rainbow of its own and reads the canonical `--zone-1..5` ramp. Adds `check-frozen-hex-parity`, which pins every hex a canvas or chart module has to freeze against the role it mirrors — it caught one already-drifted value on its first run.
