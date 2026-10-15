import { useTranslate } from "../../../i18n/use-translate";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import type { KeyStatus } from "./key-status";

const TONE: Record<KeyStatus, string> = {
  verified: "border-edge text-ink-body",
  unverified: "border-edge text-ink-muted",
  missing: "border-danger-border bg-danger-bg text-danger-text",
};

/** The key's state in words, never by colour alone. */
export function KeyStatusBadge({ status }: { status: KeyStatus }) {
  const t = useTranslate("settings");
  return (
    <span
      data-testid="key-status"
      data-status={status}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${TONE[status]}`}
    >
      {status === "verified" && (
        <Icon icon={ICON_MAP.check} size="xs" color="inherit" />
      )}
      {t(`keyStatus.${status}`)}
    </span>
  );
}
