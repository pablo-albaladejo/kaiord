import { Icon, ICON_MAP } from "../../atoms/Icon";

export type LibraryEmptyProps = {
  isFiltered: boolean;
};

export function LibraryEmpty({ isFiltered }: LibraryEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-400">
        <Icon icon={ICON_MAP.library} size="lg" color="inherit" />
      </div>
      <h3 className="m-0 text-[16px] font-bold text-slate-100">
        {isFiltered ? "No workouts found" : "Your library is empty"}
      </h3>
      <p className="mt-1 text-[13.5px] text-slate-400">
        {isFiltered
          ? "No workouts match your current filters."
          : "Save a workout to your library to get started."}
      </p>
    </div>
  );
}
