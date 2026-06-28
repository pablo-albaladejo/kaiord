/**
 * Example Usage of Console Spy Utility
 *
 * This file demonstrates how to use the console spy utilities
 * to detect React warnings in component tests.
 */

import { render } from "@testing-library/react";
import { describe, it } from "vitest";
import { expectNoReactWarnings } from "./console-spy";

// Example component that might have prop issues
const ExampleComponent = ({
  validProp,
  ...props
}: {
  validProp: string;
  invalidProp?: () => void;
}) => {
  return <div {...props}>{validProp}</div>;
};

describe("Console Spy Usage Examples", () => {
  it("Example 1: Using expectNoReactWarnings helper", () => {
    // Arrange
    const warningChecker = expectNoReactWarnings();

    // Act - Render component
    render(<ExampleComponent validProp="test" />);

    // Assert - Verify no React warnings
    warningChecker.verify();
  });

  // Note: This test would fail if ExampleComponent passes invalidProp to DOM
  // it("Example 3: Component with invalid props (would fail)", () => {
  //   const warningChecker = expectNoReactWarnings();
  //
  //   render(
  //     <ExampleComponent
  //       validProp="test"
  //       invalidProp={() => console.log("test")}
  //     />
  //   );
  //
  //   // This would throw because invalidProp is not a valid HTML attribute
  //   warningChecker.verify();
  // });
});
