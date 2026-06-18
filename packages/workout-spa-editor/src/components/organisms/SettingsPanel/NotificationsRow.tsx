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
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Notifications aren&apos;t supported in this browser.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-900 dark:text-white">
          Enable notifications
        </span>
        <Toggle
          checked={checked}
          onCheckedChange={(next) => void handleChange(next)}
          aria-label="Enable notifications"
        />
      </div>
      {permission === "denied" && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Notifications are blocked in your browser settings.
        </p>
      )}
    </div>
  );
};
