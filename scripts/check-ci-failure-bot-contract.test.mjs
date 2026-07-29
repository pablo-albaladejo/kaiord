// Tests for scripts/check-ci-failure-bot-contract.mjs (R-CiFailureBotContract).

import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { deepStrictEqual, ok, strictEqual } from "node:assert";

import {
  CI_WORKFLOW,
  extractContract,
  displayNameOverrides,
  findViolations,
} from "./check-ci-failure-bot-contract.mjs";

// Minimal ci.yml shaped like the real one: a notify-failure job with an `if:`
// trigger list and an assemble step, plus a job carrying a `name:` override.
const workflow = ({
  triggers = ["lint", "jscpd"],
  recorded = ["lint", "jscpd"],
  checkLinksName = "Link checker",
  legacySerialise = false,
} = {}) => `
name: CI
jobs:
  check-links:
    name: ${checkLinksName}
    runs-on: ubuntu-latest
  lint:
    runs-on: ubuntu-latest
  jscpd:
    runs-on: ubuntu-latest
  notify-failure:
    name: Notify on Failure
    runs-on: ubuntu-latest
    if: |
      always() &&
${triggers.map((t) => `      needs.${t}.result == 'failure' ||`).join("\n")}
      false
    steps:
      - name: Assemble failed-jobs JSON
        run: |
          jobs=()
${recorded.map((r) => `          [ "\${{ needs.${r}.result }}" = "failure" ] && jobs+=("${r}")`).join("\n")}
          json=$(${
            legacySerialise
              ? `printf '%s\\n' "\${jobs[@]}" | jq -R . | jq -sc .`
              : `jq -nc '$ARGS.positional' --args "\${jobs[@]}"`
          })
          echo "json=$json" >> "$GITHUB_OUTPUT"
      - name: Create issue
        run: node scripts/ci-failure-issue.mjs create '\${{ steps.jobs.outputs.json }}'
`;

const ALIASES = { "check-links": "Link checker" };

describe("extractContract", () => {
  it("reads the trigger and recorded job lists out of notify-failure", () => {
    const result = extractContract(workflow());

    strictEqual(result.found, true);
    deepStrictEqual(result.triggers, ["lint", "jscpd"]);
    deepStrictEqual(result.recorded, ["lint", "jscpd"]);
    strictEqual(result.emptyArrayBug, false);
  });

  it('flags the printf-based serialisation that yields [""]', () => {
    strictEqual(
      extractContract(workflow({ legacySerialise: true })).emptyArrayBug,
      true
    );
  });

  it("ignores the idiom when it only appears in a comment", () => {
    // ci.yml documents the printf pitfall in prose right above the fixed line.
    const src = workflow().replace(
      "          jobs=()",
      "          # was: printf '%s\\n' \"${jobs[@]}\" | jq -R . | jq -sc .\n          jobs=()"
    );

    strictEqual(extractContract(src).emptyArrayBug, false);
  });
});

describe("displayNameOverrides", () => {
  it("returns only jobs whose name differs from their id", () => {
    deepStrictEqual(displayNameOverrides(workflow()), {
      "check-links": "Link checker",
      "notify-failure": "Notify on Failure",
    });
  });
});

describe("findViolations", () => {
  it("passes when triggers, recordings and aliases all agree", () => {
    deepStrictEqual(findViolations(workflow(), ALIASES), []);
  });

  it("catches a trigger that is never recorded", () => {
    // This is the jscpd defect: a red build for it produced an unclosable issue.
    const src = workflow({ triggers: ["lint", "jscpd"], recorded: ["lint"] });

    const violations = findViolations(src, ALIASES);

    strictEqual(violations.length, 1);
    ok(violations[0].includes('"jscpd" triggers notify-failure'));
  });

  it("catches a recorded job that is not a trigger", () => {
    const src = workflow({ triggers: ["lint"], recorded: ["lint", "jscpd"] });

    const violations = findViolations(src, ALIASES);

    ok(violations.some((v) => v.includes('"jscpd" is recorded')));
  });

  it("catches a display-name override with no alias entry", () => {
    const src = workflow({
      triggers: ["lint", "check-links"],
      recorded: ["lint", "check-links"],
      checkLinksName: "Links, renamed",
    });

    const violations = findViolations(src, ALIASES);

    ok(violations.some((v) => v.includes("Links, renamed")));
  });

  it("catches an alias entry with no corresponding override", () => {
    const violations = findViolations(workflow(), {
      ...ALIASES,
      typecheck: "Types",
    });

    ok(violations.some((v) => v.includes('aliases "typecheck"')));
  });

  it("reports rather than throws when notify-failure is absent", () => {
    deepStrictEqual(findViolations("name: CI\njobs: {}\n", ALIASES), [
      "could not locate the notify-failure job in ci.yml",
    ]);
  });
});

describe("the real .github/workflows/ci.yml", () => {
  it("satisfies the create/close contract", () => {
    deepStrictEqual(findViolations(readFileSync(CI_WORKFLOW, "utf8")), []);
  });
});
