# Design — the inline source-of-truth control

## D1. "Change" writes `priority`, and says so first

The alternative Wave 2a recorded and deferred was to leave the control writing
nothing but an order, keeping `union`. That is incoherent: `union` has no order —
`resolveEffectiveSource` returns every source's record and ignores `sourceOrder`
entirely, and `use-source-policy-editor.ts` erases the order when the user picks
union. A control that stored a ranking under `union` would store a value nothing
reads and leave the pill saying "2 sources" immediately after the user chose one.

So picking a source stores `mode: "priority"`. The user operating a control whose
whole purpose is to choose a source of truth IS expressing a ranking; recording
one is the honest reading of the action, not an inference about it.

What that cannot be allowed to become is a silent change. `priority` genuinely
changes how the type is read: `union` keeps every source's record for a day and a
consumer needing one value takes `records.at(-1)`; `priority` consults the order
and returns the first source with a record that day, or nothing. A user who came
to "pick where my weight comes from" did not necessarily come to change what is
STORED for it, and this programme has already shipped one requirement that could
be satisfied while surprising the user.

The panel therefore states, before either button is reachable:

> Right now Kaiord keeps every source's Weight and ranks none of them; when it
> needs a single value it uses whichever arrived last.
>
> Pick a source below and that changes: Kaiord will read Weight from the one you
> pick, and use the others only on days it has nothing. You can go back to
> keeping every source right here.

Three properties are load-bearing. It names THIS row's type rather than "this
data type". It states the current behaviour as well as the new one, because
"prefer WHOOP" only reads as a change against "keep everything". And it states
the reversal in the same breath as the change, because a reversible consequence
and an irreversible one warrant different amounts of hesitation.

### D1a. An already-ranked row is not warned

