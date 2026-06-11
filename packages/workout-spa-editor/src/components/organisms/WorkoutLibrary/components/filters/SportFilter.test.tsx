/**
 * SportFilter tests.
 *
 * Controlled <select> exposing five sport options (all / cycling / running /
 * swimming / generic). Runs the shared label/options/value/onChange contract
 * with its specific table.
 */

import { describeControlledSelect } from "../../../../../test-utils/controlled-select-contract";
import { SportFilter } from "./SportFilter";

describeControlledSelect("SportFilter", {
  label: "Sport",
  optionCount: 5,
  renderSelect: (value, onChange) => (
    <SportFilter value={value} onChange={onChange} />
  ),
  defaultValue: "all",
  reflectedValue: "cycling",
  pickableValues: ["cycling", "running", "swimming", "generic", "all"],
});
