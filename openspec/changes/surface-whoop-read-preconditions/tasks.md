## 1. Shared popup shell

- [x] 1.1 Add `.consequence` / `.consequence__line` to the bridge-core `popup.css` master, using existing `--kd-*` tokens only so the token-parity guard stays green.
- [x] 1.2 Add `renderConsequence` to the `bridge-popup-shell.js` master, no-op when the popup declares no region, and export it.
- [x] 1.3 `pnpm bridge:sync`; confirm all five bridge suites still pass.

## 2. The third WHOOP state

- [x] 2.1 `background.js`: add the internal `hasWhoopTab` handler behind a `tab-open` action, left out of `EXTERNAL_ACTIONS`.
- [x] 2.2 Test `tab-open` both ways, plus that a stored bearer does not affect the answer, plus that the external action set stays exactly `ping`/`status`/`whoop-fetch`.
- [x] 2.3 `popup.html`: add `consequence-region`.
- [x] 2.4 `popup.js`: ask `status` and `tab-open` together; render signed-out, no-tab, or connected; treat a failed probe as no tab.
- [x] 2.5 Consequence copy for all three states, in `_locales/en/messages.json` and the byte-identical fallback table (message-parity guard).
- [x] 2.6 Popup tests for the no-tab state, the failed probe, and the precedence case — the last one on the state that can actually see it.

## 3. The card's fix link

- [x] 3.1 `application/connections/source-fix-link.ts`: `attention`-only, account-independent URLs, unlisted source renders nothing.
- [x] 3.2 Render it in `ConnectionCardHeader` beneath the detail sentence, `rel="noopener noreferrer"`.
- [x] 3.3 `fixAtSource` copy in both locales.
- [x] 3.4 Tests: the link's destination and rel, every non-attention status, an unlisted bridge, a bridgeless source, and that the diagnosis survives beside the link.

## 4. Mutation checks

Each test below was re-run against a mutant of the line its title names; all
eleven fail as required. One did not, and is recorded because the fix is the
point: the precedence test originally used `tabOpen: true`, which cannot
distinguish the two branch orderings, and **survived** — it now uses the state
that can.

- [x] 4.1 popup: ignore `tabOpen`; failed probe treated as open; branches swapped; every `renderConsequence` call removed.
- [x] 4.2 background: `hasWhoopTab` always true; `tab-open` added to `EXTERNAL_ACTIONS`.
- [x] 4.3 fix link: attention gate dropped; unlisted bridge falls back to the WHOOP URL; `rel` removed; link replaces the detail sentence; link never rendered.

## 4b. Review round

- [x] 4b.1 Rewrite the privacy-golden claim in `proposal.md` and `design.md`. Both sentences were true and their juxtaposition was not: it read as though the untouched golden evidenced the untouched action set. It does not — the golden covers `manifest`, `manifest_prod` and `allowed_paths`, and stays byte-identical even with `tab-open` in `EXTERNAL_ACTIONS`. Both documents now name `background.test.js` as the only thing pinning it.
- [x] 4b.2 `sessionSignedOutCause` no longer names a tab. The branch is reached on `!connected` whatever the tab is doing, and its commonest trigger — a browser restart emptying `chrome.storage.session` — routinely has no tab at all, so "Your WHOOP tab is signed out" was false in exactly the ordinary case. It now describes the bridge's own missing bearer, which is what `!connected` measures. Verdict and CTA unchanged; mutation-checked.
- [x] 4b.3 Two fixtures that did not test their titles. The bridgeless-source case is retitled to the contract it actually holds, with the scope recorded inline: the `bridgeId === null` clause is type-only, but the assertion is the only thing that kills a lookup defaulting a bridgeless source to another source's URL. The component's "extension is simply not running" case is gone — `bridgeDetected` steered nothing there and a missing extension resolves to `available`, never `attention`, so the titled scenario could not have produced a link under any value; it is replaced by a status-driven pair pinning what the component actually owns.
- [x] 4b.4 Record the popup/card division of authority in `design.md` D7, in the tree rather than in a PR body, including the direction a future reconciliation must take.

## 5. Spec sync

- [x] 5.1 `whoop-bridge`: tab-dependency requirement gains what a surface owes the user; internal-action enumeration gains `tab-open`.
- [x] 5.2 `spa-connections-page`: the fix-link requirement, written against the capability PR #1089 introduces.

## 6. Not done, and why

- [x] 6.1 No consequence box before a disconnect: the popup has no disconnect. Evidence in proposal.md.
- [x] 6.2 No brand logos: no licensed assets exist in the repo. Evidence in proposal.md.
