# Design Document - Import/Export FIT, TCX, and ZWO Formats

## Overview

This feature integrates `@kaiord/core` library to enable importing and exporting workout files in FIT, TCX, and ZWO formats. The design follows clean architecture principles with clear separation between UI components, business logic, and format conversion.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ FileUpload │  │ SaveButton │  │   Format   │            │
│  │ Component  │  │ Component  │  │  Selector  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                          ↓ uses
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Import   │  │   Export   │  │   Format   │            │
│  │  Workflow  │  │  Workflow  │  │  Detector  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                          ↓ uses
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ @kaiord/   │  │   File     │  │   Toast    │            │
│  │   core     │  │  System    │  │  Service   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## Format Conversion Flow

### Import Flow

```typescript
// 1. User selects file
File → FileUpload Component

// 2. Detect format
const format = detectFormat(file.name); // .fit, .tcx, .zwo, .krd

// 3. Read file as buffer
const buffer = await file.arrayBuffer();
const uint8Array = new Uint8Array(buffer);

// 4. Convert to KRD
if (format === 'krd') {
  const text = new TextDecoder().decode(uint8Array);
  krd = JSON.parse(text);
} else {
  krd = await toKRD(uint8Array, { type: format });
}

// 5. Validate KRD
const errors = validateKRD(krd);
if (errors.length > 0) throw new ValidationError(errors);

// 6. Load into editor
loadWorkout(krd);
showSuccessNotification(`Imported ${workout.name}`);
```

### Export Flow

```typescript
// 1. User selects format
Format → ExportFormatSelector Component

// 2. Get current workout
const krd = getCurrentWorkout();

// 3. Validate before export
const errors = validateKRD(krd);
if (errors.length > 0) throw new ValidationError(errors);

// 4. Convert from KRD
let blob: Blob;
if (format === 'krd') {
  const json = JSON.stringify(krd, null, 2);
  blob = new Blob([json], { type: 'application/json' });
} else {
  const buffer = await fromKRD(krd, { type: format });
  const mimeType = getMimeType(format);
  blob = new Blob([buffer], { type: mimeType });
}

// 5. Trigger download
const filename = `${workout.name}.${format}`;
downloadFile(blob, filename);
showSuccessNotification(`Exported as ${format.toUpperCase()}`);
```

## Component Interfaces

### FileUpload Component

```typescript
interface FileUploadProps {
  onFileLoad: (krd: KRD) => void;
  onError: (error: Error) => void;
  acceptedFormats?: string[]; // ['.fit', '.tcx', '.zwo', '.krd', '.json']
}
```

### ExportFormatSelector Component

```typescript
interface ExportFormatSelectorProps {
  currentFormat: "fit" | "tcx" | "zwo" | "krd";
  onFormatChange: (format: "fit" | "tcx" | "zwo" | "krd") => void;
  disabled?: boolean;
}

interface FormatOption {
  value: "fit" | "tcx" | "zwo" | "krd";
  label: string;
  description: string;
  icon: React.ReactNode;
  compatibility: string[];
}
```

### SaveButton Component (Updated)

```typescript
interface SaveButtonProps {
  workout: KRD;
  format: "fit" | "tcx" | "zwo" | "krd";
  onSave: () => void;
  onError: (error: Error) => void;
  disabled?: boolean;
}
```

## Utility Functions

### Format Detection

```typescript
// utils/file-format-detector.ts
export const detectFormat = (
  filename: string
): "fit" | "tcx" | "zwo" | "krd" | null => {
  const ext = filename.toLowerCase().split(".").pop();

  switch (ext) {
    case "fit":
      return "fit";
    case "tcx":
      return "tcx";
    case "zwo":
      return "zwo";
    case "krd":
    case "json":
      return "krd";
    default:
      return null;
  }
};

export const getMimeType = (format: "fit" | "tcx" | "zwo" | "krd"): string => {
  switch (format) {
    case "fit":
      return "application/octet-stream";
    case "tcx":
    case "zwo":
      return "application/xml";
    case "krd":
      return "application/json";
  }
};
```

### Import Workout

```typescript
// utils/import-workout.ts
import { toKRD } from "@kaiord/core";
import type { KRD } from "@kaiord/core";

export const importWorkout = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<KRD> => {
  const format = detectFormat(file.name);

  if (!format) {
    throw new Error(
      `Unsupported file format. Supported: .fit, .tcx, .zwo, .krd`
    );
  }

  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);

  if (format === "krd") {
    const text = new TextDecoder().decode(uint8Array);
    return JSON.parse(text);
  }

  // Convert using @kaiord/core
  try {
    const krd = await toKRD(uint8Array, { type: format });
    return krd;
  } catch (error) {
    throw new Error(
      `Failed to convert ${format.toUpperCase()} file: ${error.message}`
    );
  }
};
```

### Export Workout

```typescript
// utils/export-workout.ts
import { fromKRD } from "@kaiord/core";
import type { KRD } from "@kaiord/core";

export const exportWorkout = async (
  krd: KRD,
  format: "fit" | "tcx" | "zwo" | "krd"
): Promise<Blob> => {
  if (format === "krd") {
    const json = JSON.stringify(krd, null, 2);
    return new Blob([json], { type: "application/json" });
  }

  // Convert using @kaiord/core
  try {
    const buffer = await fromKRD(krd, { type: format });
    const mimeType = getMimeType(format);
    return new Blob([buffer], { type: mimeType });
  } catch (error) {
    throw new Error(
      `Failed to convert to ${format.toUpperCase()}: ${error.message}`
    );
  }
};

export const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
```

## Error Handling

### Error Types

```typescript
export class FormatDetectionError extends Error {
  constructor(filename: string) {
    super(`Unable to detect format from filename: ${filename}`);
    this.name = "FormatDetectionError";
  }
}

export class ConversionError extends Error {
  constructor(
    public readonly sourceFormat: string,
    public readonly targetFormat: string,
    public readonly originalError: Error
  ) {
    super(
      `Failed to convert from ${sourceFormat} to ${targetFormat}: ${originalError.message}`
    );
    this.name = "ConversionError";
  }
}

export class ValidationError extends Error {
  constructor(
    public readonly errors: Array<{ field: string; message: string }>
  ) {
    super(`Validation failed: ${errors.length} errors`);
    this.name = "ValidationError";
  }
}
```

## Performance Considerations

### Large File Handling

- Show progress bar for files >1MB
- Use Web Workers for conversion (future enhancement)
- Stream processing for very large files (future enhancement)

### Bundle Size

- `@kaiord/core` is already a workspace dependency
- No additional bundle size impact
- Tree-shaking ensures only used converters are included

## Testing Strategy

### Unit Tests (80%+ coverage)

- Format detection utility
- Import/export functions
- Error handling
- MIME type detection

### Component Tests (70%+ coverage)

- FileUpload component
- ExportFormatSelector component
- SaveButton with format selection

### Integration Tests

- Complete import flow
- Complete export flow
- Round-trip conversion
- Error recovery

### E2E Tests

- Import FIT/TCX/ZWO files
- Export to FIT/TCX/ZWO formats
- Cross-browser compatibility
- Mobile file upload

### Performance Tests

- Large file import (>1MB)
- Complex workout conversion (>50 steps)
- Memory usage monitoring

## Summary

This design provides a clean, testable architecture for importing and exporting workout files in multiple formats. The integration with `@kaiord/core` ensures consistent conversion logic across the Kaiord ecosystem while maintaining the SPA editor's clean architecture principles.
