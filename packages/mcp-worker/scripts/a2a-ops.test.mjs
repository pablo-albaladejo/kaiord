// Tests for the owner's Cloudflare scripts in ops/ (add-a2a-endpoint tasks
// 3.1 and 6.1). A fake `curl` first on PATH stands in for the Cloudflare
// API: it answers from a route table and records every call, so no test
// reaches the network.
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const OPS = join(dirname(fileURLToPath(import.meta.url)), "..", "ops");
const TOKEN = "test-token-value-0001";
const ZONE = "zone-test";
const API = `/client/v4/zones/${ZONE}`;

const FAKE_CURL = `#!/usr/bin/env node
const fs = require("node:fs");
const dir = process.env.FAKE_CF_DIR;
const args = process.argv.slice(2);
const call = { argv: args, method: "GET", url: "", data: null, headers: [] };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "-X") call.method = args[++i];
  else if (a === "--data") call.data = JSON.parse(args[++i]);
  else if (a === "-H") {
    const h = args[++i];
    call.headers.push(h.startsWith("@") ? fs.readFileSync(h.slice(1), "utf8").trim() : h);
  } else if (!a.startsWith("-")) call.url = a;
}
const callsPath = dir + "/calls.json";
const calls = fs.existsSync(callsPath) ? JSON.parse(fs.readFileSync(callsPath, "utf8")) : [];
fs.writeFileSync(callsPath, JSON.stringify([...calls, call]));
const routes = JSON.parse(fs.readFileSync(dir + "/routes.json", "utf8"));
const u = new URL(call.url);
const key = call.method + " " + u.pathname + u.search;
const queue = routes[key];
if (!queue || queue.length === 0) { process.stderr.write("no fake for " + key); process.exit(22); }
process.stdout.write(JSON.stringify(queue.length > 1 ? queue.shift() : queue[0]));
fs.writeFileSync(dir + "/routes.json", JSON.stringify(routes));
`;

const runOps = (script, args, routes, env = {}) => {
  const dir = mkdtempSync(join(tmpdir(), "a2a-ops-"));
  writeFileSync(join(dir, "curl"), FAKE_CURL);
  chmodSync(join(dir, "curl"), 0o755);
  writeFileSync(join(dir, "routes.json"), JSON.stringify(routes));
  const result = spawnSync("bash", [join(OPS, script), ...args], {
    encoding: "utf8",
    env: {
      PATH: `${dir}:${process.env.PATH}`,
      FAKE_CF_DIR: dir,
      CF_API_TOKEN: TOKEN,
      CF_ZONE_ID: ZONE,
      CF_ZONE_NAME: "example.test",
      OUT_DIR: join(dir, "out"),
      ...env,
    },
  });
  const callsPath = join(dir, "calls.json");
  const calls = existsSync(callsPath)
    ? JSON.parse(readFileSync(callsPath, "utf8"))
    : [];
  return { ...result, calls };
};

const mcpRule = (overrides = {}) => ({
  id: "rule-1",
  version: "1",
  last_updated: "2026-10-30T00:00:00Z",
  action: "block",
  enabled: true,
  description: "rate limit /mcp",
  expression:
    '(http.host eq "example.test" and http.request.uri.path eq "/mcp")',
  ratelimit: {
    characteristics: ["ip.src", "cf.colo.id"],
    period: 10,
    requests_per_period: 10,
    mitigation_timeout: 10,
  },
  ...overrides,
});
const ruleset = (rules) => ({ result: { id: "rs-1", rules } });
const WIDENED =
  '(http.host eq "example.test" and http.request.uri.path in {"/mcp" "/a2a"})';
const ENTRYPOINT = `GET ${API}/rulesets/phases/http_ratelimit/entrypoint`;
const PATCH = `PATCH ${API}/rulesets/rs-1/rules/rule-1`;
const wafRoutes = (before, after) => ({
  [ENTRYPOINT]: after
    ? [ruleset([before]), ruleset([after])]
    : [ruleset([before])],
  [PATCH]: [{ success: true }],
});
const writes = (calls) => calls.filter((c) => c.method !== "GET");

