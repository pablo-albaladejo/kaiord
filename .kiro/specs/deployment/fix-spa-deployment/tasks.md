# Implementation Plan

- [x] 1. Update GitHub Actions workflow to build core package before SPA
  - Modify `.github/workflows/deploy-spa-editor.yml` to add core package build step
  - Add build verification steps to ensure artifacts exist
  - Update workflow triggers to include core package file changes
  - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [x] 1.1 Add core package build step
  - Insert build step after dependency installation
  - Use pnpm workspace filtering: `pnpm --filter @kaiord/core build`
  - Position before SPA build step
  - _Requirements: 1.1_

- [x] 1.2 Add core build verification
  - Check that `packages/core/dist` directory exists
  - Verify TypeScript declaration files are present
  - Exit with error if verification fails
  - _Requirements: 1.2_

- [x] 1.3 Add SPA build verification
  - Check that `packages/workout-spa-editor/dist` directory exists
  - Verify `index.html` file is present
  - Exit with error if verification fails
  - _Requirements: 1.3_

- [x] 1.4 Update workflow triggers
  - Add `packages/core/**` to paths filter
  - Keep existing SPA and workflow file triggers
  - Ensure workflow_dispatch remains for manual triggering
  - _Requirements: 3.1, 3.2_

- [x] 2. Test deployment workflow
  - Create a test branch with a minor SPA change
  - Manually trigger the workflow via GitHub Actions UI
  - Verify all build steps complete successfully
  - Verify the deployed site is accessible
  - _Requirements: 1.4, 4.3_

- [x] 2.1 Verify workflow execution
  - Check that core package builds successfully
  - Check that SPA builds successfully
  - Check that deployment completes
  - Review workflow logs for any warnings
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2.2 Verify deployed site functionality
  - Access the GitHub Pages URL
  - Test navigation and routing
  - Verify assets load correctly
  - Check browser console for errors
  - Test core features (load, edit, save workout)
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 3. Create local CI testing script
  - Create `scripts/test-ci-workflows.sh` to simulate CI workflows locally
  - Test core package build in isolation
  - Test SPA build with core dependency
  - Test deployment workflow steps
  - Verify all scenarios pass before merge
  - _Requirements: 1.1, 1.2, 1.3, 2.2_

- [x] 3.1 Implement core build test
  - Simulate CI environment (clean install)
  - Run core package build
  - Verify dist artifacts exist
  - _Requirements: 1.1, 1.2_

- [x] 3.2 Implement SPA build test
  - Build core package first
  - Run SPA build with core dependency
  - Verify SPA dist artifacts exist
  - _Requirements: 1.2, 1.3_

- [x] 3.3 Implement deployment simulation
  - Test base path configuration
  - Verify artifact structure matches GitHub Pages requirements
  - Check that index.html exists and references assets correctly
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4. Document deployment process
  - Update README with deployment information
  - Document manual deployment procedure
  - Add troubleshooting section for common issues
  - Document how to use the CI testing script
  - _Requirements: 1.5_

- [x] 5. Checkpoint - Ensure deployment works end-to-end
  - Run local CI testing script and verify all scenarios pass
  - Ensure all tests pass, ask the user if questions arise.
