import { useTranslate } from "../../../i18n/use-translate";

export function BatchMessage({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  const t = useTranslate("coaching");
  return (
    <div className="flex items-center gap-3 rounded-xl border border-edge-soft bg-surface p-3.5 text-[13px] text-ink-body">
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="text-xs text-ink-muted underline underline-offset-2 hover:text-ink-strong"
      >
        {t("batch.dismiss")}
      </button>
    </div>
  );
}
