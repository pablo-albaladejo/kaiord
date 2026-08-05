import { useTranslate } from "../../../i18n/use-translate";
import { Toggle } from "../../atoms/Toggle";
import { useNotificationPermission } from "./use-notification-permission";

export type NotificationsRowProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
};

export const NotificationsRow = ({
  enabled,
  onChange,
}: NotificationsRowProps) => {
  const t = useTranslate("settings");
  const { permission, request } = useNotificationPermission();
  const checked = enabled && permission === "granted";

  const handleChange = async (next: boolean) => {
    if (!next) {
      onChange(false);
      return;
    }
    const result = await request();
    onChange(result === "granted");
  };

  if (permission === "unsupported") {
    return (
      <p className="text-sm text-ink-muted">{t("notifications.unsupported")}</p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-strong">
          {t("notifications.enable")}
        </span>
        <Toggle
          checked={checked}
          onCheckedChange={(next) => void handleChange(next)}
          aria-label={t("notifications.enable")}
        />
      </div>
      {permission === "denied" && (
        <p className="text-sm text-ink-body">{t("notifications.blocked")}</p>
      )}
    </div>
  );
};
