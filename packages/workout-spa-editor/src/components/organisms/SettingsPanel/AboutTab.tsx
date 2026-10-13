import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { SETTINGS_VERSION_LABEL } from "../../pages/SettingsPage/settings-groups";
import { useSettingsRowActions } from "../../pages/SettingsPage/use-settings-row-actions";

const DOCS_URL = "https://kaiord.com/docs/";

export const AboutTab: React.FC = () => {
  const t = useTranslate("settings");
  const { replayCoachMarks } = useSettingsRowActions();

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <a
          href={DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-ink-strong underline underline-offset-2 hover:text-ink-body"
          data-testid="settings-about-help"
        >
          <Icon icon={ICON_MAP.help} size="sm" color="inherit" />
          {t("about.helpDocs")}
        </a>
      </section>
      <section className="space-y-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={replayCoachMarks}
          data-testid="settings-about-replay-tips"
        >
          {t("about.replayTips")}
        </Button>
        <p className="text-xs text-ink-muted">{t("about.replayTipsHint")}</p>
      </section>
      <p className="text-xs text-ink-muted">{SETTINGS_VERSION_LABEL}</p>
    </div>
  );
};
