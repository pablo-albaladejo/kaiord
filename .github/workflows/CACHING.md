# CI/CD Caching Strategy

This document describes the caching strategy implemented in the GitHub Actions CI/CD pipeline to optimize workflow performance.

## Cache Layers

The pipeline implements three layers of caching:

### 1. pnpm Store Cache

**Purpose:** Cache the global pnpm store to avoid re-downloading packages

**Cache Key:** `{OS}-pnpm-store-{pnpm-version}-{pnpm-lock.yaml-hash}`

**Restore Keys:**

- `{OS}-pnpm-store-{pnpm-version}-` (same pnpm version, different lock file)
- `{OS}-pnpm-store-` (any pnpm version)

**Expected Speedup:** 60-70% reduction in dependency installation time

### 2. node_modules Cache

**Purpose:** Cache installed node_modules to skip installation entirely when possible

**Cache Key:** `{OS}-node-modules-{node-version}-{pnpm-lock.yaml-hash}`

**Restore Keys:**

- `{OS}-node-modules-{node-version}-` (same Node version, different lock file)
- `{OS}-node-modules-` (any Node version)

**Expected Speedup:** 80% reduction in dependency installation time

### 3. TypeScript Build Cache

**Purpose:** Cache compiled TypeScript output to skip rebuilding unchanged files

**Cache Key:** `{OS}-typescript-{node-version}-{tsconfig-hash}-{source-files-hash}`

**Restore Keys:**

- `{OS}-typescript-{node-version}-{tsconfig-hash}` (same config, different source)
- `{OS}-typescript-{node-version}-` (same Node version, different config)
- `{OS}-typescript-` (any Node version)

**Cached Paths:**

- `packages/*/dist` - Compiled JavaScript output
- `packages/*/.tsbuildinfo` - TypeScript incremental build info
- `packages/*/tsconfig.tsbuildinfo` - TypeScript build info

**Expected Speedup:** 40% reduction in build time

## Composite Cache Keys

All cache keys include multiple components for better hit rates:

1. **Operating System** - Ensures cache compatibility across runners
2. **Tool Version** - Prevents version conflicts (Node.js, pnpm)
3. **Configuration Hash** - Detects config changes (tsconfig.json, pnpm-lock.yaml)
4. **Source Hash** - Detects source code changes (TypeScript files)

## Restore Keys Strategy

Each cache uses a fallback hierarchy:

1. **Exact match** - Same OS, version, and content hash
2. **Partial match** - Same OS and version, different content
3. **Fallback match** - Same OS, any version

This ensures maximum cache reuse while maintaining correctness.

## Cache Hit Monitoring

The pipeline displays cache hit status for all three layers:

```
📦 Cache Status Report
=====================
pnpm store cache: ✅ HIT
node_modules cache: ✅ HIT
TypeScript build cache: ❌ MISS
=====================
```

Monitor these logs to track cache effectiveness and identify optimization opportunities.

## Performance Targets

Based on the caching strategy, expected workflow durations:

- **Full test suite (cache hit):** < 3 minutes
- **Full test suite (cache miss):** < 5 minutes
- **Lint + typecheck (cache hit):** < 1 minute
- **Build (cache hit):** < 2 minutes
- **Docs-only changes:** < 30 seconds

## Cache Invalidation

Caches are automatically invalidated when:

1. **pnpm store:** `pnpm-lock.yaml` changes or pnpm version changes
2. **node_modules:** `pnpm-lock.yaml` changes or Node.js version changes
3. **TypeScript build:** Source files change, `tsconfig.json` changes, or Node.js version changes

## Troubleshooting

### Cache Miss Rate Too High

If cache hit rate is consistently low:

1. Check if `pnpm-lock.yaml` is being modified frequently
2. Verify that source file hashes are stable
3. Consider adjusting restore-keys for more fallback options

### Build Failures After Cache Hit

If builds fail after a cache hit:

1. Clear the TypeScript build cache (delete and recreate)
2. Verify that incremental builds are working correctly
3. Check for stale build artifacts in the cache

### Cache Size Too Large

If cache storage is approaching limits:

1. Review cached paths to exclude unnecessary files
2. Reduce cache retention period
3. Consider using cache compression

## References

- [GitHub Actions Cache Documentation](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [pnpm Store Path](https://pnpm.io/cli/store#store-path)
- [TypeScript Incremental Builds](https://www.typescriptlang.org/docs/handbook/project-references.html)
