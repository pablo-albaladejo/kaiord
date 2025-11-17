# Design Document - Enhanced Error Handling

## Overview

Implement comprehensive error handling with specific error messages and recovery mechanisms.

## Error Types

```typescript
export class FileParsingError extends Error {
  constructor(
    message: string,
    public readonly line?: number,
    public readonly column?: number
  ) {
    super(message);
    this.name = "FileParsingError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ConversionError extends Error {
  constructor(
    message: string,
    public readonly format: string,
    public readonly details?: string
  ) {
    super(message);
    this.name = "ConversionError";
  }
}
```

## Error Display

```typescript
const ErrorMessage = ({ error }: { error: Error }) => {
  if (error instanceof FileParsingError) {
    return (
      <div className="error">
        <h3>File Parsing Error</h3>
        <p>{error.message}</p>
        {error.line && <p>Line: {error.line}, Column: {error.column}</p>}
      </div>
    );
  }

  if (error instanceof ValidationError) {
    return (
      <div className="error">
        <h3>Validation Error</h3>
        <ul>
          {error.errors.map(e => (
            <li key={e.field}>{e.field}: {e.message}</li>
          ))}
        </ul>
      </div>
    );
  }

  return <div className="error">{error.message}</div>;
};
```

## Error Recovery

```typescript
// Backup before risky operations
const performRiskyOperation = async () => {
  const backup = getCurrentWorkout();

  try {
    await riskyOperation();
  } catch (error) {
    // Restore from backup
    loadWorkout(backup);
    showError("Operation failed. Your workout has been restored.");
  }
};

// Safe mode
const enableSafeMode = () => {
  set({
    safeMode: true,
    features: {
      repetitionBlocks: false,
      dragAndDrop: false,
      advancedDurations: false,
    },
  });
  showNotification("Safe mode enabled. Advanced features disabled.");
};
```
