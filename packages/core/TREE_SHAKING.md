# Tree-Shaking Guide

`@kaiord/core` is fully optimized for tree-shaking, allowing you to import only what you need and keep your bundle size minimal.

## ✅ What is Tree-Shaking?

Tree-shaking is a technique used by modern bundlers (webpack, rollup, esbuild, vite) to eliminate unused code from your final bundle. This results in smaller bundle sizes and faster load times.

## 🌳 How to Use Tree-Shaking

### ✅ Good: Import Only What You Need

```typescript
// Import specific items from main package
import { krdSchema, sportSchema } from "@kaiord/core";
import type { KRD, Sport } from "@kaiord/core";

// Import test utilities separately (not included in production bundles)
import { loadKrdFixture } from "@kaiord/core/test-utils";

// Only krdSchema, sportSchema, and their dependencies are bundled
```

### ❌ Avoid: Import Everything

```typescript
// This works, but includes everything in your bundle
import * as Kaiord from "@kaiord/core";

// Your bundle will be much larger
```

## 📦 What Gets Included?

When you import a specific item, the bundler includes:

1. The item itself
2. Its direct dependencies
3. Shared utilities it uses

**Example:**

```typescript
import { krdSchema } from "@kaiord/core";
```

**Includes:**

- `krdSchema` definition
- `workoutSchema` (used by krdSchema)
- `durationSchema` (used by workoutSchema)
- Zod library (peer dependency)

**Excludes:**

- `createDefaultProviders` (not used)
- `convertFitToKrd` (not used)
- `FitReader` types (not used)
- All other unused exports

## 🎯 Common Import Patterns

### Pattern 1: Schema Validation Only

```typescript
import { krdSchema } from "@kaiord/core";
import type { KRD } from "@kaiord/core";

const validateKrd = (data: unknown): KRD => {
  return krdSchema.parse(data);
};
```

**Bundle size:** ~15-20KB (minified + gzipped)

### Pattern 2: Type Definitions Only

```typescript
import type { KRD, Workout, WorkoutStep } from "@kaiord/core";

// Types are erased at runtime, 0 bytes in bundle
const myWorkout: Workout = {
  /* ... */
};
```

**Bundle size:** 0 bytes (types are compile-time only)

### Pattern 3: Full Conversion

```typescript
import { createDefaultProviders } from "@kaiord/core";
import type { KRD } from "@kaiord/core";

const providers = createDefaultProviders();
const krd = await providers.convertFitToKrd({ fitBuffer });
```

**Bundle size:** ~50-80KB (minified + gzipped)
Includes converters, mappers, validators, and Garmin FIT SDK.

### Pattern 4: Custom Providers

```typescript
import { convertFitToKrd, createSchemaValidator } from "@kaiord/core";
import { myCustomFitReader } from "./my-reader";

// Use custom reader, exclude default Garmin SDK
const validator = createSchemaValidator();
const convert = convertFitToKrd(myCustomFitReader, validator);
```

**Bundle size:** Depends on your custom reader
Excludes Garmin FIT SDK if not imported.

## 🔧 Configuration

`@kaiord/core` is configured for optimal tree-shaking:

### package.json

```json
{
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./test-utils": {
      "import": "./dist/test-utils/index.js",
      "types": "./dist/test-utils/index.d.ts"
    }
  }
}
```

- **`type: "module"`**: Uses ES modules
- **`sideEffects: false`**: No side effects, safe to tree-shake
- **`exports`**: Explicit entry points (main package + test utilities)

### tsup.config.ts

```typescript
{
  format: ["esm"],
  treeshake: true,
  splitting: false
}
```

- **`format: ["esm"]`**: ES modules for tree-shaking
- **`treeshake: true`**: Enable tree-shaking
- **`splitting: false`**: Single bundle for predictable imports

## 📊 Bundle Size Examples

Real-world bundle sizes (minified + gzipped):

| Import Pattern    | Size   | What's Included                  |
| ----------------- | ------ | -------------------------------- |
| Types only        | 0 KB   | Compile-time only                |
| Schema validation | ~15 KB | Zod schemas                      |
| Domain schemas    | ~20 KB | All KRD schemas                  |
| Single use case   | ~40 KB | Use case + dependencies          |
| Full providers    | ~80 KB | Everything                       |
| Test utilities    | N/A    | Not included in production build |

**Note:** Test utilities (`@kaiord/core/test-utils`) are separate exports intended for development/testing only and should not be included in production bundles.

## 🧪 Testing Tree-Shaking

To verify tree-shaking in your project:

### 1. Using webpack-bundle-analyzer

```bash
npm install -D webpack-bundle-analyzer
```

```javascript
// webpack.config.js
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = {
  plugins: [new BundleAnalyzerPlugin()],
};
```

### 2. Using Vite

```bash
npm run build -- --mode production
```

Check `dist/assets/*.js` file sizes.

### 3. Using esbuild

```bash
esbuild src/index.ts --bundle --minify --metafile=meta.json
```

Analyze `meta.json` to see what's included.

## 💡 Best Practices

1. **Import specific items**, not `import *`
2. **Use type imports** when you only need types
3. **Avoid importing entire modules** if you only need one function
4. **Check your bundle size** regularly
5. **Use dynamic imports** for large, rarely-used features

### Example: Dynamic Import

```typescript
// Load converter only when needed
const loadConverter = async () => {
  const { createDefaultProviders } = await import("@kaiord/core");
  return createDefaultProviders();
};

// Converter is in a separate chunk, loaded on demand
```

## 🎓 Learn More

- [Webpack Tree Shaking](https://webpack.js.org/guides/tree-shaking/)
- [Rollup Tree Shaking](https://rollupjs.org/guide/en/#tree-shaking)
- [Vite Tree Shaking](https://vitejs.dev/guide/features.html#tree-shaking)

## ✅ Verification

Your bundler supports tree-shaking if:

- ✅ It supports ES modules (ESM)
- ✅ It's in production mode
- ✅ It has minification enabled

Common bundlers with tree-shaking:

- ✅ Webpack 5+
- ✅ Rollup
- ✅ Vite
- ✅ esbuild
- ✅ Parcel 2+
- ✅ Next.js
- ✅ SvelteKit
