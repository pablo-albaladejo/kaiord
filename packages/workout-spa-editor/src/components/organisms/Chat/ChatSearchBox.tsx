export type ChatSearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
};

/** Search input for the conversation sidebar, with a clear affordance. */
export function ChatSearchBox({ value, onChange }: ChatSearchBoxProps) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search chats…"
        aria-label="Search chats"
        data-testid="chat-search-input"
        className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          className="shrink-0 px-1 text-slate-500 hover:text-slate-200"
          onClick={() => onChange("")}
        >
          ✕
        </button>
      )}
    </div>
  );
}
