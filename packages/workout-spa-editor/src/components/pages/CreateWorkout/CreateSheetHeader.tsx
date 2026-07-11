import { useTranslate } from "../../../i18n/use-translate";
import { Icon, ICON_MAP } from "../../atoms/Icon";

export type CreateSheetHeaderProps = {
  title: string;
  onClose: () => void;
};

/** Full-width sheet header with a title and a close button. */
export function CreateSheetHeader({ title, onClose }: CreateSheetHeaderProps) {
  const t = useTranslate("common");
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-[19px] font-bold text-ink-strong">{title}</h2>
      <button
        type="button"
        aria-label={t("actions.close")}
        onClick={onClose}
        className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-ink-strong/5 hover:text-ink-body"
      >
        <Icon icon={ICON_MAP.x} size="md" color="inherit" />
      </button>
    </div>
  );
}
