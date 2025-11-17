# Implementation Plan - Import/Export FIT, TCX, and PWX Formats

## Overview

This feature enables importing and exporting workout files in FIT, TCX, and PWX formats using the `@kaiord/core` library. This is critical for device compatibility and interoperability with training platforms.

**Target Release:** v1.1.0  
**Estimated Effort:** 15-20 hours  
**Priority:** HIGH - Critical for device compatibility

## Testing Requirements

All tasks must include comprehensive testing following the Testing Strategy:

- Unit tests for all utility functions (80%+ coverage)
- Component tests for all UI components (70%+ coverage)
- Integration tests for complete user flows
- E2E tests for critical paths across all browsers
- Performance tests for large files and complex workouts

## Implementation Tasks

- [ ] 1. Add format detection and validation
  - Detect file format from extension (.fit, .tcx, .pwx, .krd)
  - Validate file format before conversion
  - Show format-specific error messages
  - Write unit tests for format detection
  - _Requirements: 12.1, 12.5_
  - _Files: utils/file-format-detector.ts_

- [ ] 2. Implement FIT file import
  - Use @kaiord/core toKRD function for FIT → KRD conversion
  - Handle FIT parsing errors gracefully
  - Display conversion progress for large files
  - Validate converted KRD against schema
  - Write unit tests for FIT import
  - _Requirements: 12.2_
  - _Files: utils/import-workout.ts_

- [ ] 3. Implement TCX and PWX file import
  - Use @kaiord/core toKRD function for TCX → KRD conversion
  - Use @kaiord/core toKRD function for PWX → KRD conversion
  - Handle XML parsing errors gracefully
  - Display conversion progress for large files
  - Write unit tests for TCX/PWX import
  - _Requirements: 12.3, 12.4_
  - _Files: utils/import-workout.ts_

- [ ] 4. Update FileUpload component to support multiple formats
  - Accept .fit, .tcx, .pwx, .krd, .json file extensions
  - Show format icon/badge for uploaded file
  - Display conversion status during import
  - Handle conversion errors with user-friendly messages
  - Write unit tests for FileUpload component
  - _Requirements: 12.1, 12.5_
  - _Files: components/molecules/FileUpload/FileUpload.tsx_

- [ ] 5. Implement FIT file export
  - Use @kaiord/core fromKRD function for KRD → FIT conversion
  - Handle FIT encoding errors gracefully
  - Generate correct .fit file extension
  - Trigger browser download with FIT binary
  - Write unit tests for FIT export
  - _Requirements: 12.7_
  - _Files: utils/export-workout.ts_

- [ ] 6. Implement TCX and PWX file export
  - Use @kaiord/core fromKRD function for KRD → TCX conversion
  - Use @kaiord/core fromKRD function for KRD → PWX conversion
  - Handle XML encoding errors gracefully
  - Generate correct file extensions (.tcx, .pwx)
  - Write unit tests for TCX/PWX export
  - _Requirements: 12.8, 12.9_
  - _Files: utils/export-workout.ts_

- [ ] 7. Create ExportFormatSelector component
  - Dropdown to select format (FIT, TCX, PWX, KRD)
  - Show format description and compatibility info
  - Display format-specific warnings (e.g., "FIT may not support all features")
  - Validate workout before export
  - Write unit tests for selector component
  - _Requirements: 12.6_
  - _Files: components/molecules/ExportFormatSelector/ExportFormatSelector.tsx_

- [ ] 8. Update SaveButton to support multiple export formats
  - Integrate ExportFormatSelector into save flow
  - Add format parameter to save function
  - Generate correct file extension based on format
  - Update download filename with format extension
  - Show success notification with format name
  - Write unit tests for multi-format save
  - _Requirements: 12.6, 12.10_
  - _Files: components/molecules/SaveButton/SaveButton.tsx_

- [ ] 9. Add loading states for conversion operations
  - Show spinner during file import conversion
  - Show progress bar for large file conversions
  - Disable UI during conversion processing
  - Display conversion time estimates
  - Write unit tests for loading states
  - _Requirements: 36.3_
  - _Files: components/molecules/FileUpload/FileUpload.tsx, components/molecules/SaveButton/SaveButton.tsx_

- [ ] 10. Implement comprehensive testing strategy for import/export
  - **Unit Tests** (Coverage target: 80%+)
    - Test file format detection utility
    - Test FIT/TCX/PWX import functions with valid files
    - Test FIT/TCX/PWX export functions with valid KRD
    - Test error handling for invalid files
    - Test error handling for conversion failures
    - Test MIME type detection
    - Test file extension validation
  - **Component Tests** (Coverage target: 70%+)
    - Test FileUpload component renders correctly
    - Test FileUpload accepts multiple file formats
    - Test FileUpload shows format icon/badge
    - Test FileUpload displays conversion status
    - Test FileUpload handles errors gracefully
    - Test ExportFormatSelector component renders
    - Test ExportFormatSelector shows format descriptions
    - Test ExportFormatSelector validates before export
    - Test SaveButton with format selection
    - Test SaveButton generates correct filename
    - Test SaveButton shows success notification
  - **Integration Tests** (Complete user flows)
    - Test complete import flow: select file → convert → validate → load
    - Test complete export flow: select format → convert → download
    - Test round-trip flow: import FIT → edit → export FIT
    - Test error recovery: invalid file → show error → retry
    - Test format switching: load KRD → export as FIT/TCX/PWX
  - **E2E Tests** (Critical paths)
    - Test importing FIT file and editing workout
    - Test importing TCX file and editing workout
    - Test importing PWX file and editing workout
    - Test exporting to FIT format
    - Test exporting to TCX format
    - Test exporting to PWX format
    - Test round-trip conversion (import → edit → export)
    - Test conversion error handling
    - Test keyboard shortcuts work with import/export
    - Test mobile file upload flow
  - **Performance Tests**
    - Test large FIT file import performance (>1MB)
    - Test conversion time for complex workouts (>50 steps)
    - Test bundle size impact of @kaiord/core integration
    - Monitor memory usage during conversion
  - _Requirements: 12, 36.3, 36.4_
  - _Files: utils/import-workout.test.ts, utils/export-workout.test.ts, utils/file-format-detector.test.ts, components/molecules/FileUpload/FileUpload.test.tsx, components/molecules/ExportFormatSelector/ExportFormatSelector.test.tsx, components/molecules/SaveButton/SaveButton.test.tsx, e2e/import-export-formats.spec.ts_

## Summary

This implementation plan provides a clear roadmap for adding import/export functionality for FIT, TCX, and PWX formats. Each task is:

- **Actionable**: Clear implementation steps
- **Testable**: Includes comprehensive test requirements
- **Traceable**: References specific requirements
- **Incremental**: Builds on existing file handling infrastructure

**Dependencies:**

- `@kaiord/core` library (already available as workspace dependency)
- Existing FileUpload and SaveButton components
- Toast notification system

**Success Criteria:**

- Users can import FIT/TCX/PWX files and edit them
- Users can export workouts to FIT/TCX/PWX formats
- Round-trip conversions maintain data integrity
- All tests passing with 80%+ unit coverage, 70%+ component coverage
- E2E tests passing on all browsers (Chrome, Firefox, Safari, Edge)
