# FileUpload Component - Usage Example

## Integration with Workout Store

Here's how to integrate the FileUpload component with the workout store:

```tsx
import { FileUpload } from "./components/molecules/FileUpload";
import { useWorkoutStore } from "./store/workout-store";
import { useState } from "react";
import type { ValidationError } from "./types/krd";

function WorkoutLoader() {
  const loadWorkout = useWorkoutStore((state) => state.loadWorkout);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Array<ValidationError>
  >([]);

  const handleFileLoad = (krd: KRD) => {
    // Load the workout into the store
    loadWorkout(krd);

    // Clear any previous errors
    setError(null);
    setValidationErrors([]);

    // Optional: Show success notification
    console.log("Workout loaded successfully:", krd.extensions?.workout?.name);
  };

  const handleError = (
    errorMessage: string,
    errors?: Array<ValidationError>
  ) => {
    setError(errorMessage);
    setValidationErrors(errors || []);

    // Optional: Show error notification to user
    console.error("Failed to load workout:", errorMessage);
    if (errors) {
      console.error("Validation errors:", errors);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Load Workout</h2>

      <FileUpload onFileLoad={handleFileLoad} onError={handleError} />

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold mb-2">
            Error Loading File
          </h3>
          <p className="text-red-700">{error}</p>

          {validationErrors.length > 0 && (
            <div className="mt-3">
              <h4 className="text-red-800 font-medium mb-1">
                Validation Errors:
              </h4>
              <ul className="list-disc list-inside text-red-700 text-sm">
                {validationErrors.map((err, index) => (
                  <li key={index}>
                    {err.path.join(".")}: {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default WorkoutLoader;
```

## Integration with MainLayout

Add the FileUpload component to the main layout header:

```tsx
import { FileUpload } from "../molecules/FileUpload";
import { useWorkoutStore } from "../../../store/workout-store";

export const MainLayout = ({ children }: MainLayoutProps) => {
  const loadWorkout = useWorkoutStore((state) => state.loadWorkout);

  const handleFileLoad = (krd: KRD) => {
    loadWorkout(krd);
  };

  const handleError = (
    error: string,
    validationErrors?: Array<ValidationError>
  ) => {
    // Show error notification (implement notification system)
    alert(`Error: ${error}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Workout Editor
            </h1>
            <FileUpload onFileLoad={handleFileLoad} onError={handleError} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};
```

## Error Handling Best Practices

1. **Display User-Friendly Messages**: Convert technical validation errors into readable messages
2. **Provide Context**: Show which fields failed validation
3. **Offer Solutions**: Suggest how to fix common errors
4. **Log Details**: Keep detailed errors in console for debugging

```tsx
const formatValidationError = (error: ValidationError): string => {
  const fieldName = error.path[error.path.length - 1];

  // Provide user-friendly field names
  const fieldLabels: Record<string, string> = {
    version: "KRD Version",
    type: "File Type",
    metadata: "Workout Metadata",
    sport: "Sport Type",
    steps: "Workout Steps",
  };

  const label = fieldLabels[fieldName as string] || fieldName;
  return `${label}: ${error.message}`;
};
```

## Testing the Integration

Create a test KRD file (`test-workout.krd`):

```json
{
  "version": "1.0",
  "type": "workout",
  "metadata": {
    "created": "2025-01-15T10:30:00Z",
    "sport": "running"
  },
  "extensions": {
    "workout": {
      "name": "Test Workout",
      "sport": "running",
      "steps": [
        {
          "stepIndex": 0,
          "durationType": "time",
          "duration": {
            "type": "time",
            "seconds": 300
          },
          "targetType": "open",
          "target": {
            "type": "open"
          },
          "intensity": "warmup"
        }
      ]
    }
  }
}
```

Upload this file to test the component functionality.
