import { ROUTE_HEADING_ATTR } from "../../../routing/constants";

export type LibraryHeaderProps = {
  count: number;
};

export function LibraryHeader({ count }: LibraryHeaderProps) {
  return (
    <div className="mb-1">
      <h1
        tabIndex={-1}
        {...{ [ROUTE_HEADING_ATTR]: "" }}
        className="m-0 text-[26px] font-extrabold tracking-[-0.02em] text-slate-50"
      >
        Library
      </h1>
      <p className="mt-1 text-[13.5px] text-slate-400">
        {count} {count === 1 ? "workout" : "workouts"}
      </p>
    </div>
  );
}
