import { CONNECTIONS_PATH } from "../../../routing/constants";
import { AboutTab } from "../../organisms/SettingsPanel/AboutTab";
import { AiTab } from "../../organisms/SettingsPanel/AiTab";
import { DataTab } from "../../organisms/SettingsPanel/DataTab";
import { GeneralTab } from "../../organisms/SettingsPanel/GeneralTab";
import { PrivacyTab } from "../../organisms/SettingsPanel/PrivacyTab";
import { SyncTab } from "../../organisms/SettingsPanel/SyncTab";
import type { SettingsTab } from "../../organisms/SettingsPanel/types";
import { SETTINGS_PAGE_ROWS } from "./settings-groups";

/* Derived from the index rows, so the rail cannot drift from the index. */
const TAB_ORDER: ReadonlyArray<SettingsTab> = [
  "general",
  ...SETTINGS_PAGE_ROWS.map((row) => row.key),
];

const TAB_VIEWS: Record<SettingsTab, React.FC> = {
  general: GeneralTab,
  ai: AiTab,
  sync: SyncTab,
  data: DataTab,
  privacy: PrivacyTab,
  about: AboutTab,
};

/**
 * Old section paths, still in browser histories and bookmarks, and where
 * each one lives now. Connections left Settings for its own page.
 *
 * A `Map`, not an object literal: the key comes straight off the URL, and an
 * object would answer for every `Object.prototype` member — `/settings/toString`
 * would resolve to a "section" and redirect to a path built from a function.
 */
const RETIRED_SECTIONS: ReadonlyMap<string, string> = new Map([
  ["profile", "/athlete"],
  ["connections", CONNECTIONS_PATH],
  ["data-hub", CONNECTIONS_PATH],
  ["extensions", CONNECTIONS_PATH],
  ["preferences", "/settings/general"],
  ["usage", "/settings/ai?section=usage"],
]);

/** Old in-page anchors (`section?section=anchor`) that became pages. */
const RETIRED_ANCHORS: ReadonlyMap<string, string> = new Map([
  ["privacy?section=data-management", "/settings/data"],
]);

export const SETTINGS_TAB_VIEWS = TAB_VIEWS;

/** Rail order. One entry per section, so a section is marked current once. */
export const SETTINGS_TAB_ORDER = TAB_ORDER;

export const isSettingsTab = (
  value: string | undefined
): value is SettingsTab =>
  value !== undefined && (TAB_ORDER as ReadonlyArray<string>).includes(value);

/** Where an old path now lives, `undefined` when it is not an old path. */
export const retiredSectionTarget = (
  section: string | undefined,
  search: string
): string | undefined => {
  if (section === undefined) return undefined;
  const anchor = new URLSearchParams(search).get("section");
  return (
    RETIRED_SECTIONS.get(section) ??
    (anchor === null
      ? undefined
      : RETIRED_ANCHORS.get(`${section}?section=${anchor}`))
  );
};
