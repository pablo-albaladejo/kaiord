# Handoff: Kaiord App Redesign (mobile-first)

## Overview

A ground-up UX/UI redesign of the `@kaiord/workout-spa-editor` app, focused on three goals:

1. **Kill the friction in creating workouts** — an AI-first "New session" flow.
2. **Kill the friction in syncing** — one-tap _Push to Garmin_ with clear state.
3. **Make "Profile" make sense** — the old `Settings → Profile → {Training Zones, Personal Data, Linked Accounts, Data Flows}` nesting is replaced by a single top-level **Athlete** page, and _Linked Accounts + Data Flows_ are merged into one **Connections** concept.

This bundle covers four primary surfaces — **Today**, **Library**, **Athlete** (the centerpiece), **Settings** — plus two overlays: **Create** (AI workout generation) and **Workout Detail** (with Push to Garmin).

## About the Design Files

The files in this bundle are **design references created in HTML/React+Babel** — runnable prototypes that show the intended look and behavior. **They are not production code to copy directly.**

The codebase is already **React 19 + TypeScript 5 + Tailwind CSS 4 + Radix UI + Zustand**, organized in atomic design (`atoms / molecules / organisms / templates / pages`). The task is to **recreate these designs inside that existing environment**, reusing the established components, tokens, and store — not to drop the prototype's inline-styled JSX in. Specifically:

- Inline `style={{…}}` in the prototype → Tailwind utility classes + the existing `@theme` tokens in `src/index.css` / `styles/brand-tokens.css`.
- The prototype's hand-rolled atoms (`Btn`, `Card`, `Toggle`, `Segmented`, `Pill`, `Icon`) → the existing `components/atoms/{Button, Card, Badge, Icon, …}`. Extend those, don't fork them.
- The prototype's mock data (`data.jsx`) → the real `@kaiord/core` types/schemas and the Zustand store.

## Fidelity

**High-fidelity.** Colors, typography, spacing, radii, and interactions are final and intentional. Recreate the UI pixel-faithfully using the codebase's libraries. The values below are exact.

The prototype stays on-brand: it reuses the existing dark slate + sky-600 palette and Inter. The only _new_ visual system introduced is the **5-zone training color ramp** (see Design Tokens) and the **Connections** card pattern.

---

## Design Tokens

All of these already exist in `styles/brand-tokens.css` / `src/index.css` unless marked **NEW**. Map to the existing CSS variables / Tailwind theme rather than re-defining.

### Color — surfaces & text (existing brand tokens)

| Role            | Prototype value       | Existing token                                                                                                                    |
| --------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Page bg         | `#0b1220` (deepened)  | `--brand-bg-primary` is `#0f172a`; prototype uses a slightly deeper `#0b1220`. Use a `bg-slate-950`-ish surface or add one token. |
| Card surface    | `#172033`             | between `--brand-bg-primary`/`-surface`; closest existing = `slate-800` `#1e293b`                                                 |
| Elevated        | `#243244` / `#334155` | `--brand-bg-elevated` `#334155`                                                                                                   |
| Hairline border | `#26324a`             | `--brand-border` `#334155` (soften slightly)                                                                                      |
| Text primary    | `#f8fafc`             | `--brand-text-primary`                                                                                                            |
| Text secondary  | `#cbd5e1`             | `--brand-text-secondary`                                                                                                          |
| Text muted      | `#8a99b3`             | `--brand-text-muted` `#94a3b8`                                                                                                    |
| Text faint      | `#5b6b86`             | (slate-500/600 range)                                                                                                             |

### Color — accent (existing)

| Role                              | Value     | Token                                         |
| --------------------------------- | --------- | --------------------------------------------- |
| Accent (fills, primary btn)       | `#0284c7` | `--brand-accent-blue` / `--color-primary-500` |
| Accent bright (on-dark text/icon) | `#38bdf8` | `--color-primary-400`→ use `sky-400`          |
| Accent soft (badge/pill bg)       | `#0c4a6e` | `--brand-accent-blue-soft`                    |

