## ADDED Requirements

### Requirement: Production-bundle FIT import

The SPA build SHALL bundle `@garmin/fitsdk` as published, without rewriting or replacing any of its modules. The CI `e2e-prod-base` job SHALL run the `@prod-bundle` Playwright specs against the SPA built with `VITE_BASE_PATH=/app/` and served the way the static host serves it. Those specs SHALL import, through the UI, a structured workout FIT, a FIT exported by the app itself, and health FIT files, and SHALL assert the imported steps and the stored health rows. They SHALL require the `kaiord-fit` chunk to be served from `/app/assets/`, and an import failure SHALL fail them with the error the app shows.

#### Scenario: A build-time change breaks the FIT decoder

- **WHEN** a change makes the production bundle's FIT decoder throw, while the dev server still decodes correctly
- **THEN** the `e2e-prod-base` job fails, and its log names the import error the app showed

#### Scenario: A health FIT file

- **WHEN** a weight-scale or HRV FIT file is imported with an active profile
- **THEN** one row lands in the matching health store and the app navigates to that health page

### Requirement: Deployed SPA names its commit

The deploy workflow SHALL write `app/version.json` containing `{"sha": "<commit SHA>"}` into the merged artifact, and its merged-artifact verification SHALL fail when the file is missing.

#### Scenario: Checking which build is live

- **WHEN** `https://kaiord.com/app/version.json` is fetched after a deploy
- **THEN** it returns the SHA of the commit that deploy built
