# Open-Core / Monetization Analysis

> Status: analysis (not a commitment) · Date: 2026-07-10 · Owner: Pablo Albaladejo
>
> Internal business/strategy document. NOT part of the public product docs site
> (`packages/docs` / kaiord.com). Do not link from user-facing surfaces.

## Recommendation (TL;DR)

Keep the **framework** (core + format adapters + CLI + MCP + AI SDK layer) open
source under MIT — it is the adoption engine. Do **not** close the SPA. The
monetizable product is **not code that exists today**; it is the set of
**cloud services that do not yet exist** (accounts, managed sync, managed AI
without bring-your-own-key, coach/teams).

Today the whole app runs at ~**$0/month** for us (GitHub Pages + Cloudflare free
+ BYOK AI), so there is no cost pressure forcing monetization — the lever is
revenue, and it means **building a paid layer**, not locking down existing code.

**Model: open-core + a separate private `kaiord-cloud` repo.** Everything that
exists stays MIT; new commercial work (backend + premium modules) is born
private. This avoids relicensing, preserves the community/funnel, and puts the
paywall where there is real marginal cost and convenience.

## Current state (facts established 2026-07-10)

- Entire repo is **MIT, public, copyright ~100% Pablo** (one external
  contributor, 3 commits). Framework packages **published on npm v9.2.0**;
  `@kaiord/whoop` is ready but **not yet published**.
- SPA is **100% client-side / local-first**: Dexie/IndexedDB, no backend, no
  accounts, no payments, no feature flags. AI is bring-your-own-key with direct
  browser→provider calls; the Vercel AI gateway is deliberately stubbed out.
- Local **token/cost metering** already exists with UI
  (`usage-schemas.ts`, `provider-rates.ts`, `UsageTable`) — the conceptual seed
  of billing, but it lives in each user's IndexedDB and is not auditable.
- Landing publicly promises **"open-source, free, local-first, no server in
  between"**, with schema.org `price: 0` and a Sponsors CTA.
- Infra ≈ **$0/month** (Pages + Cloudflare free + npm). No cost pressure to
  monetize; the pressure would be revenue, not spend.

## The natural cut

**Open-source layer (keep MIT — the adoption engine):**

| Package | Why open |
| --- | --- |
| `@kaiord/core` | The crown jewel: KRD format, planned/activity model, health, zones, energy-balance. Its value is becoming a de-facto standard — only happens if open. |
| `fit`, `tcx`, `zwo`, `garmin` | Conversion adapters; replaceable commodity, value = community & trust. |
| `garmin-connect`, `whoop` | Pure API clients. Publish `@kaiord/whoop` now (it is ready). |
| `cli`, `mcp` | Developer / Claude-IDE top-of-funnel. Zero direct SaaS potential, high distribution value. |
| `ai` (SDK layer) | Providers/prompts/agents/evals — easily replicable; value is adoption. |
| `docs` | Ships with the framework. |

**Product layer (where freemium goes):**

- **The SPA as a free app** remains the free tier — already built, already
  honors the public promise, and without it there is no funnel.
- **The paid part is what does not exist**: backend with accounts, managed
  multi-device sync (today sync is user's own Google Drive), **AI included
  without your own key** (server proxy with our key + quotas), coach/teams,
  advanced health reports.
- **Bridges** are a grey zone: part of the product, but be careful monetizing
  them directly (see risks).

## Freemium design

- **Free (local-first, as today):** editor, calendar, library, manual health
  V1, nutrition, format import/export, bridges, sync via user's own Google
  Drive, AI with your own key (BYOK). Honors the public narrative and costs us
  nothing to serve.
- **Pro (~€5–9/mo; ref: TrainerRoad/TrainingPeaks €20+, intervals.icu is
  donation):** AI included with zero setup (managed monthly token quota — the
  "get an Anthropic API key" friction is the current product's #1 conversion
  barrier), managed sync with an account, backup/restore, AI lab extraction
  (labs V2) with a generous quota, unlimited chat history.
- **Coach/Teams (later):** multi-athlete, plan distribution, aggregated
  compliance view. The `spa-coaching-integration` spec + session-match already
  point here.

The correct value lock is **managed AI**: that is where real marginal cost
exists (tokens), where we already have redaction-safe telemetry and a monthly
usage/cost model as a base, and where the free tier (BYOK) still exists for
self-hosters. This is the "uncrippled open source + convenient cloud" pattern
of Plausible / Cal.com.

## Legal & risk constraints

1. **You can close code if you want**: MIT + near-total ownership. To relicense
   history rigorously, get consent from the external contributor (3 commits) or
   isolate their contributions — advisable but not blocking.
2. **The Garmin FIT SDK is the one hard constraint**: proprietary, royalty-free,
   **forbids copyleft** (§2d) but is compatible with closed source. This
   **rules out AGPL/BUSL for anything that bundles `@kaiord/fit`** (the SPA
   bundles it). Any future app protection would have to be proprietary, not
   copyleft. Also reconcile publishing `@kaiord/fit` as "MIT" while depending on
   a proprietary SDK.
3. **Serious ToS risk if you charge for the session bridges**: garmin-bridge and
   train2go-bridge automate private APIs via the user's session — defensible
   free & personal, fragile as a paid service (extension takedown, blocking).
   For a paid Garmin tier the serious path is the **official Garmin Connect
   Developer Program**. WHOOP has an official developer API — the commercially
   safest integration (and matches the pending whoop-bridge pivot, which on
   `main` still uses the wrong OAuth-developer model).
4. **Public cannot be unpublished**: everything in the repo today (including the
   SPA, which is only `private` on npm) is MIT forever in history. Closing only
   protects *future* work. This reinforces not closing the SPA: its current
   version is already forkable forever; the real moat is iteration speed +
   integrations + user data, not code secrecy.
5. **Public narrative** ("free, no server") needs an honest reposition: "the app
   is free and local-first forever; the cloud is optional and paid." If the free
   tier stays the full local-first app, nothing promised is betrayed.

## Recommendation & first steps (in order)

1. **Immediate hygiene:** publish `@kaiord/whoop`; add a **CLA or DCO** to
   CONTRIBUTING.md *now* (before more external contributions arrive); regenerate
   `THIRD-PARTY-LICENSES.md` and document the FIT SDK situation.
2. **Decide the repo boundary:** create private `kaiord-cloud` for backend and
   premium features. The public SPA consumes cloud via ports — the hexagonal
   architecture (23 ports, swappable adapters) makes this cut cheap: the paid
   tier is literally "another adapter" for sync and another AI provider.
3. **Commercial MVP = managed AI gateway:** light auth + LLM proxy with our key
   + monthly quota + the existing usage model, moved server-side with `userId`.
   Minimal backend with the clearest value prop ("AI with zero setup").
4. **Then:** managed sync as the second Pro benefit, coach/teams as a higher
   tier. Paid integrations only via official channels (WHOOP API, Garmin
   Developer Program).
5. **Reposition the landing** once the first tier exists: "free forever,
   local-first" + optional "Kaiord Cloud", and drop the absolute schema.org
   `price: 0`.

## Related

- Memory: `kaiord-monetizacion-split`, `kaiord-producto-direccion`,
  `kaiord-whoop-bridge-pivot`, `kaiord-ai-platform-programa`.
