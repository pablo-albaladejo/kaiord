# Usando Fixtures Compartidos

Este documento explica cómo usar los fixtures de test compartidos desde `@kaiord/core`.

## 📍 Ubicación

Los fixtures están centralizados en:

```
packages/core/src/tests/fixtures/
├── fit-files/          # Archivos FIT binarios
└── krd-files/          # Archivos KRD (JSON)
```

## 🎯 Ventajas

1. **Sin duplicación** - Un solo lugar para todos los fixtures
2. **Consistencia** - Mismos datos en todos los paquetes
3. **Mantenimiento** - Actualizar una vez, usar en todos lados
4. **Versionado** - Fixtures evolucionan con el schema KRD

## 📦 Uso en Tests

### Importar Fixtures

```typescript
import { loadKrdFixture, FIXTURE_NAMES } from "../test-utils/fixtures";
```

### Cargar un Fixture

```typescript
// Opción 1: Usar constantes (recomendado)
const krd = loadKrdFixture(`${FIXTURE_NAMES.INDIVIDUAL_STEPS}.krd`);

// Opción 2: Nombre directo
const krd = loadKrdFixture("WorkoutIndividualSteps.krd");
```

### Ejemplo Completo

```typescript
import { describe, expect, it } from "vitest";
import { loadKrdFixture, FIXTURE_NAMES } from "../test-utils/fixtures";
import { FileUpload } from "./FileUpload";

describe("FileUpload with real fixtures", () => {
  it("should load WorkoutIndividualSteps", () => {
    // Arrange
    const krd = loadKrdFixture(`${FIXTURE_NAMES.INDIVIDUAL_STEPS}.krd`);
    const onFileLoad = vi.fn();

    // Act
    // Simular carga de archivo con el fixture
    onFileLoad(krd);

    // Assert
    expect(onFileLoad).toHaveBeenCalledWith(
      expect.objectContaining({
        version: "1.0",
        type: "workout",
      })
    );
  });
});
```

## 📚 Fixtures Disponibles

| Constante                            | Archivo                          | Descripción                |
| ------------------------------------ | -------------------------------- | -------------------------- |
| `FIXTURE_NAMES.INDIVIDUAL_STEPS`     | WorkoutIndividualSteps.krd       | Steps individuales básicos |
| `FIXTURE_NAMES.REPEAT_STEPS`         | WorkoutRepeatSteps.krd           | Bloques de repetición      |
| `FIXTURE_NAMES.CUSTOM_TARGET_VALUES` | WorkoutCustomTargetValues.krd    | Targets personalizados     |
| `FIXTURE_NAMES.REPEAT_GREATER_THAN`  | WorkoutRepeatGreaterThanStep.krd | Condiciones avanzadas      |

## 🔧 API de Helpers

### `loadKrdFixture(filename: string): KRD`

Carga un archivo KRD y lo parsea como objeto.

```typescript
const krd = loadKrdFixture("WorkoutIndividualSteps.krd");
console.log(krd.version); // "1.0"
```

### `loadKrdFixtureRaw(filename: string): string`

Carga un archivo KRD como string JSON sin parsear.

```typescript
const jsonString = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");
const krd = JSON.parse(jsonString);
```

### `getFixturePath(type: "krd", filename: string): string`

Obtiene la ruta completa a un fixture.

```typescript
const path = getFixturePath("krd", "WorkoutIndividualSteps.krd");
// /path/to/packages/core/src/tests/fixtures/krd-files/WorkoutIndividualSteps.krd
```

### `FIXTURE_NAMES`

Constantes con los nombres base de los fixtures (sin extensión).

```typescript
console.log(FIXTURE_NAMES.INDIVIDUAL_STEPS); // "WorkoutIndividualSteps"
```

## 🎨 Casos de Uso

### Test de Carga de Archivo

```typescript
it("should validate KRD file structure", () => {
  const krd = loadKrdFixture(`${FIXTURE_NAMES.INDIVIDUAL_STEPS}.krd`);

  expect(krd).toMatchObject({
    version: "1.0",
    type: "workout",
    extensions: {
      workout: expect.any(Object),
    },
  });
});
```

### Test de Validación

