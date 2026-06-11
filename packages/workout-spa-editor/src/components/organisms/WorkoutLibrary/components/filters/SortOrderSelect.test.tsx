/**
 * SortOrderSelect tests.
 *
 * Two-option controlled <select> (asc / desc). Runs the shared
 * label/options/value/onChange contract with its specific table.
 */

import { describeControlledSelect } from "../../../../../test-utils/controlled-select-contract";
import { SortOrderSelect } from "./SortOrderSelect";

describeControlledSelect("SortOrderSelect", {
  label: "Order",
  optionCount: 2,
  renderSelect: (value, onChange) => (
    <SortOrderSelect value={value} onChange={onChange} />
  ),
  defaultValue: "asc",
  reflectedValue: "desc",
  pickableValues: ["desc", "asc"],
});
