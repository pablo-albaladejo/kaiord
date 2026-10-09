---
title: "Plan your training with AI using your own API key"
description: "Use Kaiord's in-browser assistant with your own Anthropic, OpenAI or Google API key: generate structured workouts, schedule them and ask about your training data."
---

# Plan your training with AI using your own API key

Kaiord's assistant works with **your own API key** ("bring your own key").
There is no Kaiord subscription and no Kaiord server in between: the app runs
in your browser and calls the model provider you choose directly.

_Leer en español: [Planifica tu entrenamiento con IA y tu propia clave de API](/es/guide/ai-planning-byok)._

## 1. Add a provider

Open **Settings → AI → Provider & models** in the
[Kaiord app](https://kaiord.com/app/#/settings/ai?section=providers) and add a
provider with its API key. Three providers are supported: **Anthropic**
(Claude), **OpenAI** (GPT) and **Google** (Gemini). You can pick a default
model and, optionally, a different one per task (chat, workout generation,
lab-report extraction); a free-text field covers model ids newer than the
built-in list.

## 2. Generate or schedule workouts

- **Create a workout from a description.** Describe the session in plain
  words ("60 min endurance ride with 3 × 10 min at sweet spot") and click
  **Generate workout**. The result is a structured workout you can fine-tune
  step by step in the editor, send to Garmin, or export as FIT, TCX, ZWO or
  Garmin Connect.
- **Ask the assistant.** The chat can read your workouts, coaching plan and
  health records, and can create a workout on a date. Actions that change your
  data (creating a workout, logging a health metric, pushing to Garmin) wait
  for you to **Approve** them.
- **Adjust an existing session.** On a workout, **Adjust with AI** opens the
  chat pre-filled with that workout so you can ask for changes.

Conversations are stored per profile in your browser and are searchable.

## Privacy and cost

- Your key and your conversations are stored in your browser (IndexedDB),
  and your data stays there unless you turn on Google Drive sync.
  Kaiord's [privacy policy](/legal/privacy-policy) describes what is sent: your
  prompts, and summaries of the data the assistant reads, go from your browser
  to the provider you configured, only while you are chatting.
- The stored key is obfuscated, not strongly protected: anyone with access to
  your browser profile can recover it. If you turn on Google Drive sync without
  sync encryption, the app warns you that keys would be uploaded in plain text.
  **Settings → Privacy** has a button to clear every stored key.
- You pay your provider directly. **Settings → AI → Usage** shows tokens per
  month and an **estimated** cost; your provider's bill is the source of truth.

## Using Kaiord from another AI assistant

The [Kaiord MCP server](/mcp/tools) lets assistants that speak the Model
Context Protocol (Claude Desktop, Claude Code and others) convert, validate and
inspect workout files. It works on files only; it does not reach the
calendar or health data stored in the web app.

## Related

- [WHOOP recovery in your training plan](/guide/whoop-recovery-in-plan)
- [Kaiord vs TrainingPeaks, intervals.icu and Garmin Connect](/guide/kaiord-vs-trainingpeaks-intervals-garmin)
