# Design — Rebrand V2 · bridge popups

## D1. Why the popup, not the background, stamps the health record

The obvious home for "when did this break" is `background.js`: it owns the
session, and a service worker could notice a failure the user never sees.

It is the wrong home here, for three reasons.

1. **Nothing polls.** No bridge runs a periodic session check. `background.js`
   learns a session is broken only when something asks it to do work — and for
   Tanita, TrainingPeaks and WHOOP the only thing that asks on a schedule the
   user perceives is the popup opening. A background-owned stamp would carry
   the same information with more machinery.
2. **A new internal action widens a guarded surface.** The internal
   popup→background action surface is enumerated per bridge and checked by
   `check-bridge-privacy-surface.mjs`; the external surface has its own
   allowlist with a dedicated guard scenario ("A widened external-action surface
   is caught"). Recording a timestamp is not worth spending a new action on.
3. **The popup already reads `chrome.storage.local` directly.**
   `garmin-bridge/popup.js` does exactly this for `profileSnapshot` and
   `lastPushReceipt`. Keeping the health record in the same layer keeps the
   read and the write next to each other.

So `bridge-popup-health.js` is a popup-layer module: `readHealth()` before the
probe, `recordProbe(ok)` after it.

## D2. What the date is allowed to claim

`brokenSince` is **the first probe at which this bridge was observed broken**,
not the moment the upstream session actually expired. Those differ: a session
can lapse on Tuesday and go unnoticed until the popup is opened on Friday.

The copy is written to be true of the weaker fact. "Nothing has reached Kaiord
since 23 Jul" is a claim about Kaiord's own intake, which the stamp does
establish. It is not phrased as "your session expired on 23 Jul", which it
does not.

Three states, and each renders a different sentence:

| Health record                | What the popup knows            | Cause sentence    |
| ---------------------------- | ------------------------------- | ----------------- |
| `brokenSince` set            | first failure was observed then | dated variant     |
| no record, probe fails       | never observed working          | dateless variant  |
| `lastOkAt` set, probe passes | working now                     | connected variant |

The dateless variant is the existing copy, unchanged. Nothing invents a date,
which is the same rule `add-connections-page` applied when it declined to ship
this line at all.

`recordProbe` clears `brokenSince` on the first success, so a bridge that
breaks, is fixed, and breaks again dates the _current_ outage rather than the
first one ever.

## D3. Why a monogram and not the mark

`atoms/BrandMark` is Kaiord's mark. It answers "whose app is this", and the
header already answers that in words — "Kaiord · WHOOP". What the corner slot
has to answer is "which of my five bridges is this popup", at 22px, in a
palette with no hues to spend.

Initials do that with the alphabet instead of the wheel, which is what the V2
screen's own note says: _"the monogram chip from the Connections page says the
same thing and belongs to this palette"_. The glyph becomes the per-bridge
variable that `--accent` used to be — declared in each `popup.html`, absent from
every master, so no brand name enters shared code.

The chip has two tones. It takes `--kd-border-soft` on `--kd-text-primary` when
the bridge's identity is established (connected, or broken after having worked),
and the dimmer `--kd-bg-elevated` on `--kd-text-muted` while checking or when
the bridge has never signed in — matching the five cards on the V2 screen, where
Garmin, Train2Go and WHOOP carry the strong chip and Tanita and TrainingPeaks
the muted one.

## D4. An icon, not a colour, for states that need the user

The palette has no success green and no warning amber, on purpose. The V2
screen resolves a broken state as a 17px alert-triangle in `--c-ink` beside the
verdict, where a healthy state has a 7px dot.

So `renderStatusBlock` grows a `mark` dimension orthogonal to `tone`: `dot` (the
default) or `alert` (an inline `<svg><use>` of the sprite each `popup.html`
carries). The connected dot animates `kpulse` at 1.8s and the checking dot at
1.2s, both suppressed under `prefers-reduced-motion`.

## D5. Skeleton regions are declared by the popup, not guessed by the shell

`renderSkeleton($)` hardcodes two region ids because when it was written every
popup filled two regions. Four of the five now fill more, and the fifth
(Tanita) fills exactly those two.

Rather than teach the master which bridge has which regions — which would put
bridge knowledge in a shared file — `renderSkeleton` takes a spec:

```js
renderSkeleton($, [
  { region: "chips-region", parts: ["caption", "chips"] },
  { region: "consequence-region", parts: ["line", "line-short"] },
  { region: "footer-region", parts: ["cta", "secondary"] },
]);
```

Each popup names the regions it will fill and composes each from primitives —
`caption`, `chips`, `line`, `line-short`, `cta`, `secondary`, `block`,
`block-sm` — rather than picking from a fixed table of whole-region shapes. A
primitive list stays open: the next region shape a bridge needs is a new
combination, not a new entry in the master.

The shell stays bridge-agnostic; the height match becomes a property each popup
declares and its own suite asserts. A declared region the document does not
have is skipped rather than created, and an unknown part name is ignored, so a
typo degrades to a missing placeholder instead of a popup that throws before it
renders.

The default argument reproduces the two-region behaviour, so the change is
additive for any future bridge that only needs those.

## D6. Tokens added, and why each is a role rather than a hex

Two `--kd-*` colour tokens join the master, each pinned in the parity guard's
`TOKEN_SOURCES`:

| Token                | Role              | Used by                           |
| -------------------- | ----------------- | --------------------------------- |
| `--kd-text-disabled` | `--text-disabled` | the idle/checking status dot      |
| `--kd-zone-4`        | `--zone-4`        | Garmin's last-push card left edge |

The V2 screen wants `--c-line` (`#5b5b5b`) for the idle dot, and no role
resolves to that literal. `--text-disabled` (`#747474`) is the role whose
MEANING matches — a mark that is present but inactive — and it sits one step
below `--text-dim` on the same achromatic ramp, which is the relationship the
screen was drawing. Matching the role beats matching the hex: the guard pins
`--kd-*` to `styles/brand-tokens.css`, so a literal with no role behind it
could not be expressed at all.

The danger ramp is deliberately NOT added; see the proposal's "No
danger-tinted chip" — the broken-vs-paused distinction it encodes is routing
state no bridge extension can see.

`--kd-ease` is added as `cubic-bezier(0.2,0,0,1)`. It is deliberately not in
`TOKEN_SOURCES`: the guard's reader only captures `--kd-*` declarations whose
value is a hex literal, so a timing function is outside its remit by
construction rather than by omission.

## D7. What the V2 screen is not authoritative about

The screen draws WHOOP's seven data types on the **Garmin** card ("Activity,
Sleep, HRV, Vitals, +4 more") and gives Train2Go a "Workout ↑ back to coach"
chip. Garmin moves Activity plus two push-back types; `train2go-bridge` has no
push-back action at all — its background dispatches `read-week`, `read-day`,
`read-details` and the snapshot pair, and nothing else.

Both are mock artefacts. Porting them would put a capability claim in a popup
that the extension cannot honour, which is the failure the TrainingPeaks popup
already has a comment about ("manifest-true and user-false"). The chip
inventories stay as the code defines them; the screen is authoritative on
layout, type, spacing and state copy.