```typescript
it("should validate all fixtures against schema", () => {
  const fixtureNames = Object.values(FIXTURE_NAMES);

  for (const name of fixtureNames) {
    const krd = loadKrdFixture(`${name}.krd`);
    const result = krdSchema.safeParse(krd);

    expect(result.success).toBe(true);
  }
});
```

### Test de Componente con Fixture

```typescript
it("should render workout from fixture", () => {
  const krd = loadKrdFixture(`${FIXTURE_NAMES.REPEAT_STEPS}.krd`);

  render(<WorkoutList workout={krd.extensions.workout} />);

  expect(screen.getByText(/Step 1/i)).toBeInTheDocument();
});
```

## 🔄 Actualizar Fixtures

Si necesitas actualizar un fixture:

1. **Edita el archivo en `packages/core/src/tests/fixtures/`**
2. **Todos los paquetes** usarán automáticamente la nueva versión
3. **Ejecuta tests** en todos los paquetes para verificar compatibilidad

```bash
# Verificar que todos los tests pasen
pnpm -r test
```

## 📝 Agregar Nuevos Fixtures

1. **Agrega el archivo** en `packages/core/src/tests/fixtures/krd-files/`
2. **Actualiza `FIXTURE_NAMES`** en `packages/core/src/test-utils/fixtures.ts`
3. **Documenta** el nuevo fixture en el README

```typescript
// packages/core/src/test-utils/fixtures.ts
export const FIXTURE_NAMES = {
  INDIVIDUAL_STEPS: "WorkoutIndividualSteps",
  REPEAT_STEPS: "WorkoutRepeatSteps",
  CUSTOM_TARGET_VALUES: "WorkoutCustomTargetValues",
  REPEAT_GREATER_THAN: "WorkoutRepeatGreaterThanStep",
  NEW_FIXTURE: "NewFixtureName", // ← Agregar aquí
} as const;
```

## 🚀 Beneficios para el Proyecto

### Antes (Duplicación)

```
packages/
├── core/src/tests/fixtures/
│   └── WorkoutIndividualSteps.krd
├── cli/src/tests/fixtures/
│   └── WorkoutIndividualSteps.krd (duplicado)
└── workout-spa-editor/src/tests/fixtures/
    └── WorkoutIndividualSteps.krd (duplicado)
```

### Después (Compartido)

```
packages/
├── core/
│   ├── src/tests/fixtures/
│   │   └── WorkoutIndividualSteps.krd (único)
│   └── src/test-utils/
│       └── fixtures.ts (helpers)
├── cli/
│   └── tests/ (usa @kaiord/core/test-utils)
└── workout-spa-editor/
    └── src/test-utils/ (re-exporta de core)
```

## 🔗 Referencias

- [Fixtures README](../../core/src/tests/fixtures/README.md) - Documentación completa
- [Testing Guidelines](../../.kiro/steering/testing.md) - Guías de testing
- [KRD Format](../../.kiro/steering/krd-format.md) - Especificación del formato

## 💡 Tips

1. **Usa constantes** - Siempre usa `FIXTURE_NAMES` en lugar de strings hardcodeados
2. **Valida fixtures** - Asegúrate que los fixtures pasen validación de schema
3. **Mantén pequeños** - Fixtures < 20KB para tests rápidos
4. **Documenta cambios** - Si modificas un fixture, documenta por qué

## ❓ FAQ

**P: ¿Puedo modificar un fixture para mi test?**  
R: No modifiques los fixtures compartidos. En su lugar, crea una copia modificada en tu test:

```typescript
const baseKrd = loadKrdFixture(`${FIXTURE_NAMES.INDIVIDUAL_STEPS}.krd`);
const modifiedKrd = {
  ...baseKrd,
  extensions: {
    ...baseKrd.extensions,
    workout: {
      ...baseKrd.extensions.workout,
      name: "Modified Workout",
    },
  },
};
```

**P: ¿Qué pasa si un fixture cambia y rompe mis tests?**  
R: Esto es intencional. Si un fixture cambia, tus tests deben adaptarse. Esto asegura que tu código funcione con datos reales actualizados.

**P: ¿Puedo agregar fixtures específicos de mi paquete?**  
R: Sí, pero solo si son específicos de tu paquete. Si pueden ser útiles para otros paquetes, agrégalos a `@kaiord/core`.
