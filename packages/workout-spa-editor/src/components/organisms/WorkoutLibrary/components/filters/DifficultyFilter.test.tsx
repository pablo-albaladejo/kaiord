/**
 * DifficultyFilter tests.
 *
 * Controlled <select> exposing four difficulty options (all / easy / medium /
 * hard). Runs the shared label/options/value/onChange contract with its
 * specific table.
 */

import { describeControlledSelect } from "../../../../../test-utils/controlled-select-contract";
import { DifficultyFilter } from "./DifficultyFilter";

describeControlledSelect("DifficultyFilter", {
  label: "Difficulty",
  optionCount: 4,
  renderSelect: (value, onChange) => (
    <DifficultyFilter value={value} onChange={onChange} />
  ),
  defaultValue: "all",
  reflectedValue: "medium",
  pickableValues: ["easy", "medium", "hard", "all"],
});
