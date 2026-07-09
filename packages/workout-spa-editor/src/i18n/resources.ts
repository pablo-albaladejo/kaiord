/**
 * Assembles the SPA i18n resource tree from per-locale, per-namespace JSON.
 * English is the source-of-truth catalog; `es` must maintain key parity
 * (enforced by `resource-parity.test.ts`). Add a namespace by importing its
 * `en`/`es` JSON and listing it in both maps plus `NAMESPACES`.
 */

import type { LocaleResources } from "@kaiord/i18n";

import enAthlete from "./locales/en/athlete.json";
import enCalendar from "./locales/en/calendar.json";
import enChat from "./locales/en/chat.json";
import enCoaching from "./locales/en/coaching.json";
import enCommon from "./locales/en/common.json";
import enCreateWorkout from "./locales/en/create-workout.json";
import enDaily from "./locales/en/daily.json";
import enDataHub from "./locales/en/data-hub.json";
import enEditor from "./locales/en/editor.json";
import enErrors from "./locales/en/errors.json";
import enLabImport from "./locales/en/labImport.json";
import enLabs from "./locales/en/labs.json";
import enLibrary from "./locales/en/library.json";
import enNav from "./locales/en/nav.json";
import enSettings from "./locales/en/settings.json";
import enTargets from "./locales/en/targets.json";
import enWorkoutDetail from "./locales/en/workout-detail.json";
import esAthlete from "./locales/es/athlete.json";
import esCalendar from "./locales/es/calendar.json";
import esChat from "./locales/es/chat.json";
import esCoaching from "./locales/es/coaching.json";
import esCommon from "./locales/es/common.json";
import esCreateWorkout from "./locales/es/create-workout.json";
import esDaily from "./locales/es/daily.json";
import esDataHub from "./locales/es/data-hub.json";
import esEditor from "./locales/es/editor.json";
import esErrors from "./locales/es/errors.json";
import esLabImport from "./locales/es/labImport.json";
import esLabs from "./locales/es/labs.json";
import esLibrary from "./locales/es/library.json";
import esNav from "./locales/es/nav.json";
import esSettings from "./locales/es/settings.json";
import esTargets from "./locales/es/targets.json";
import esWorkoutDetail from "./locales/es/workout-detail.json";

export const DEFAULT_NAMESPACE = "common";

export const resources: LocaleResources = {
  en: {
    athlete: enAthlete,
    calendar: enCalendar,
    chat: enChat,
    coaching: enCoaching,
    common: enCommon,
    "create-workout": enCreateWorkout,
    daily: enDaily,
    "data-hub": enDataHub,
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
    athlete: esAthlete,
    calendar: esCalendar,
    chat: esChat,
    coaching: esCoaching,
    common: esCommon,
    "create-workout": esCreateWorkout,
    daily: esDaily,
    "data-hub": esDataHub,
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

/** Namespace list for i18next, derived from the resource tree (single source). */
export const NAMESPACES = Object.keys(resources.en);
