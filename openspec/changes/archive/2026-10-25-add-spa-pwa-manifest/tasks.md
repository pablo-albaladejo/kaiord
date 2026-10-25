## 1. OpenSpec change

- [x] 1.1 Write `proposal.md`, this task list and the `branding` delta.
- [x] 1.2 `openspec validate add-spa-pwa-manifest --strict` passes.

## 2. Icons

- [x] 2.1 Add `assets/mark-app-icon-maskable.svg`: a full-bleed background
      with the mark inside the central 80% safe zone.
- [x] 2.2 Make `pnpm brand:images` render 192 and 512 `any` icons and a
      512 maskable icon, and mirror them into the SPA's `public/`.
- [x] 2.3 Extend `build-brand-images.test.mjs`: each app icon is committed
      at its size, and the maskable mark stays inside the safe zone.

## 3. Manifest and link

- [x] 3.1 Add `public/manifest.webmanifest`: `id`, `start_url` and `scope`
      `/app/`, `display: "standalone"`, theme and background `#0d0d0d`.
- [x] 3.2 Link it from `index.html` through a root-absolute path that Vite
      prefixes with `base`.

## 4. Guard

- [x] 4.1 Add the SPA dist manifest test, gated by `REQUIRE_SPA_DIST=1`.
- [x] 4.2 Run it in CI's `build` job and in `deploy-site.yml` over
      `merged-dist/app` with base `/app/`.

## 5. Verification

- [x] 5.1 Build the SPA with `VITE_BASE_PATH=/app/` and run the guard over
      it.
- [x] 5.2 Check in `vite preview` that Chrome DevTools > Application >
      Manifest reports no installability errors.
- [x] 5.3 Run lint, `pnpm test:scripts` and the affected tests.
