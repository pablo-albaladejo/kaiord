/**
 * DataHubCellMenu — mode edit + remove popover for an existing matrix route
 * (F4.2). Only rendered when a cell has a route (see DataHubCell); the
 * matrix's plain toggle handles create/enable/disable.
 */
import { useState } from "react";

import type { IntegrationPolicyMode } from "../../../types/integration-policy";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { DataHubCellModeButtons } from "./DataHubCellModeButtons";

type Props = {
  testId: string;
  mode: IntegrationPolicyMode;
  onSetMode: (mode: IntegrationPolicyMode) => void;
  onRemove: () => void;
};

export const DataHubCellMenu: React.FC<Props> = ({
  testId,
  mode,
  onSetMode,
  onRemove,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Route options"
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid={`${testId}-menu-button`}
        onClick={() => setOpen((v) => !v)}
        className="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        <Icon icon={ICON_MAP.dots} size="xs" color="inherit" />
      </button>
      {open && (
        <div
          role="menu"
          data-testid={`${testId}-menu`}
          className="absolute right-0 z-10 mt-1 w-36 rounded border border-gray-200 bg-white p-2 text-xs shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <p className="mb-1 font-medium text-gray-500 dark:text-gray-400">
            Mode
          </p>
          <DataHubCellModeButtons
            testId={testId}
            mode={mode}
            onSelect={(m) => {
              onSetMode(m);
              setOpen(false);
            }}
          />
          <button
            type="button"
            data-testid={`${testId}-remove`}
            onClick={() => {
              onRemove();
              setOpen(false);
            }}
            className="w-full rounded px-1.5 py-1 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Remove route
          </button>
        </div>
      )}
    </div>
  );
};
