/**
 * StatRow Component
 *
 * Displays a single statistic row with label and value.
 */

import React from "react";

export type StatRowProps = {
  label: string;
  value: React.ReactNode;
};

export const StatRow: React.FC<StatRowProps> = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
};
