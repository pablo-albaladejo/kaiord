---
title: "Kaiord vs TrainingPeaks, intervals.icu and Garmin Connect"
description: "An honest, sourced comparison of Kaiord with TrainingPeaks, intervals.icu and the Garmin Connect workout builder: price, workout builder, Garmin sync, data and source code."
---

# Kaiord vs TrainingPeaks, intervals.icu and Garmin Connect

TrainingPeaks, intervals.icu and Garmin Connect are established platforms.
Kaiord is a young open-source project with a different shape: it runs in your
browser, keeps your data there and needs no account. This page
compares what each one offers, with a source for every claim about another
product. Prices and plans change; check the linked pages before deciding.

_Leer en español: [Kaiord frente a TrainingPeaks, intervals.icu y Garmin Connect](/es/guide/kaiord-vs-trainingpeaks-intervals-garmin)._

## At a glance (as of 2026-09-28)

|                                 | Kaiord                                                             | TrainingPeaks                                                                       | intervals.icu                                            | Garmin Connect                              |
| ------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------- |
| Price                           | Free, MIT licensed                                                 | Premium US$19.95/month or US$134.99/year [^tp]; free Basic tier [CONFIRMAR: source] | Free; optional US$4/month supporter plan [^iv]           | Free; optional Connect+ US$6.99/month [^gc] |
| Structured workout builder      | Yes                                                                | Yes [^tpwb]                                                                         | Yes, on the free tier [^iv]                              | Yes [^gcwb]                                 |
| Send planned workouts to Garmin | Yes, with the Garmin Bridge extension                              | Listed as a Premium feature: "Sync planned workouts to your device" [^tp]           | Yes, "Upload planned workouts" [^ivgc] [CONFIRMAR: tier] | Yes, native [^gcsend]                       |
| Workout file export             | FIT, TCX, ZWO, Garmin Connect, KRD                                 | [CONFIRMAR: formats and source]                                                     | [CONFIRMAR: formats and source]                          | [CONFIRMAR: formats and source]             |
| AI                              | Bring your own key (Anthropic, OpenAI, Google)                     | [CONFIRMAR]                                                                         | [CONFIRMAR]                                              | "Active Intelligence" in Connect+ [^gc]     |
| Account and data                | No account; data stays in your browser                             | [CONFIRMAR: source]                                                                 | [CONFIRMAR: source]                                      | [CONFIRMAR: source]                         |
| Source code                     | Open source ([GitHub](https://github.com/pablo-albaladejo/kaiord)) | [CONFIRMAR: source]                                                                 | [CONFIRMAR: source]                                      | [CONFIRMAR: source]                         |

Kaiord's column is verifiable in its [privacy policy](/legal/privacy-policy)
and its source code.

## Where the others are stronger

- **Analytics and history.** intervals.icu lists fitness, fatigue and form
  tracking, activity analysis and power-curve analytics on its free tier
  [^iv]; TrainingPeaks Premium lists workout analysis and fitness tracking
  [^tp]. Kaiord's analytics are far more limited.
- **Coaching.** TrainingPeaks sells personal coaching and training plans
  [^tp]; intervals.icu's supporter plan includes teams and coaching
  organizations [^iv].
- **Native device integration.** Garmin Connect sends workouts to your Garmin
  device directly [^gcsend]; Kaiord needs a browser extension to reach Garmin
  Connect.
- **Mobile.** Garmin Connect has a mobile app [^gcapp]; Kaiord is a web app.

## Where Kaiord is different

- **No account, local data.** Nothing is sent to a Kaiord server; the app
  stores your plan, workouts and health records in your browser.
- **Format conversion.** Every workout can be exported to FIT, TCX, ZWO,
  Garmin Connect JSON and KRD, and the same conversions are available as a
  [CLI](/cli/commands), a [TypeScript SDK](/guide/quick-start) and an
  [MCP server](/mcp/tools).
- **Your own AI key.** See
  [Plan your training with AI using your own API key](/guide/ai-planning-byok).
- **Open source.** MIT licensed; you can read and change every line.

## Using them together

Kaiord does not have to replace anything. You can build a workout in Kaiord
and [export it](/convert/) as a file another platform imports, or
[take a Zwift workout to Garmin](/guide/zwift-to-garmin). Kaiord does not sync
with intervals.icu today.

## Sources

Accessed 2026-09-28.

[^tp]: TrainingPeaks, [Pricing for athletes](https://www.trainingpeaks.com/pricing/for-athletes/).

[^tpwb]: TrainingPeaks, [Introducing the TrainingPeaks Workout Builder](https://www.trainingpeaks.com/learn/articles/introducing-trainingpeaks-workout-builder/).

[^iv]: intervals.icu, [Pricing](https://www.intervals.icu/pricing/).

[^ivgc]: intervals.icu forum announcement, [Upload planned workouts to Garmin Connect](https://forum.intervals.icu/t/upload-planned-workouts-to-garmin-connect/1521).

[^gc]: Garmin, [Elevate your health and fitness goals with Garmin Connect+](https://www.garmin.com/en-US/newsroom/press-release/wearables-health/elevate-your-health-and-fitness-goals-with-garmin-connect/) (launch price; "All existing features and data in Garmin Connect will remain free").

[^gcwb]: Garmin Support, [Creating a Custom Workout in Garmin Connect](https://support.garmin.com/en-US/?faq=wZ52AaLbLG2GC1Lxu2l4k7).

[^gcsend]: Garmin Support, [How to Send Workouts to a Garmin Device](https://support.garmin.com/en-US/?faq=Oyqt6jUjOF8L1Rnuc9Sms8).

[^gcapp]: Garmin, [Garmin Connect Mobile App](https://www.garmin.com/en-US/p/125677/).
