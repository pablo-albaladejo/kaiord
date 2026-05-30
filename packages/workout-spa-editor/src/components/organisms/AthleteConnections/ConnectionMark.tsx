type ConnectionMarkProps = {
  mark: string;
};

export function ConnectionMark({ mark }: ConnectionMarkProps) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/60 bg-white/5 text-[15px] font-bold text-slate-100">
      {mark}
    </span>
  );
}
