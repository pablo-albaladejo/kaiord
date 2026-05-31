export const meta = {
  name: "openspec-lifecycle",
  description:
    "Drive an OpenSpec change through its full lifecycle: assess status, execute the next phase, verify against spec, and report.",
  whenToUse:
    "Track and advance a specific OpenSpec change. args: { change, mode: assess|implement|verify|archive, phase? }",
  phases: [
    {
      title: "Assess",
      detail: "Parse openspec status + tasks.md + spec coverage",
    },
    {
      title: "Execute",
      detail: "Implement the next actionable phase (mode=implement)",
    },
    {
      title: "Verify",
      detail: "Map spec scenarios to passing tests (mode=verify/implement)",
    },
    {
      title: "Report",
      detail: "Write LIFECYCLE.md dashboard to the change dir",
    },
  ],
};

const REPO = "/Users/pablo/development/kaiord";
const change = (args && args.change) || "google-drive-cross-device-sync";
// Default mode is "auto": assess, then auto-advance the next actionable phase.
// Explicit modes: assess (read-only), implement, verify.
const explicitMode = (args && args.mode) || null;
const mode = explicitMode || "auto";
const targetPhase = (args && args.phase) || null;
const shouldImplement = mode === "auto" || mode === "implement";
const shouldVerify =
  mode === "auto" || mode === "implement" || mode === "verify";
const changeDir = `openspec/changes/${change}`;

// Retry helper for transient server rate-limiting ("temporarily limiting requests").
async function withRetry(fn, attempts = 3) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const out = await fn();
      const text = typeof out === "string" ? out : JSON.stringify(out || "");
      if (/temporarily limiting requests|Rate limited|overloaded/i.test(text)) {
        lastErr = new Error("transient rate limit");
        continue;
      }
      return out;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("withRetry exhausted");
}

const ASSESS_SCHEMA = {
  type: "object",
  required: ["change", "artifactsComplete", "phases", "nextAction", "blockers"],
  properties: {
    change: { type: "string" },
    artifactsComplete: { type: "boolean" },
    phases: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "title", "totalTasks", "doneTasks", "status"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          totalTasks: { type: "number" },
          doneTasks: { type: "number" },
          status: {
            type: "string",
            enum: ["complete", "in-progress", "pending", "blocked"],
          },
          blockedReason: { type: "string" },
        },
      },
    },
    specCoverage: {
      type: "array",
      items: {
        type: "object",
        required: [
          "capability",
          "requirements",
          "scenariosTotal",
          "scenariosWithTests",
        ],
        properties: {
          capability: { type: "string" },
          requirements: { type: "number" },
          scenariosTotal: { type: "number" },
          scenariosWithTests: { type: "number" },
        },
      },
    },
    nextAction: { type: "string" },
    blockers: { type: "array", items: { type: "string" } },
  },
};

const GATE_SCHEMA = {
  type: "object",
  required: ["testsPass", "buildPass", "lintPass", "summary"],
  properties: {
    testsPass: { type: "boolean" },
    buildPass: { type: "boolean" },
    lintPass: { type: "boolean" },
    summary: { type: "string" },
    failures: { type: "array", items: { type: "string" } },
  },
};

const VERIFY_SCHEMA = {
  type: "object",
  required: ["capability", "scenarios"],
  properties: {
    capability: { type: "string" },
    scenarios: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "covered"],
        properties: {
          name: { type: "string" },
          covered: { type: "boolean" },
          testRef: { type: "string" },
          note: { type: "string" },
        },
      },
    },
  },
};

const assessPrompt = `You are auditing the lifecycle state of an OpenSpec change in the repo at ${REPO}.
Change: "${change}" located at ${changeDir}/.

Steps (prefer reading files; use Bash for openspec/grep if available):
1. Run \`openspec status --change "${change}"\` and ignore any leading line starting with "Rules for". Confirm all four artifacts (proposal, design, specs, tasks) are done.
2. Read ${changeDir}/tasks.md. Parse every "## N. Title" group and its checkboxes ("- [ ]" pending, "- [x]" done). For each group compute totalTasks and doneTasks.
3. Read ${changeDir}/proposal.md and ${changeDir}/design.md. UPDATE on external blockers: the Google Cloud OAuth Client ID HAS NOW BEEN PROVISIONED (it is recorded in tasks.md task 2.2). Therefore Phase 2 (CloudSyncPort + Google Drive adapter) is NO LONGER externally blocked — treat it as actionable/pending. The drive.appdata scope was confirmed NON-sensitive, so no Google verification gate remains for development. Phases 3, 4, and 5 are NOT externally blocked either, but each depends on the code from the prior phase (3 needs 2's CloudSyncPort, 4 needs 2-3, 5 needs 2-4) — mark a phase "blocked" ONLY if its prior code-phase is not yet complete, with blockedReason naming the prior phase. Phase 1 is complete.
4. For each ${changeDir}/specs/*/spec.md, count "### Requirement:" and "#### Scenario:" headers. Then grep packages/workout-spa-editor for implementation/tests matching the feature (names like export-snapshot, import-snapshot, cloud-sync, tombstone, google-drive, syncWithCloud). Estimate scenariosWithTests = how many scenarios already have a real corresponding test assertion (be conservative; 0 is expected if nothing is implemented yet).
5. Determine nextAction: the lowest-numbered task group that has pending tasks AND is not blocked by missing external setup. Mark phases blocked on OAuth as status "blocked" with blockedReason. A group with doneTasks===totalTasks is "complete"; 0<done<total is "in-progress"; 0 done is "pending" (or "blocked").

Map the task groups (## 1..6) to the phases array. Return JSON matching the schema. Return ONLY the structured object.`;

