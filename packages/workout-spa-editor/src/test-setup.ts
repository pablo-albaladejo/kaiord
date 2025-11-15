import * as matchers from "@testing-library/jest-dom/matchers";
<<<<<<< HEAD
import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});
=======
import { expect } from "vitest";

expect.extend(matchers);
>>>>>>> bc5ff7c (feat(workout-spa-editor): Implement core component library and deployment pipeline)