Re-picking on a `priority` row changes which source leads. Read semantics do not
change. Repeating the warning there would describe a consequence that cannot
happen, which trains the user to skip it on the row where it is true. That row's
intro states what it reads today instead ("Kaiord reads Weight from Tanita first,
and falls back to the others on days it has nothing").

`rankedUnavailable` gets its own third intro: it is ranked, so no mode changes,
but there is no head to name and the resolver is returning nothing. Wave 2a could
only report that state; this is the change that makes it fixable.

## D2. Reversibility is a first-class option, not an escape hatch

"Keep every source" is the first choice in the list, present on every row that
shows the control. It is not a "reset" buried under the thing that caused the
change, and it takes exactly one click from the same panel.

It also drives the render rule: the control appears when the row has at least
two sources, or at least one under a stored ranking.

| row state                    | control | why                                                          |
| ---------------------------- | ------- | ------------------------------------------------------------ |
| no source, either mode       | absent  | nothing to pick and nothing to keep; both modes read nothing |
| one source, default mode     | absent  | no second way to read it; the mode flip buys nothing         |
| two or more sources, default | present | the case the warning exists for                              |
| one or more, `priority`      | present | a ranked type stays un-rankable-back as sources drop away    |

The `priority` half exists for reversibility: rank a type while two sources
exist, then switch the second import off, and a `choices >= 2` rule alone would
strand it in `priority` with no way back from either this page or the Data Hub
(whose editor applies the same `< 2` skip).

The zero-source row is excluded even when ranked, which the first cut got wrong.
It is reachable — rank `planned-session` through chat, then Disconnect Train2Go,
which switches off every policy on the bridge, leaving a type with no manual path
and no route. There the panel would have to open with "it is ranked to sources
that are switched off", describing a ranking problem the row does not have: its
trouble is that the type has no source at all, which the pill already says. The
two modes are also indistinguishable there — both read nothing — so nothing is
lost by waiting until a source returns.

## D3. The writer and the reader share one definition of "first"

Wave 2a deliberately did not use `orderSources` for attribution: it APPENDS
available-but-unranked sources, so its head can be a source
`resolveEffectiveSource` never reaches — a shipped bug. That reasoning is about
READING a head out of a possibly-incomplete stored order, and it still holds:
`current` (which choice is marked as the one in use) is `rankedHead`, the first
SAVED entry that is still available, exactly what the resolver consults.

`orderSources` is exactly right for the other direction. `promoteSource` composes
the order to STORE as `[picked, ...everything else]` over the merged candidate
list, so after the write the stored order really does contain every source — the
appending is materialised in storage rather than imagined by a reader. The
end-to-end test feeds the written order straight back into
`buildDataTypeRoutingRows` and asserts the pill names the picked source, so the
two directions cannot drift.

The set both directions range over is now one function, `availableSources`,
moved out of `data-type-routing.ts` into `data-type-sources.ts`. Two copies of
"enabled import routes ∪ manual" would let the pill name a source the control
cannot offer.

## D4. An order that resolves to nothing cannot be composed here

The chat writer refuses to persist a ranked order whose names do not resolve,
because `resolveEffectiveSource` then reads NO record for the type. This control
is held to the same standard, structurally rather than by a guard:
`promoteSource` builds the order out of `choices`, `picked` is always one of
them, and the control does not render at all when there is nothing to pick. The
empty order has no construction site.

No runtime check is added for it. A guard against a state the code cannot reach
is the same defect as a test aimed at one — it stays green while proving nothing,
and it invites a later reader to believe the state is reachable.

## D5. Capability: offered sources are ones that can actually serve the type

`applyRouteToggle` (chat `enable_route`) performs no capability check — issue
#1085, not fixed here. So an enabled import policy exists for pairings the Data
Hub renders `na`: `enable_route stress garmin import` succeeds even though Garmin
announces `write:workouts`, `read:activities` and `write:body` and can never
deliver stress. Wave 2a counts such a route (correctly — it mirrors what the
resolver filters by). Offering it as a SOURCE OF TRUTH is different: it would
rank first a source that can never produce a record.

`canServe` therefore filters the candidates by both halves of the check the rest
of the SPA uses — `bridgeSupportsRoute` (static: narrows a shared token such as
`read:body` to the routes the SPA actually serves) and the announced wire token.

The subtlety is the third state. `bridgeDiscovery.getCapabilities` returns `null`
for a bridge it has not verified, which is every bridge before discovery answers
and any bridge whose extension is not installed in this browser. `null` is
treated as "not asked yet", NOT as "cannot": an enabled WHOOP sleep route owns
stored records the resolver reads whether or not the extension is running today,
and dropping it would take a real source off the list on every page load that
beat discovery to it.

**Known, accepted divergence**: two chat calls (`enable_route` an incapable
route, then `set_source_policy` ranking it first) leave the pill naming a source
`canServe` refuses to offer, so no choice is marked current. The row is honest in
both directions — the resolver really would consult that source and it really
cannot serve the type — and picking any offered source fixes it. Compensating
further here would mean re-implementing #1085's missing check at the display
layer, where it cannot stop the write.

## D6. Every test names a reachable state and the writer that creates it

Following D4a of Wave 2a, whose fixtures described routes the capability gate
forbids. Each test below states the state it fails on and the writer that mints
it; the guards were then mutated one at a time and the failing test recorded, so
none of them is aimed at a state the code cannot reach.

| guard                                            | mutation                           | test that fails                                                                 |
| ------------------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------- |
| capability filter                                | filter removed                     | "should not offer a source whose bridge cannot serve the type"                  |
| `null` capabilities mean unverified              | `null` treated as incapable        | "should keep offering a source whose extension has not been verified"           |
| `promoteSource` leads with the pick              | pick ignored                       | 4 tests, incl. the end-to-end reader agreement                                  |
| render rule (lone source)                        | offered on every row with a source | "should offer no change on a row with a single source under the default mode"   |
| render rule (ranked, no source left)             | offered on any ranked row          | "should offer no choice on a ranked row that has no source left at all"         |
| `current` is `rankedHead`, not `orderSources[0]` | read via `orderSources` head       | "should report no current source when the stored order ranks nothing available" |
| the union warning                                | never shown / always shown         | the two warning tests, one each way                                             |
| `keepAll` clears the order                       | order survives the union write     | "should offer the way back to keeping every source from a ranked row"           |
