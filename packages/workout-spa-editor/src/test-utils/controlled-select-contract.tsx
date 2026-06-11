/**
 * Shared test contract for the controlled <select> filters (SortBySelect,
 * SortOrderSelect, SportFilter, DifficultyFilter). Each filter renders a
 * labelled <select>, reflects its controlled value, and forwards the picked
 * option through onChange. This helper runs that label/options/value/onChange
 * triad so each filter file is reduced to a thin invocation with its table.
 *
 * Lives under test-utils/ (excluded from the production build typecheck and
 * from coverage) so it can use jest-dom matchers like every other test file.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

type ControlledSelectContract<Value extends string> = {
  /** Accessible label of the <select> (its getByLabelText target). */
  label: string;
  /** Total number of <option> elements the select should expose. */
  optionCount: number;
  /** Render the filter as a controlled select for the given value/onChange. */
  renderSelect: (value: Value, onChange: (next: Value) => void) => ReactElement;
  /** Value used when only the rendered shape (not a change) matters. */
  defaultValue: Value;
  /** A non-default value the select must reflect when controlled. */
  reflectedValue: Value;
  /** Option values that must each forward through onChange when picked. */
  pickableValues: readonly Value[];
};

export function describeControlledSelect<Value extends string>(
  componentName: string,
  contract: ControlledSelectContract<Value>
): void {
  describe(componentName, () => {
    it(`should render the ${contract.label} label and its options`, () => {
      // Arrange

      render(contract.renderSelect(contract.defaultValue, vi.fn()));

      // Act

      const select = screen.getByLabelText(contract.label) as HTMLSelectElement;

      // Assert

      expect(select).toBeInTheDocument();
      expect(select.options).toHaveLength(contract.optionCount);
    });

    it("should reflect the controlled value", () => {
      // Arrange

      render(contract.renderSelect(contract.reflectedValue, vi.fn()));

      // Act

      const select = screen.getByLabelText(contract.label);

      // Assert

      expect(select).toHaveValue(contract.reflectedValue);
    });

    it.each(contract.pickableValues)(
      "should forward %s through onChange when the user picks it",
      async (picked) => {
        // Arrange

        const user = userEvent.setup();
        const onChange = vi.fn();
        // selectOptions only fires change when the value actually moves, so
        // start from a value distinct from the one being picked.
        const startValue =
          picked === contract.defaultValue
            ? contract.reflectedValue
            : contract.defaultValue;
        render(contract.renderSelect(startValue, onChange));

        // Act

        await user.selectOptions(screen.getByLabelText(contract.label), picked);

        // Assert

        expect(onChange).toHaveBeenCalledWith(picked);
      }
    );
  });
}
