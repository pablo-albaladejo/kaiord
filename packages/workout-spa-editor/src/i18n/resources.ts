/**
 * Assembles the SPA i18n resource tree from per-locale, per-namespace JSON.
 * English is the source-of-truth catalog; `es` must maintain key parity
 * (enforced by `resource-parity.test.ts`). Add a namespace by importing its
 * `en`/`es` JSON and listing it in both maps plus `NAMESPACES`.
 */

import type { LocaleResources } from "@kaiord/i18n";

import enCalendar from "./locales/en/calendar.json";
import enCommon from "./locales/en/common.json";
import enCreateWorkout from "./locales/en/create-workout.json";
import enDaily from "./locales/en/daily.json";
import enEditor from "./locales/en/editor.json";
import enErrors from "./locales/en/errors.json";
import enLabImport from "./locales/en/labImport.json";
import enLabs from "./locales/en/labs.json";
import enLibrary from "./locales/en/library.json";
import enNav from "./locales/en/nav.json";
import enSettings from "./locales/en/settings.json";
import enTargets from "./locales/en/targets.json";
import enWorkoutDetail from "./locales/en/workout-detail.json";
import esCalendar from "./locales/es/calendar.json";
import esCommon from "./locales/es/common.json";
import esCreateWorkout from "./locales/es/create-workout.json";
import esDaily from "./locales/es/daily.json";
import esEditor from "./locales/es/editor.json";
import esErrors from "./locales/es/errors.json";
import esLabImport from "./locales/es/labImport.json";
import esLabs from "./locales/es/labs.json";
import esLibrary from "./locales/es/library.json";
import esNav from "./locales/es/nav.json";
import esSettings from "./locales/es/settings.json";
import esTargets from "./locales/es/targets.json";
import esWorkoutDetail from "./locales/es/workout-detail.json";

export const NAMESPACES = [
  "calendar",
  "common",
  "create-workout",
  "daily",
  "editor",
  "errors",
  "labs",
  "labImport",
  "library",
  "nav",
  "settings",
  "targets",
  "workout-detail",
] as const;

export const DEFAULT_NAMESPACE = "common";

export const resources: LocaleResources = {
  en: {
    calendar: enCalendar,
    common: enCommon,
    "create-workout": enCreateWorkout,
    daily: enDaily,
    editor: enEditor,
    errors: enErrors,
    labs: enLabs,
    labImport: enLabImport,
    library: enLibrary,
    nav: enNav,
    settings: enSettings,
    targets: enTargets,
    "workout-detail": enWorkoutDetail,
  },
  es: {
    calendar: esCalendar,
    common: esCommon,
    "create-workout": esCreateWorkout,
    daily: esDaily,
    editor: esEditor,
    errors: esErrors,
    labs: esLabs,
    labImport: esLabImport,
    library: esLibrary,
    nav: esNav,
    settings: esSettings,
    targets: esTargets,
    "workout-detail": esWorkoutDetail,
  },
};