### Color — semantic (existing)

- Success/sync done: `#34d399` (`--brand-semantic-tip`)
- Warning: `#fbbf24` (`--brand-semantic-warning`)
- Danger/disconnect: `#f87171` (`--brand-semantic-danger`)
- Decorative (avatar ring gradient): `#a855f7` (`--brand-accent-purple`)

### Color — training zones (**NEW** — add as tokens, e.g. `--zone-1..5`)

A 5-zone functional ramp, used for zone bars, step rails, and the zone map:

```
Z1 Recovery   #64748b   (slate)
Z2 Endurance  #0ea5e9   (sky)
Z3 Tempo      #22c55e   (green)
Z4 Threshold  #f59e0b   (amber)
Z5 VO₂ / Max  #ef4444   (red)
```

Segments in bars use a subtle top-down gradient (`linear-gradient(180deg, <color>, <color>cc)`) with `inset 0 1px 0 rgba(255,255,255,.18)`.

### Typography

- Family: **Inter** (`--brand-font-sans`), weights 400/500/600/700/800.
- Numeric displays use `font-variant-numeric: tabular-nums`.
- Scale used:
  | Use | size / weight / tracking |
  |---|---|
  | Screen title (h1) | 28px / 780 / -0.02em |
  | Sheet title | 18–21px / 750 |
  | Card title | 15–17px / 650–700 |
  | Metric number | 26px / 750 / -0.02em |
  | Body | 14.5–15px / 500–600 |
  | Meta / caption | 12–13px / 500–600 |
  | Section eyebrow | 13px / 700 / 0.08em / UPPERCASE / faint |
  | Tab label (bottom nav) | 10.5px / 600 |

### Spacing, radius, shadow

- Screen horizontal padding: **16px**. Scroll top padding **54px** (clears status bar/notch), bottom padding **110px** (clears floating nav).
- Radii: cards **20px**, inner cards/rows **18px**, buttons **14px**, pills **999px**, FAB **20px**, icon tiles **10–13px**, bottom-nav bar **24px**.
- Card border: `1px solid` hairline (`#26324a`).
- Floating nav: `rgba(15,23,42,.82)` + `backdrop-filter: blur(20px) saturate(180%)`, shadow `0 8px 30px rgba(0,0,0,.4)`.
- FAB: gradient `linear-gradient(160deg, #38bdf8, #0284c7)`, shadow `0 8px 22px <accent>66, inset 0 1px 0 rgba(255,255,255,.3)`.

---

## Screens / Views

### 1. Today (`pages/CalendarPage` equivalent — default route)

- **Purpose**: morning landing; readiness → plan → push.
- **Layout**: vertical scroll. Header (eyebrow date + "Today" h1, bell icon button top-right). Then, in order: Readiness card → Week strip → "Planned session" section.
- **Readiness card**: row of [SVG ring score 0–100, emerald arc] + [headline "Good to push today" + one-line rationale + 3 mini stats: HRV (with +trend in emerald), Sleep, Battery]. Data is framed as coming from Garmin daily metrics.
- **Week strip**: 7 equal columns (M–S), each = weekday letter + date + a vertical load bar (height ∝ planned/completed load). Today's column is highlighted (accent-soft bg, accent border, accent text).
- **Planned session card**: sport icon tile + title + one-line desc; a row of 3 meta items (duration / TSS / load) with icons; a **time-in-zone bar** (`ZoneDist`); then a footer action row split into **Details** (ghost) and **Push to Garmin** (primary, ~1.6× width).

### 2. Library (`pages/LibraryPage`)

- **Purpose**: browse saved workouts.
- **Layout**: header ("Library" h1 + count); a search field (display-only in proto); a horizontal scroll row of sport filter chips (All / Cycling / Running / Swim); a vertical list of **WorkoutCard**s.
- **WorkoutCard**: sport icon tile + title + meta (duration · TSS) + optional tag pill, with a `ZoneDist` bar underneath. Tapping opens Workout Detail.

