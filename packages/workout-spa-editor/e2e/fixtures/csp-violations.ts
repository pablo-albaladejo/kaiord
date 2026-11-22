import type { Page } from "@playwright/test";

export type CspViolation = { directive: string; blocked: string };

/**
 * Fails the test on any content security policy violation. The dev server and
 * the assembled site both serve the policy, so a spec that loads something
 * the policy refuses reads red even if its own assertions pass. A spec that
 * provokes a violation on purpose sets `cspViolationsAllowed`.
 */
export async function watchCspViolations(page: Page): Promise<CspViolation[]> {
  const violations: CspViolation[] = [];
  await page.exposeFunction(
    "__kaiordCspViolation",
    (violation: CspViolation) => {
      violations.push(violation);
    }
  );
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      const report = (
        window as unknown as {
          __kaiordCspViolation?: (v: CspViolation) => void;
        }
      ).__kaiordCspViolation;
      report?.({
        directive: event.violatedDirective,
        blocked: event.blockedURI,
      });
    });
  });
  return violations;
}
