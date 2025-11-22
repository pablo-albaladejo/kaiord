# Test Fixtures - Shared Across Packages

Este directorio contiene fixtures de test compartidos entre todos los paquetes del monorepo.

## 📁 Estructura

```
fixtures/
├── fit-files/          # Archivos FIT binarios para tests
│   ├── WorkoutIndividualSteps.fit
│   ├── WorkoutRepeatSteps.fit
│   ├── WorkoutCustomTargetValues.fit
│   └── WorkoutRepeatGreaterThanStep.fit
├── krd-files/          # Archivos KRD (JSON) para tests
│   ├── WorkoutIndividualSteps.krd
│   ├── WorkoutRepeatSteps.krd
│   ├── WorkoutCustomTargetValues.krd
│   └── WorkoutRepeatGreaterThanStep.krd
└── README.md           # Este archivo
```

## 🎯 Propósito

Estos fixtures son utilizados por:

1. **@kaiord/core** - Tests de conversión FIT ↔ KRD
2. **@kaiord/cli** - Tests de comandos CLI
3. **@kaiord/workout-spa-editor** - Tests de carga de archivos

## 📝 Convenciones

### Nombres de Archivos

Los archivos siguen la convención `PascalCase` para mantener consistencia con los nombres de tests de Garmin:

- `WorkoutIndividualSteps` - Workout con steps individuales
- `WorkoutRepeatSteps` - Workout con bloques de repetición
- `WorkoutCustomTargetValues` - Workout con targets personalizados
- `WorkoutRepeatGreaterThanStep` - Workout con condiciones de repetición

### Pares FIT/KRD

Cada archivo `.fit` tiene su correspondiente `.krd` con el mismo nombre base. Esto permite:

- Tests de round-trip (FIT → KRD → FIT)
- Validación de conversión
- Golden tests

## 🔧 Uso en Tests

### Desde @kaiord/core

```typescript
import { readFileSync } from "fs";
import { join } from "path";

const fitBuffer = readFileSync(
  join(__dirname, "fixtures/fit-files/WorkoutIndividualSteps.fit")
);

const krdJson = readFileSync(
  join(__dirname, "fixtures/krd-files/WorkoutIndividualSteps.krd"),
  "utf-8"
);
```

### Desde @kaiord/workout-spa-editor (Unit Tests)

```typescript
// ✅ Recommended: Use test-utils helpers from @kaiord/core
import { loadKrdFixture, loadFitFixture } from "@kaiord/core/test-utils";

const krd = loadKrdFixture("WorkoutIndividualSteps.krd");
const fitBuffer = loadFitFixture("WorkoutIndividualSteps.fit");

// ❌ Avoid: Manual path resolution
import { readFileSync } from "fs";
import { join } from "path";

const krdPath = join(
  __dirname,
  "../../../core/src/tests/fixtures/krd-files/WorkoutIndividualSteps.krd"
);
```

### Desde @kaiord/cli (Integration Tests)

```typescript
// ✅ Recommended: Use fixture path helpers
import { getFixturePath, getFixturesDir } from "../helpers/fixture-paths";

// For single file
const inputPath = getFixturePath("fit-files", "WorkoutIndividualSteps.fit");

// For glob patterns
const fixturesDir = getFixturesDir("fit-files");
const globPattern = `${fixturesDir}/*.fit`;

// ❌ Avoid: Manual path resolution
import { resolve } from "path";

const fixturePath = resolve(
  __dirname,
  "../../core/src/tests/fixtures/fit-files/WorkoutIndividualSteps.fit"
);
```

## 📦 Agregar Nuevos Fixtures

### 1. Agregar el archivo FIT

```bash
cp nuevo-workout.fit packages/core/src/tests/fixtures/fit-files/
```

### 2. Generar el KRD correspondiente

```bash
pnpm kaiord convert \
  --input packages/core/src/tests/fixtures/fit-files/nuevo-workout.fit \
  --output packages/core/src/tests/fixtures/krd-files/nuevo-workout.krd
```

### 3. Validar el par

```bash
# Round-trip test
pnpm kaiord convert \
  --input packages/core/src/tests/fixtures/krd-files/nuevo-workout.krd \
  --output /tmp/test.fit

# Comparar con original
diff packages/core/src/tests/fixtures/fit-files/nuevo-workout.fit /tmp/test.fit
```

## 🎨 Características de los Fixtures

### WorkoutIndividualSteps.fit/krd

- Steps individuales sin repeticiones
- Diferentes tipos de duración (time, distance)
- Diferentes tipos de target (power, heart_rate)
- Intensidades variadas (warmup, active, cooldown)

### WorkoutRepeatSteps.fit/krd

- Bloques de repetición simples
- Múltiples steps dentro de cada bloque
- Conteo de repeticiones

### WorkoutCustomTargetValues.fit/krd

- Targets con valores personalizados
- Zonas de potencia
- Rangos de frecuencia cardíaca
- Porcentajes de FTP

### WorkoutRepeatGreaterThanStep.fit/krd

- Condiciones de repetición avanzadas
- Repeat until power greater than
- Repeat until heart rate less than
- Duraciones condicionales

## 🔍 Validación

Todos los fixtures deben:

1. ✅ Validar contra el schema KRD
2. ✅ Pasar round-trip tests (FIT → KRD → FIT)
3. ✅ Ser archivos reales de Garmin (no sintéticos)
4. ✅ Tener tamaño < 20KB (para tests rápidos)
5. ✅ Estar anonimizados (sin datos personales)

## 📊 Tamaños de Archivos

| Archivo                          | Tamaño | Uso                 |
| -------------------------------- | ------ | ------------------- |
| WorkoutIndividualSteps.fit       | ~2KB   | Tests básicos       |
| WorkoutRepeatSteps.fit           | ~3KB   | Tests de repetición |
| WorkoutCustomTargetValues.fit    | ~4KB   | Tests de targets    |
| WorkoutRepeatGreaterThanStep.fit | ~5KB   | Tests avanzados     |

## 🚀 Shared Test Utilities

The `@kaiord/core/test-utils` package provides helper functions for loading fixtures:

```typescript
// Available from @kaiord/core/test-utils
import {
  loadFitFixture,
  loadKrdFixture,
  loadKrdFixtureRaw,
  loadFixturePair,
  getFixturePath,
  FIXTURE_NAMES,
} from "@kaiord/core/test-utils";

// Load FIT file as Uint8Array
const fitBuffer = loadFitFixture("WorkoutIndividualSteps.fit");

// Load KRD file as parsed object
const krd = loadKrdFixture("WorkoutIndividualSteps.krd");

// Load KRD file as raw JSON string
const jsonString = loadKrdFixtureRaw("WorkoutIndividualSteps.krd");

// Load both FIT and KRD for round-trip testing
const { fit, krd } = loadFixturePair("WorkoutIndividualSteps");

// Get full path to fixture file
const path = getFixturePath("fit", "WorkoutIndividualSteps.fit");

// Use predefined fixture names
const { fit, krd } = loadFixturePair(FIXTURE_NAMES.INDIVIDUAL_STEPS);
```

## 📝 Mantenimiento

- **Revisar fixtures** cuando el schema KRD cambie
- **Regenerar KRD** si el formato de conversión mejora
- **Validar round-trip** después de cambios en converters
- **Mantener tamaños pequeños** para tests rápidos

## 🔗 Referencias

- [KRD Format Spec](../../../../../../.kiro/steering/krd-format.md)
- [Testing Guidelines](../../../../../../.kiro/steering/testing.md)
- [Garmin FIT SDK](https://github.com/garmin/fit-javascript-sdk)