describe("waf-widen-a2a.sh", () => {
  it("should only read the rule and print the widened expression without --apply", () => {
    // Arrange
    const routes = wafRoutes(mcpRule());

    // Act
    const run = runOps("waf-widen-a2a.sh", [], routes);

    // Assert
    assert.equal(run.status, 0, run.stderr);
    assert.deepEqual(writes(run.calls), []);
    assert.match(
      run.stdout,
      /after: {2}\(http\.host eq "example\.test" and http\.request\.uri\.path in \{"\/mcp" "\/a2a"\}\)/
    );
    assert.match(run.stdout, /dry run: nothing changed/);
  });

  it("should patch only the expression with --apply and check the read-back", () => {
    // Arrange
    const before = mcpRule();
    const after = mcpRule({ expression: WIDENED, version: "2" });
    const routes = wafRoutes(before, after);

    // Act
    const run = runOps("waf-widen-a2a.sh", ["--apply"], routes);

    // Assert
    assert.equal(run.status, 0, run.stderr);
    const [patch] = writes(run.calls);
    assert.equal(writes(run.calls).length, 1);
    assert.deepEqual(patch.data, {
      action: before.action,
      enabled: before.enabled,
      description: before.description,
      expression: WIDENED,
      ratelimit: before.ratelimit,
    });
    assert.match(run.stdout, /^widened;/m);
  });

  it("should fail when the read-back shows a change beyond the expression", () => {
    // Arrange
    const after = mcpRule({ expression: WIDENED, enabled: false });
    const routes = wafRoutes(mcpRule(), after);

    // Act
    const run = runOps("waf-widen-a2a.sh", ["--apply"], routes);

    // Assert
    assert.equal(run.status, 1);
    assert.match(run.stderr, /changed beyond its expression/);
  });

  it("should refuse and change nothing when the budget is not the documented one", () => {
    // Arrange
    const rule = mcpRule({
      ratelimit: { ...mcpRule().ratelimit, requests_per_period: 20 },
    });
    const routes = wafRoutes(rule, rule);

    // Act
    const run = runOps("waf-widen-a2a.sh", ["--apply"], routes);

    // Assert
    assert.equal(run.status, 1);
    assert.match(run.stderr, /^refusing:/);
    assert.deepEqual(writes(run.calls), []);
  });

  it("should do nothing when the rule already covers /a2a", () => {
    // Arrange
    const routes = wafRoutes(mcpRule({ expression: WIDENED }));

    // Act
    const run = runOps("waf-widen-a2a.sh", ["--apply"], routes);

    // Assert
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /already widened/);
    assert.deepEqual(writes(run.calls), []);
  });

  it("should send the token in a header and never on curl's command line", () => {
    // Arrange
    const routes = wafRoutes(mcpRule());

    // Act
    const run = runOps("waf-widen-a2a.sh", ["--dry-run"], routes);

    // Assert
    assert.equal(run.status, 0, run.stderr);
    assert.ok(run.calls.length > 0);
    for (const call of run.calls) {
      assert.ok(!call.argv.join(" ").includes(TOKEN));
      assert.ok(call.headers.includes(`Authorization: Bearer ${TOKEN}`));
    }
  });

  it("should refuse an unknown argument before any call", () => {
    // Arrange
    const routes = wafRoutes(mcpRule());

    // Act
    const run = runOps("waf-widen-a2a.sh", ["--yes"], routes);

    // Assert
    assert.equal(run.status, 2);
    assert.deepEqual(run.calls, []);
  });
});

const DNS = `${API}/dns_records`;
const svcb = (name, target = "example.test.") => ({
  id: "rec-1",
  type: "SVCB",
  name,
  ttl: 300,
  data: { priority: 1, target, value: 'alpn="h2" port="443"' },
});
const dnsRoutes = (mcp, a2a = []) => ({
  [`GET ${DNS}?type=SVCB&name=_mcp._agents.example.test`]: [{ result: mcp }],
  [`GET ${DNS}?type=SVCB&name=_a2a._agents.example.test`]: [{ result: a2a }],
  [`POST ${DNS}`]: [{ result: svcb("_a2a._agents.example.test") }],
});

describe("dns-a2a-svcb.sh", () => {
  it("should print the record and create nothing without --apply", () => {
    // Arrange
    const routes = dnsRoutes([svcb("_mcp._agents.example.test")]);

    // Act
    const run = runOps("dns-a2a-svcb.sh", [], routes);

    // Assert
    assert.equal(run.status, 0, run.stderr);
    assert.deepEqual(writes(run.calls), []);
    assert.match(run.stdout, /"name":"_a2a\._agents\.example\.test"/);
  });

  it("should create a copy of the _mcp record under the _a2a name with --apply", () => {
    // Arrange
    const mcp = svcb("_mcp._agents.example.test");
    const routes = dnsRoutes([mcp]);

    // Act
    const run = runOps("dns-a2a-svcb.sh", ["--apply"], routes);

    // Assert
    assert.equal(run.status, 0, run.stderr);
    assert.deepEqual(
      writes(run.calls).map((c) => c.data),
      [
        {
          type: "SVCB",
          name: "_a2a._agents.example.test",
          data: mcp.data,
          ttl: mcp.ttl,
          comment: "A2A endpoint discovery (add-a2a-endpoint 6.1)",
        },
      ]
    );
  });

  it("should leave an existing _a2a record alone", () => {
    // Arrange
    const routes = dnsRoutes(
      [svcb("_mcp._agents.example.test")],
      [svcb("_a2a._agents.example.test")]
    );

    // Act
    const run = runOps("dns-a2a-svcb.sh", ["--apply"], routes);

    // Assert
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /already present/);
    assert.deepEqual(writes(run.calls), []);
  });

  it("should refuse when the _mcp record does not point at the apex", () => {
    // Arrange
    const routes = dnsRoutes([
      svcb("_mcp._agents.example.test", "other.test."),
    ]);

    // Act
    const run = runOps("dns-a2a-svcb.sh", ["--apply"], routes);

    // Assert
    assert.equal(run.status, 1);
    assert.match(run.stderr, /^refusing:/);
    assert.deepEqual(writes(run.calls), []);
  });

  it("should refuse to start without the zone apex", () => {
    // Arrange
    const routes = dnsRoutes([svcb("_mcp._agents.example.test")]);

    // Act
    const run = runOps("dns-a2a-svcb.sh", [], routes, { CF_ZONE_NAME: "" });

    // Assert
    assert.notEqual(run.status, 0);
    assert.deepEqual(run.calls, []);
  });
});