### 3. Athlete (CENTERPIECE — replaces `Settings → Profile`)

New top-level destination. Single scroll page, padding 16px:

1. **Identity row**: gradient-ring avatar (conic `#0284c7→#a855f7→#38bdf8`) with initials, name (21/750), tagline ("Cyclist · Runner"), edit icon button.
2. **Sport selector**: segmented control (Cycling / Running / Swim, each with icon). Selecting a sport swaps the thresholds + zones below. This is how per-sport zones are handled — no separate sub-tab.
3. **Thresholds card**: header ("Thresholds" + target icon) with an **Auto/Manual zones** toggle on the right. Body = up to 3 metrics separated by thin dividers, each a big tabular number + unit + label (first metric rendered in accent-bright). Footer = full-width "Edit thresholds" ghost button.
   - Cycling: FTP 265 W · Threshold HR 168 bpm · Max HR 189 bpm
   - Running: Threshold pace 4:05 /km · Threshold HR 172 · Max HR 192
   - Swim: CSS pace 1:38 /100m · Threshold HR 160 (auto defaults off)
4. **Zone map card**: eyebrow "<Sport> zones" + "How it's used" action. Body = the **ZoneMap**: a 56px-tall stacked bar of 5 proportional segments labeled Z1–Z5, followed by a legend (one row per zone: color dot + name + qualitative label + numeric range, tabular). Below, an info strip (accent-tinted) explaining "These zones power AI workout generation and every target you push to Garmin."
5. **Connections** (merges _Linked Accounts_ + _Data Flows_): section heading + a list of connection rows.
   - Each row: square brand mark tile + name + status. **Connected** rows show a green dot + "Synced N min ago" and a chevron that expands. **Available** rows show "Not connected" + a "Connect" pill.
   - **Expanded (connected) state**: a "What syncs" list. Each flow = a direction icon tile (↓ import = emerald tint, ↑ export = sky tint) + human label + sublabel + a **toggle**. Example flows for Garmin: "Completed activities ↓", "Planned workouts ↑", "Daily readiness (HRV, sleep) ↓". Footer: a red "Disconnect" text button.
   - This replaces the abstract per-data-type import/export "policies" UI with per-connection, human-readable toggles.

### 4. Settings (`pages/SettingsPage` — flattened)

- With Profile promoted out to **Athlete**, Settings is now a short grouped list: **AI generation** (Provider, Custom instructions), **Preferences** (Units, Notifications), **Privacy & data** (Data & privacy, Export everything). iOS-style grouped rows: icon tile + label + optional detail + chevron. Footer version string.

### Overlay A — Create ("New session")

Triggered by the center **FAB**. Full-screen sheet (slides up).

- **Phase `input`**: sport segmented control; the **AI hero card** = sparkle header "Describe it in plain words" + a 3-row textarea (placeholder "e.g. 4×4 VO₂ max intervals with a long warm-up…") + example prompt chips that fill the field on tap + full-width **Generate workout** button (disabled/0.5 opacity until text present) + a reassurance line "Built around your <sport> zones". Below: an "or start from" divider and 3 tiles (Template / Blank / Import file).
- **Phase `generating`**: spinner + "Designing your session…" + 4 shimmering skeleton rows (simulated ~1.7s).
- **Phase `result` ("Review session")**: title row (sport tile + AI-generated title + "AI" pill + "Tap any step to fine-tune"); a 3-up **SummaryStrip** (Duration / TSS / Load); a card with "Time in zone" bar + the **StepList** (each step = left zone-color rail + kind + detail + duration + Zx). Footer: **Redo** (ghost) + **Save & push** (primary). Saving closes the sheet and fires a success toast "Saved & pushed to Garmin".

### Overlay B — Workout Detail

Opened from a WorkoutCard or Today's planned card.

- Back/▾ header (back chevron, "Workout", ⋯). Title block (sport tile + title + "Sport · tag"). **SummaryStrip**. A "Structure · time in zone" card = `ZoneDist` + `StepList`. **Sticky footer**: **Edit** (ghost) + **Push to Garmin** (primary).

