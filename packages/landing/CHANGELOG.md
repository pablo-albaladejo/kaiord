# @kaiord/landing

## 4.1.2

### Patch Changes

- Updated dependencies [73a2ce4]
  - @kaiord/core@9.2.0

## 4.1.1

### Patch Changes

- Updated dependencies [45a788a]
- Updated dependencies [2678d66]
  - @kaiord/core@9.1.0

## 4.1.0

### Minor Changes

- d77a600: Redesign the kaiord.com landing around an explicit audience fork, resolving the consumer-vs-developer identity crisis.
  - **Hero** is now a neutral headline plus two equal path cards — _For athletes → Use the editor_ (editor mockup, "Open the Editor") and _For developers → Build with the SDK_ (`convert.ts` snippet + `npm i @kaiord/core`, "Read the Docs"). They sit side-by-side ≥860px and stack on mobile.
  - **Showcase** band ("Plan, generate, sync.") pairs a lightweight CSS editor mockup with the three athlete features.
  - **Format hub** redrawn as a radial diagram — KRD hub centered, `.FIT/.TCX/.ZWO/.GCN` around it with bidirectional connectors — replacing the mirrored two-column layout.
  - **"100% AI-coded"** demoted from a hero badge + full card to a single honest line beside open-source.
  - **Open-source metrics** changed to ones that sell: 5 adapters / 100% round-trip / MIT / 0 backend services.
  - Same framework-free stack (hand-authored `index.html` + Tailwind v4 + shared `brand-tokens.css`). The install-command island moves to `src/install-widget.ts` (extracted from `main.ts`, now unit-tested) and gains a copy→checkmark affordance. All prior accessibility is preserved: skip link, ARIA diagram, 44px touch targets, focus rings, reduced-motion.

### Patch Changes

- Updated dependencies [a015501]
- Updated dependencies [82a7467]
- Updated dependencies [275c221]
- Updated dependencies [d597cb4]
  - @kaiord/core@9.0.0

## 4.0.3

### Patch Changes

- Updated dependencies [581239f]
  - @kaiord/core@8.0.0

## 4.0.2

### Patch Changes

- Updated dependencies [79be4f3]
- Updated dependencies [d66e509]
  - @kaiord/core@7.2.0

## 4.0.1

### Patch Changes

- Updated dependencies [1eb5fd0]
  - @kaiord/core@7.1.2
