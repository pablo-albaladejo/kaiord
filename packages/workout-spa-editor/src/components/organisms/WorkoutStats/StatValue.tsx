/**
 * StatValue Component
 *
 * Displays a statistic value with optional estimate indicator.
 */

import React from "react";

export type StatValueProps = {
  value: string | number | null;
  hasEstimate?: boolean;
  emptyText?: string;
};

export const StatValue: React.FC<StatValueProps> = ({
  value,
  hasEstimate = false,
  emptyText = "—",
}) => {
  if (value === null || value === undefined) {
    return <span className="text-gray-500">{emptyText}</span>;
  }

  return (
    <>
      {value}
      {hasEstimate && (
        <span
          className="ml-1 text-xs text-gray-500"
          title="Estimate due to open-ended steps"
        >
          *
        </span>
      )}
    </>
  );
};
