/**
 * Layout shell that wraps the EditorPage step editor and (optionally)
 * the `CoachingSidebar` for coaching-derived workouts.
 *
 * When the workout has no coaching match, this is a transparent
 * passthrough — no extra DOM. When it does, the editor + sidebar
 * stack vertically on narrow viewports and side-by-side on `lg:`.
 */
import type { ReactNode } from "react";

import { CoachingSidebar } from "../organisms/CoachingSidebar/CoachingSidebar";
import type { useCoachingSidebar } from "../organisms/CoachingSidebar/use-coaching-sidebar";

export type EditorBodyProps = {
  sidebar: ReturnType<typeof useCoachingSidebar>;
  children: ReactNode;
};

export function EditorBody({ sidebar, children }: EditorBodyProps) {
  if (!sidebar) return <>{children}</>;
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="flex-1">{children}</div>
      <div className="lg:w-80 lg:flex-shrink-0">
        <CoachingSidebar activity={sidebar.activity} />
      </div>
    </div>
  );
}
