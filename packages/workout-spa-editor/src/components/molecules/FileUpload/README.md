# FileUpload Component

A molecule component that provides file upload functionality with JSON parsing and KRD schema validation.

## Requirements

- **Requirement 7**: Load existing KRD files with validation

## Features

- File input with custom accept types
- JSON parsing with error handling
- KRD schema validation using Zod
- Loading state during file processing
- Display of loaded file name
- Comprehensive error reporting with validation details
- Accessible file input with proper ARIA labels

## Usage

```tsx
import { FileUpload } from "./components/molecules/FileUpload/FileUpload";
import { useWorkoutStore } from "./store/workout-store";

function App() {
  const loadWorkout = useWorkoutStore((state) => state.loadWorkout);

  const handleFileLoad = (krd: KRD) => {
    loadWorkout(krd);
    console.log("Workout loaded successfully");
  };

  const handleError = (
    error: string,
    validationErrors?: Array<ValidationError>
  ) => {
    console.error("File upload error:", error);
    if (validationErrors) {
      console.error("Validation errors:", validationErrors);
    }
  };

  return <FileUpload onFileLoad={handleFileLoad} onError={handleError} />;
}
```

## Props

| Prop         | Type                                                                 | Default        | Description                                             |
| ------------ | -------------------------------------------------------------------- | -------------- | ------------------------------------------------------- |
| `onFileLoad` | `(krd: KRD) => void`                                                 | Required       | Callback when file is successfully loaded and validated |
| `onError`    | `(error: string, validationErrors?: Array<ValidationError>) => void` | Optional       | Callback when file loading or validation fails          |
| `accept`     | `string`                                                             | `".krd,.json"` | File types to accept                                    |
| `className`  | `string`                                                             | `""`           | Additional CSS classes                                  |
| `disabled`   | `boolean`                                                            | `false`        | Disable the upload button                               |

## Error Handling

The component handles three types of errors:

1. **File Read Errors**: When the file cannot be read
2. **JSON Parse Errors**: When the file content is not valid JSON
3. **Validation Errors**: When the JSON doesn't match the KRD schema

All errors are reported through the `onError` callback with descriptive messages. Validation errors include detailed field-level information from Zod.

## Validation

The component validates uploaded files against the KRD schema from `@kaiord/core`. This ensures:

- Required fields are present (`version`, `type`, `metadata`)
- Field types are correct
- Nested structures match the expected format
- Enum values are valid

## Accessibility

- Hidden file input with proper `aria-label`
- Button trigger for better keyboard navigation
- Loading state communicated through button text and disabled state
- Error messages can be displayed with proper ARIA roles

## Testing

The component includes comprehensive tests covering:

- Rendering and basic interaction
- Valid file upload and parsing
- Invalid JSON handling
- Schema validation failures
- Loading states
- File name display
- Disabled state
- Custom accept types

Run tests with:

```bash
pnpm test FileUpload
```

## Implementation Notes

- Uses `useRef` to access the hidden file input
- Implements async file reading with `File.text()`
- Resets input value after errors to allow re-upload
- Shows loading spinner during file processing
- Displays loaded file name for user feedback
