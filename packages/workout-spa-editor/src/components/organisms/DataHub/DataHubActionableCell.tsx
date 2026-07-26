import type { ReactNode } from "react";

import type { IntegrationPolicyMode } from "../../../types/integration-policy";
import { DataHubCellMenu } from "./DataHubCellMenu";

type Props = {
  className: string;
  label: string;
  testId: string;
  state: string;
  onClick: () => void;
  routeId: string | undefined;
  mode: IntegrationPolicyMode;
  onSetMode: (mode: IntegrationPolicyMode) => void;
  onRemove: (routeId: string) => void;
  children: ReactNode;
};

export const DataHubActionableCell = ({
  className,
  label,
  testId,
  state,
  onClick,
  routeId,
  mode,
  onSetMode,
  onRemove,
  children,
}: Props) => (
  <div className="flex items-center gap-0.5">
    <button
      type="button"
      aria-label={label}
      title={label}
      data-testid={testId}
      data-state={state}
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
    {routeId && (
      <DataHubCellMenu
        testId={testId}
        mode={mode}
        onSetMode={onSetMode}
        onRemove={() => onRemove(routeId)}
      />
    )}
  </div>
);
