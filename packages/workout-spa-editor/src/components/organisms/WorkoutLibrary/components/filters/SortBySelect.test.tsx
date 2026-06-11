/**
 * SortBySelect tests.
 *
 * Controlled <select> for sort criteria (name / date / difficulty). Runs the
 * shared label/options/value/onChange contract with its specific table.
 */

import { describeControlledSelect } from "../../../../../test-utils/controlled-select-contract";
import { SortBySelect } from "./SortBySelect";

describeControlledSelect("SortBySelect", {
  label: "Sort By",
  optionCount: 3,
  renderSelect: (value, onChange) => (
    <SortBySelect value={value} onChange={onChange} />
  ),
  defaultValue: "name",
  reflectedValue: "date",
  pickableValues: ["date", "difficulty"],
});
