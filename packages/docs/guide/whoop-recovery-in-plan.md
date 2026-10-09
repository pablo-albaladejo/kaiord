---
title: "WHOOP recovery in your training plan"
description: "Bring WHOOP recovery, HRV, sleep and strain into Kaiord next to your planned workouts, and ask the AI assistant whether to push or back off."
---

# WHOOP recovery in your training plan

WHOOP tells you how recovered you are; your plan tells you what to do today.
Kaiord puts both in one place, in your browser, so you can decide whether to
keep the session, swap it or make it easier.

_Leer en español: [La recuperación de WHOOP en tu plan de entrenamiento](/es/guide/whoop-recovery-in-plan)._

::: warning Early access
The Kaiord WHOOP Bridge extension is **not yet published** on the Chrome Web
Store. Today it can only be loaded unpacked from the
[source repository](https://github.com/pablo-albaladejo/kaiord/tree/main/packages/whoop-bridge).
:::

## How the data gets in

The WHOOP Bridge is a read-only Chrome extension. It uses the session you
already have open on `app.whoop.com`: there is no WHOOP developer account, no
OAuth app, and you never give Kaiord your WHOOP password. With the extension
installed, the Kaiord app syncs when you open the calendar, and on demand from
**Sync now** under **Settings → Connections**.

It imports:

- **Recovery**: the recovery score, stored with your overnight HRV (rMSSD)
- **Sleep**, **strain** and daily **vitals** such as resting heart rate
- heart-rate series, **workouts** (as recorded activities), stress episodes
  and Advanced Labs biomarkers

Everything is stored locally in your browser (IndexedDB). Kaiord runs no
server that receives it; see the [privacy policy](/legal/privacy-policy).

## Where recovery shows up

- **Daily**: the readiness card combines your recovery (HRV) score and your
  sleep score, next to the sessions planned for today.
- **Health → Recovery**: 90 days of HRV history.
- **Calendar**: your planned workouts for the week, with recorded activities.

## Adjusting the plan

Kaiord does **not** change your plan automatically when recovery is low. You
stay in control:

1. Open today's workout and choose **Adjust with AI**.
2. Ask, for example, "My recovery is low today, make this session easier".
   The assistant can read your recovery, HRV and sleep records.
3. Review the proposal. Changes that create a workout wait for you to
   **Approve** them.

The assistant needs your own AI provider key; see
[Plan your training with AI using your own API key](/guide/ai-planning-byok).

## Related

- [Kaiord vs TrainingPeaks, intervals.icu and Garmin Connect](/guide/kaiord-vs-trainingpeaks-intervals-garmin)
