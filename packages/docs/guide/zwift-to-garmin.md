---
title: "Zwift workouts on your Garmin: ZWO to FIT or Garmin Connect"
description: "Take a Zwift .zwo workout to your Garmin watch or head unit: convert it to FIT in the browser, or send it to Garmin Connect with the Kaiord Garmin Bridge."
---

# Zwift workouts on your Garmin

You built (or downloaded) a structured workout for Zwift and want to ride or
run it outdoors on a Garmin device. Zwift saves workouts as `.zwo` files;
Garmin devices read FIT workouts, and Garmin Connect keeps its own workout
format. Kaiord converts between them in your browser, with no account and no
file upload.

_Leer en español: [Entrenamientos de Zwift en tu Garmin](/es/guide/zwift-to-garmin)._

## Option 1: convert the file (no extension needed)

1. Open the [ZWO → FIT converter](https://kaiord.com/app/#/convert?from=zwo&to=fit).
2. Choose your `.zwo` file. It is parsed in the browser and never uploaded.
3. **FIT** is already selected as the export format. Click **Download a file**.

The page only converts: it does not add anything to your Kaiord calendar or
library, and it leaves any workout you have open in the editor untouched.
What you do with the `.fit` file afterwards (copy it to the device, import
it into another platform) is up to you and your device.

## Option 2: send it to Garmin Connect

The [Kaiord Garmin Bridge](https://chromewebstore.google.com/detail/kaiord-garmin-bridge/innelncjhkdokailkinkchppgekennoe)
Chrome extension pushes structured workouts from the Kaiord app to your
Garmin Connect account and can place them on a day of the Garmin Connect
calendar, from where your device syncs them.

1. Install the extension and sign in to [Garmin Connect](https://connect.garmin.com/)
   in the same browser. The extension uses that signed-in session; you never
   type your Garmin password into Kaiord.
2. In the [Kaiord app](https://kaiord.com/app/), import the `.zwo` file
   (it opens in the editor, where you can adjust steps and targets).
3. Click **Send to Garmin**. Once pushed, the workout shows **On your Garmin**.

## What survives the conversion

ZWO targets are power as a percentage of FTP, and FIT keeps them as a
percentage, so your device applies its own FTP. Steady-state steps, warm-up
and cool-down ramps (as a power range), intervals and free-ride sections
come across; Zwift's on-screen text events have no FIT equivalent and are
dropped. The full field-by-field table is on the
[ZWO to FIT](/convert/zwo-to-fit) and [ZWO to Garmin](/convert/zwo-to-garmin)
pages.

## From the command line

Developers can script the same conversion with the [Kaiord CLI](/cli/commands):

```bash
pnpm add -g @kaiord/cli
kaiord convert -i workout.zwo -o workout.fit
```

## Related

- [Workouts vs. activities](/convert/#workouts-vs-activities): this guide is about
  planned workouts, not recorded rides
- [ZWO format](/formats/zwo) · [FIT format](/formats/fit)
- [Plan your training with AI using your own API key](/guide/ai-planning-byok)
