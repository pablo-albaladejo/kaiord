import { useTranslate } from "../../../i18n/use-translate";
import { SectionHead } from "../../molecules/SectionHead/SectionHead";
import { GeneralTab } from "../../organisms/SettingsPanel/GeneralTab";
import type { SettingsRowDef } from "./settings-group-types";
import {
  SETTINGS_CONNECTIONS_ROW,
  SETTINGS_PAGE_ROWS,
  SETTINGS_VERSION_LABEL,
} from "./settings-groups";
import { SettingsRow } from "./SettingsRow";
import { useSettingsRowValues } from "./use-settings-row-values";

type SettingsGroupListProps = {
  onNavigate: (to: string) => void;
};

const CARD_CLASS =
  "overflow-hidden rounded-2xl bg-surface shadow-sm [&>*+*]:border-t [&>*+*]:border-edge-soft";

export const SettingsGroupList = ({ onNavigate }: SettingsGroupListProps) => {
  const values = useSettingsRowValues();
  const t = useTranslate("settings");

  const card = (rows: ReadonlyArray<SettingsRowDef>) => (
    <div className={CARD_CLASS}>
      {rows.map((row) => (
        <SettingsRow
          key={row.key}
          icon={row.icon}
          label={t(`tabs.${row.key}`)}
          testId={row.key}
          detail={row.valueKey === undefined ? undefined : values[row.valueKey]}
          to={`/settings/${row.key}`}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6" data-testid="settings-group-list">
      <section>
        <SectionHead
          title={t("tabs.general")}
          data-testid="settings-general-heading"
        />
        <GeneralTab />
      </section>
      {card(SETTINGS_PAGE_ROWS)}
      {card([SETTINGS_CONNECTIONS_ROW])}
      <p className="px-4 text-center text-xs text-ink-muted">
        {SETTINGS_VERSION_LABEL}
      </p>
    </div>
  );
};
