import { Link } from "wouter";

import type { ToolResultLink } from "./build-tool-result-links";

export type ToolResultLinksProps = { links: ToolResultLink[] };

/** Deep-links unlocked by a tool-event's result (e.g. the workout a
 * `create_workout` call just created). Renders nothing when there are none. */
export function ToolResultLinks({ links }: ToolResultLinksProps) {
  if (links.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-lg bg-slate-800 px-2 py-1 text-[12px] font-medium text-sky-300 hover:text-sky-200"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
