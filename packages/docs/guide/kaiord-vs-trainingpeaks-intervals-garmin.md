---
title: "Kaiord vs TrainingPeaks, intervals.icu and Garmin Connect"
description: "An honest, sourced comparison of Kaiord with TrainingPeaks, intervals.icu and the Garmin Connect workout builder: price, workout builder, Garmin sync, data and source code."
---

# Kaiord vs TrainingPeaks, intervals.icu and Garmin Connect

TrainingPeaks, intervals.icu and Garmin Connect are established platforms.
Kaiord is a young open-source project with a different shape: it runs in your
browser, keeps your data there (unless you turn on Google Drive sync) and
needs no account. This page
compares what each one offers, with a source for every claim about another
product. Prices and plans change; check the linked pages before deciding.

_Leer en español: [Kaiord frente a TrainingPeaks, intervals.icu y Garmin Connect](/es/guide/kaiord-vs-trainingpeaks-intervals-garmin)._

## At a glance (as of 2026-09-28)

|                                 | Kaiord                                                                      | TrainingPeaks                                                                                                                                                                  | intervals.icu                                                                                    | Garmin Connect                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Price                           | Free, MIT licensed                                                          | Premium US$19.95/month or US$134.99/year [^tp]; free Basic tier lets you log workouts and follow assigned plans, but not build or schedule your own future workouts [^tpbasic] | Free; optional US$4/month supporter plan [^iv]                                                   | Free; optional Connect+ US$6.99/month or US$69.99/year [^gc] [^gcdcr]                            |
| Structured workout builder      | Yes                                                                         | Yes [^tpwb]                                                                                                                                                                    | Yes, on the free tier [^iv]                                                                      | Yes [^gcwb]                                                                                      |
| Send planned workouts to Garmin | Yes, with the Garmin Bridge extension                                       | Listed as a Premium feature: "Sync planned workouts to your device" [^tp]                                                                                                      | Yes, "Upload planned workouts" [^ivgc], on the free tier [^iv]                                   | Yes, native [^gcsend]                                                                            |
| Workout file export             | FIT, TCX, ZWO, Garmin Connect, KRD                                          | FIT, ZWO, ERG or MRC, depending on workout type [^tpexport]                                                                                                                    | FIT, ZWO, ERG, MRC [^ivwb]                                                                       | No file download for planned workouts; sends them to your paired device [^gcsend]                |
| AI                              | Bring your own key (Anthropic, OpenAI, Google)                              | AI Workout Generator (text → structured workout), for coaches, web app only [^tpai]                                                                                            | No built-in AI feature; third-party apps use its open API                                        | "Active Intelligence" in Connect+ [^gc]                                                          |
| Account and data                | No account; data stays in your browser unless you turn on Google Drive sync | Account required; TrainingPeaks cloud [^tptou]                                                                                                                                 | Account required; EU servers (Germany and Finland) [^ivprivacy]                                  | Garmin account required; servers in the US, UK or Australia (mainland China: China) [^gcprivacy] |
| Source code                     | Open source ([GitHub](https://github.com/pablo-albaladejo/kaiord))          | Proprietary [^tptou]                                                                                                                                                           | Proprietary (some auxiliary tools are open source on [GitHub](https://github.com/intervals-icu)) | Proprietary [^gcdev]                                                                             |

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
  stores your plan, workouts and health records in your browser, and they
  stay there unless you turn on Google Drive sync.
- **Format conversion.** Every workout can be exported to FIT, TCX, ZWO,
  Garmin Connect JSON and KRD, and the same conversions are available as a
  [CLI](/cli/commands), a [TypeScript SDK](/guide/quick-start) and an
  [MCP server](/mcp/tools).
- **Your own AI key.** See
  [Plan your training with AI using your own API key](/guide/ai-planning-byok).
- **Open source.** MIT licensed; you can read and change every line.

## Using them together

Kaiord does not have to replace anything. You can build a workout in Kaiord
and [export it](/convert/) as a file another platform imports. You can save
an intervals.icu API key in **Connections**, but no data syncs with
intervals.icu yet.

## Sources

Accessed 2026-09-28.

[^tp]: TrainingPeaks, [Pricing for athletes](https://www.trainingpeaks.com/pricing/for-athletes/).

[^tpbasic]: TrainingPeaks, [TrainingPeaks Basic vs Premium: Exactly What You Get](https://www.trainingpeaks.com/blog/what-you-get-with-trainingpeaks-premium/).

[^tpexport]: TrainingPeaks Help Center, [Structured Workout Export FAQs](https://help.trainingpeaks.com/hc/en-us/articles/115001844087-Structured-Workout-Export-FAQs).

[^tpai]: TrainingPeaks Help Center, [Structured Workout Builder](https://help.trainingpeaks.com/hc/en-us/articles/235164967-Structured-Workout-Builder).

[^tptou]: TrainingPeaks, [Terms of Use](https://www.trainingpeaks.com/static-files/trainingpeaks-terms-of-use.pdf).

[^tpwb]: TrainingPeaks, [Introducing the TrainingPeaks Workout Builder](https://www.trainingpeaks.com/learn/articles/introducing-trainingpeaks-workout-builder/).

[^iv]: intervals.icu, [Pricing](https://www.intervals.icu/pricing/).

[^ivwb]: intervals.icu, [Workout Builder](https://www.intervals.icu/features/workout-builder/).

[^ivprivacy]: intervals.icu, [Privacy Policy](https://intervals.icu/privacy-policy.html).

[^ivgc]: intervals.icu forum announcement, [Upload planned workouts to Garmin Connect](https://forum.intervals.icu/t/upload-planned-workouts-to-garmin-connect/1521).

[^gc]: Garmin, [Elevate your health and fitness goals with Garmin Connect+](https://www.garmin.com/en-US/newsroom/press-release/wearables-health/elevate-your-health-and-fitness-goals-with-garmin-connect/) ("All existing features and data in Garmin Connect will remain free").

[^gcdcr]: DC Rainmaker, [Garmin Connect+ Subscription Walkthrough](https://www.dcrainmaker.com/2025/03/garmin-connect-plus-subscription-walkthrough.html).

[^gcwb]: Garmin Support, [Creating a Custom Workout in Garmin Connect](https://support.garmin.com/en-US/?faq=wZ52AaLbLG2GC1Lxu2l4k7).

[^gcsend]: Garmin Support, [How to Send Workouts to a Garmin Device](https://support.garmin.com/en-US/?faq=Oyqt6jUjOF8L1Rnuc9Sms8).

[^gcapp]: Garmin, [Garmin Connect Mobile App](https://www.garmin.com/en-US/p/125677/).

[^gcprivacy]: Garmin, [Garmin Connect Privacy Policy](https://www.garmin.com/en-US/privacy/connect/policy/).

[^gcdev]: Garmin, [Garmin Connect Developer Program Agreement](https://www8.garmin.com/en-US/GARMINCONNECTDEVELOPERPROGRAMAGREEMENT/GARMINCONNECTDEVELOPERPROGRAMAGREEMENT_EN.pdf).
