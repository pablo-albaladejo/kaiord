// node:test suite for check-build-portable.mjs.
//
// Each case stages a fixture packages/ tree under a temp directory and
// invokes runCheck({ packagesRoot }) to assert the expected violation.

import { test } from "node:test";
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCheck } from "./check-build-portable.mjs";

function makeTempPackages() {
  const root = mkdtempSync(join(tmpdir(), "build-portable-"));
  return {
    root,
    addPackage(name) {
      const pkgDir = join(root, name);
      mkdirSync(pkgDir, { recursive: true });
      mkdirSync(join(pkgDir, "src"), { recursive: true });
      mkdirSync(join(pkgDir, "dist"), { recursive: true });
      return {
        writeConfig(filename, contents) {
          writeFileSync(join(pkgDir, filename), contents);
        },
        writeSource(filename, contents) {
          writeFileSync(join(pkgDir, "src", filename), contents);
        },
        writeDist(filename, contents = "") {
          writeFileSync(join(pkgDir, "dist", filename), contents);
        },
      };
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}

test("(a) clean repo passes", () => {
  const fixtures = makeTempPackages();
  try {
    const pkg = fixtures.addPackage("clean");
    pkg.writeConfig(
      "tsup.config.ts",
      `import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
});
`
    );
    const violations = runCheck({ packagesRoot: fixtures.root });
    assert.equal(violations.length, 0);
  } finally {
    fixtures.cleanup();
  }
});

test("(b) define with JSON.stringify(process.env.X) fails", () => {
  const fixtures = makeTempPackages();
  try {
    const pkg = fixtures.addPackage("inject");
    pkg.writeConfig(
      "tsup.config.ts",
      `import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  define: { __X__: JSON.stringify(process.env.API_URL) },
});
`
    );
    const violations = runCheck({ packagesRoot: fixtures.root });
    assert.equal(violations.length, 1);
    assert.match(violations[0].detail, /process\.env/);
  } finally {
    fixtures.cleanup();
  }
});

test("(c) NODE_ENV as comparison operand passes (whitelist)", () => {
  const fixtures = makeTempPackages();
  try {
    const pkg = fixtures.addPackage("node-env-ok");
    pkg.writeConfig(
      "tsup.config.ts",
      `import { defineConfig } from 'tsup';
const isProd = process.env.NODE_ENV === 'production';
export default defineConfig({
  entry: ['src/index.ts'],
  define: { __DEV__: isProd ? 'false' : 'true' },
});
`
    );
    const violations = runCheck({ packagesRoot: fixtures.root });
    assert.equal(violations.length, 0);
  } finally {
    fixtures.cleanup();
  }
});

test("(d) process.env.NODE_VERSION in src fails", () => {
  const fixtures = makeTempPackages();
  try {
    const pkg = fixtures.addPackage("node-version");
    pkg.writeSource(
      "build-helper.ts",
      `if (process.env.NODE_VERSION === '22') {
  // ...
}
`
    );
    const violations = runCheck({ packagesRoot: fixtures.root });
    assert.equal(violations.length, 1);
    assert.match(violations[0].detail, /NODE_VERSION/);
  } finally {
    fixtures.cleanup();
  }
});

test("(e) native binding in dist fails", () => {
  const fixtures = makeTempPackages();
  try {
    const pkg = fixtures.addPackage("native");
    pkg.writeDist("addon.node", "");
    const violations = runCheck({ packagesRoot: fixtures.root });
    assert.equal(violations.length, 1);
    assert.match(violations[0].detail, /Native binding/);
  } finally {
    fixtures.cleanup();
  }
});

test("(f) computed property reading process.env fails", () => {
  const fixtures = makeTempPackages();
  try {
    const pkg = fixtures.addPackage("computed");
    pkg.writeConfig(
      "tsup.config.ts",
      `import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  define: { ['__X__']: process.env.API_URL },
});
`
    );
    const violations = runCheck({ packagesRoot: fixtures.root });
    assert.equal(violations.length, 1);
  } finally {
    fixtures.cleanup();
  }
});

test("(g) spread of object containing process.env fails", () => {
  const fixtures = makeTempPackages();
  try {
    const pkg = fixtures.addPackage("spread");
    pkg.writeConfig(
      "tsup.config.ts",
      `import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  define: { ...{ __X__: process.env.X } },
});
`
    );
    const violations = runCheck({ packagesRoot: fixtures.root });
    assert.equal(violations.length, 1);
  } finally {
    fixtures.cleanup();
  }
});

test("(h) template-literal key with env value fails", () => {
  const fixtures = makeTempPackages();
  try {
    const pkg = fixtures.addPackage("template");
    pkg.writeConfig(
      "tsup.config.ts",
      `import { defineConfig } from 'tsup';
const suffix = 'BAR';
export default defineConfig({
  entry: ['src/index.ts'],
  define: { [\`__FOO_\${suffix}__\`]: process.env.X },
});
`
    );
    const violations = runCheck({ packagesRoot: fixtures.root });
    assert.equal(violations.length, 1);
  } finally {
    fixtures.cleanup();
  }
});

test("(j) `process.env.X || 'default'` (BinaryExpression) fails", () => {
  const fixtures = makeTempPackages();
  try {
    const pkg = fixtures.addPackage("binexpr");
    pkg.writeConfig(
      "tsup.config.ts",
      `import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  define: { __X__: process.env.API_URL || 'http://default' },
});
`
    );
    const violations = runCheck({ packagesRoot: fixtures.root });
    assert.equal(violations.length, 1);
    assert.match(violations[0].detail, /process\.env/);
  } finally {
    fixtures.cleanup();
  }
});

test("(k) template-literal value reading process.env fails", () => {
  const fixtures = makeTempPackages();
  try {
    const pkg = fixtures.addPackage("templit");
    pkg.writeConfig(
      "tsup.config.ts",
      `import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  define: { __URL__: \`http://\${process.env.API_HOST}\` },
});
`
    );
    const violations = runCheck({ packagesRoot: fixtures.root });
    assert.equal(violations.length, 1);
  } finally {
    fixtures.cleanup();
  }
});

test("(l) factory-form defineConfig with arrow returning bare object fails", () => {
  const fixtures = makeTempPackages();
  try {
    const pkg = fixtures.addPackage("factory-arrow");
    pkg.writeConfig(
      "tsup.config.ts",
      `import { defineConfig } from 'tsup';
export default defineConfig((env) => ({
  entry: ['src/index.ts'],
  define: { __X__: process.env.API_URL },
}));
`
    );
    const violations = runCheck({ packagesRoot: fixtures.root });
    assert.equal(violations.length, 1);
  } finally {
    fixtures.cleanup();
  }
});

test("(m) factory-form defineConfig with block + return fails", () => {
  const fixtures = makeTempPackages();
  try {
    const pkg = fixtures.addPackage("factory-block");
    pkg.writeConfig(
      "tsup.config.ts",
      `import { defineConfig } from 'tsup';
export default defineConfig((env) => {
  return {
    entry: ['src/index.ts'],
    define: { __X__: process.env.API_URL },
  };
});
`
    );
    const violations = runCheck({ packagesRoot: fixtures.root });
    assert.equal(violations.length, 1);
  } finally {
    fixtures.cleanup();
  }
});

test("(i) comment containing } inside define block does not false-negative", () => {
  const fixtures = makeTempPackages();
  try {
    const pkg = fixtures.addPackage("comment");
    pkg.writeConfig(
      "tsup.config.ts",
      `import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  define: {
    // comment with a } that would defeat naive regex
    __X__: JSON.stringify(process.env.API_URL),
  },
});
`
    );
    const violations = runCheck({ packagesRoot: fixtures.root });
    assert.equal(violations.length, 1);
    assert.match(violations[0].detail, /process\.env/);
  } finally {
    fixtures.cleanup();
  }
});
