import { Icon, ICON_MAP } from "../../atoms/Icon";

export type CreateSheetHeaderProps = {
  title: string;
  onClose: () => void;
};

/** Full-width sheet header with a title and a close button. */
export function CreateSheetHeader({ title, onClose }: CreateSheetHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h1 className="text-[19px] font-bold text-slate-50">{title}</h1>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
      >
        <Icon icon={ICON_MAP.x} size="md" color="inherit" />
      </button>
    </div>
  );
}