const implementPrompt = (
  ph
) => `Implement Phase ${ph} of the OpenSpec change "${change}" in the repo ${REPO}.
Read ${changeDir}/tasks.md and implement every pending "- [ ]" task under the "## ${ph}." group, plus read ${changeDir}/design.md and ${changeDir}/specs/*/spec.md for the contract.

Hard rules (from CLAUDE.md):
- TDD: write the failing test first (AAA: // Arrange // Act // Assert; every it() title starts with "should "), then implement until green.
- Hexagonal: nothing under application/ may import dexie-database (guard R-AppDexieImport); Zustand store may not import dexie-database/persistState.
- Max 100 lines/file, 40 lines/function (60 for React components). type not interface. Separate type imports.
- Target package: packages/workout-spa-editor.

After implementing, run \`pnpm --filter @kaiord/workout-spa-editor test\` and \`pnpm lint:fix\`, fix anything you broke, then tick the completed checkboxes in ${changeDir}/tasks.md ("- [ ]" -> "- [x]").
Report concisely: files created/changed, test outcome, and any task you could NOT complete and why.`;

const gatePrompt = `In the repo ${REPO}, run the quality gates for package @kaiord/workout-spa-editor and report results as structured data.
Run: \`pnpm --filter @kaiord/workout-spa-editor test\`, \`pnpm --filter @kaiord/workout-spa-editor build\`, and \`pnpm lint\`. Also run \`pnpm test:scripts\` (mechanical guards). Set each *Pass boolean from the real exit status. List concrete failures (file + message). Do not fix anything; just report.`;

const verifyPrompt = (
  cap
) => `Adversarially verify spec coverage for capability "${cap}" of OpenSpec change "${change}" in ${REPO}.
Read ${changeDir}/specs/${cap}/spec.md. For EACH "#### Scenario:" decide whether a real, passing test in packages/workout-spa-editor actually asserts that behavior. Be skeptical: mark covered=true ONLY if you can point to a specific test file + assertion (put it in testRef). If no implementation exists yet, mark covered=false with a short note. Return JSON per schema; list every scenario.`;

phase("Assess");
const status = await agent(assessPrompt, {
  schema: ASSESS_SCHEMA,
  label: `assess:${change}`,
  phase: "Assess",
});

function firstActionablePhase(s) {
  const candidates = (s.phases || [])
    .filter((p) => p.status === "pending" || p.status === "in-progress")
    .sort((a, b) => Number(a.id) - Number(b.id));
  return candidates.length ? candidates[0].id : null;
}

log(
  `openspec-lifecycle: change=${change} mode=${mode} (explicit=${explicitMode}) phase=${targetPhase}`
);

let executionResult = null;
if (shouldImplement) {
  phase("Execute");
  const ph = targetPhase || firstActionablePhase(status);
  if (!ph) {
    log(
      "No actionable phase — everything is complete or blocked on external setup."
    );
  } else {
    log(`Implementing phase ${ph} of ${change}`);
    const impl = await withRetry(() =>
      agent(implementPrompt(ph), {
        label: `implement:phase-${ph}`,
        phase: "Execute",
        model: "opus",
      })
    );
    const gate = await withRetry(() =>
      agent(gatePrompt, {
        schema: GATE_SCHEMA,
        label: "quality-gate",
        phase: "Execute",
      })
    );
    executionResult = { phase: ph, impl, gate };
  }
}

let verifyResults = null;
if (shouldVerify) {
  phase("Verify");
  const caps = (status.specCoverage || []).map((c) => c.capability);
  const capList = caps.length
    ? caps
    : ["spa-cloud-sync", "spa-persistence-port"];
  verifyResults = (
    await parallel(
      capList.map(
        (cap) => () =>
          agent(verifyPrompt(cap), {
            schema: VERIFY_SCHEMA,
            label: `verify:${cap}`,
            phase: "Verify",
          })
      )
    )
  ).filter(Boolean);
}

phase("Report");
const reportPrompt = `Write a lifecycle dashboard for OpenSpec change "${change}" to the file ${changeDir}/LIFECYCLE.md in ${REPO}.
Use this data (treat as facts, render as markdown — do not invent beyond it):

MODE: ${mode}
STATUS: ${JSON.stringify(status)}
EXECUTION: ${JSON.stringify(executionResult)}
VERIFY: ${JSON.stringify(verifyResults)}

The file MUST contain, in English:
- A title and a one-line generated note (do NOT fabricate a date; write "Generated by openspec-lifecycle workflow").
- A "Phase progress" table: Phase | Tasks done/total | Status.
- A "Spec coverage" table: Capability | Requirements | Scenarios covered/total.
- A "Blockers" bullet list.
- A "Next action" line.
- If EXECUTION is non-null, an "This run" section summarizing what was implemented and the quality-gate result.
- If VERIFY is non-null, an "Uncovered scenarios" list (covered=false ones).
Use the Write tool to create the file. Then return a 3-5 line plain-text summary of the change's current state and the single recommended next command (e.g. "/opsx:apply" or re-run this workflow in implement mode).`;

const report = await agent(reportPrompt, { label: "report", phase: "Report" });

return { mode, change, status, executionResult, verifyResults, report };