---

## Interactions & Behavior

- **Bottom nav**: 4 tabs (Today, Library, Athlete, Settings) in a floating glass bar, with a raised center **FAB** (+). Active tab uses accent-bright icon+label and slightly heavier stroke.
- **Push to Garmin** (`PushButton`): 3 states — `idle` ("Push to Garmin", watch icon) → `pushing` (spinner + "Pushing…", ~1.3s) → `done` (emerald, check, "On your Garmin", non-interactive).
- **Create generate**: guarded on non-empty prompt; `input → generating (1.7s timeout) → result`. "Redo" returns to `input`.
- **Sport selector** (Athlete & Create): switching sport recomputes the metrics + zone map shown.
- **Connection rows**: accordion — only one expanded at a time in the prototype (`expanded` holds a single id; tap toggles). Flow toggles are independent booleans.
- **Toasts**: bottom, auto-dismiss after ~2.2s.
- **Transitions**: screen change + sheets use a short (0.3s) `translateY` slide. ⚠️ Implementation note: the prototype intentionally animates **transform only, not opacity** (entrance keyframes must not start at `opacity:0`) — in a real app this caveat is moot, but keep entrance animations from leaving content invisible if they don't run.

## State Management (map to Zustand store / `@kaiord/core`)

- `activeTab`, `creating` (bool), `detailWorkout` (workout | null), `toast`.
- Athlete: `activeSport` ('cycling'|'running'|'swimming'), `autoZones` (per sport), per-sport `thresholds`, derived `zones`, `connections[]` with per-flow `enabled` booleans, `expandedConnectionId`.
- Create: `phase`, `promptText`, `sport`, `generatedWorkout`. The real generate call replaces the `setTimeout` with the existing AI provider (Anthropic/OpenAI/Gemini via Vercel AI SDK) and must inject the active sport's zones into the prompt (as the current app already does).
- Push: per-workout sync status; real impl calls the Garmin Lambda proxy.

## Assets

- **No image assets.** All icons are inline SVG (24px viewBox, 1.9 stroke) — replace with the codebase's existing `Icon` atom / icon set. Icon names used: today, cards/library, plus, athlete, gear, bike, run, swim, zap, sparkle, heart, watch, arrowUp/Down, chevL/R/D, check, x, clock, route, flame, sync, link, dots, edit, target, shield, calendar, bell, trend, upload.
- Brand marks in Connections (G/S/W/i) are placeholder letter tiles — swap for real Garmin/Strava/Wahoo/intervals.icu logos.
- Avatar is initials on a gradient ring — wire to the real profile avatar if present.

## Files (in this bundle)

- `Kaiord Redesign.html` — entry; loads React 18 + Babel and the scripts below. Open this to run the prototype.
- `kt.jsx` — tokens (`KT`), zone palette, `Icon` set, atoms (`Card`, `Toggle`, `Segmented`, `Pill`, `Btn`, `SectionHead`).
- `data.jsx` — mock domain data (sports/thresholds/zones, connections, readiness, today session, library, week, AI examples + result).
- `viz.jsx` — `ZoneMap`, `ZoneDist`, `Metric`, `WorkoutCard`.
- `screen-athlete.jsx` — the Athlete page (centerpiece): `AvatarRing`, `ThresholdCard`, `ConnectionRow`, `AthleteScreen`.
- `screen-create.jsx` — `CreateScreen`, plus shared `StepList`, `SummaryStrip`.
- `screen-misc.jsx` — `TodayScreen`, `LibraryScreen`, `WorkoutDetail`, `SettingsScreen`, `PushButton`, `ReadinessRing`.
- `app.jsx` — shell: bottom nav + FAB, routing, overlays, toast, Tweaks (accent / pure-black bg / iPhone frame).
- `ios-frame.jsx`, `tweaks-panel.jsx` — prototype scaffolding only; **not** part of the app to ship.

> Tip: read `screen-athlete.jsx` first — it is the heart of the redesign and the screen the brief cared most about.
