import { Icon, ICON_MAP } from "../../atoms/Icon";

export type LibrarySearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function LibrarySearchField({
  value,
  onChange,
}: LibrarySearchFieldProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-primary-900 px-3 py-2">
      <Icon icon={ICON_MAP.target} size="sm" color="muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search workouts..."
        aria-label="Search workouts"
        className="w-full bg-transparent text-[14px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
      />
    </div>
  );
}
