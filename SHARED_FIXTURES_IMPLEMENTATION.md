# ✅ Implementación de Fixtures Compartidos

**Fecha**: 2025-01-15  
**Objetivo**: Centralizar fixtures de test para evitar duplicación entre paquetes

---

## 🎯 Problema Resuelto

### Antes

```
packages/
├── core/src/tests/fixtures/
│   ├── WorkoutIndividualSteps.krd
│   └── WorkoutIndividualSteps.fit
├── cli/src/tests/fixtures/
│   ├── WorkoutIndividualSteps.krd (duplicado)
│   └── WorkoutIndividualSteps.fit (duplicado)
└── workout-spa-editor/src/tests/fixtures/
    └── WorkoutIndividualSteps.krd (duplicado)
```

**Problemas**:

- ❌ Duplicación de archivos
- ❌ Inconsistencias entre paquetes
- ❌ Mantenimiento difícil
- ❌ Desperdicio de espacio

### Después

```
packages/
├── core/
│   ├── src/tests/fixtures/          # ← Única fuente de verdad
│   │   ├── fit-files/
│   │   │   ├── WorkoutIndividualSteps.fit
│   │   │   ├── WorkoutRepeatSteps.fit
│   │   │   ├── WorkoutCustomTargetValues.fit
│   │   │   └── WorkoutRepeatGreaterThanStep.fit
│   │   ├── krd-files/
│   │   │   ├── WorkoutIndividualSteps.krd
│   │   │   ├── WorkoutRepeatSteps.krd
│   │   │   ├── WorkoutCustomTargetValues.krd
│   │   │   └── WorkoutRepeatGreaterThanStep.krd
│   │   └── README.md
│   └── src/test-utils/              # ← Helpers compartidos
│       ├── fixtures.ts
│       └── index.ts
├── cli/
│   └── tests/ (usa @kaiord/core/test-utils)
└── workout-spa-editor/
    └── src/test-utils/ (re-exporta de core)
```

**Beneficios**:

- ✅ Sin duplicación
- ✅ Consistencia garantizada
- ✅ Mantenimiento centralizado
- ✅ Fácil de usar

---

## 📦 Archivos Creados

### Core Package

1. **`packages/core/src/tests/fixtures/README.md`**
   - Documentación completa de fixtures
   - Convenciones de nombres
   - Guías de uso
   - Instrucciones para agregar nuevos fixtures

2. **`packages/core/src/test-utils/fixtures.ts`**
   - `loadFitFixture()` - Carga archivos FIT
   - `loadKrdFixture()` - Carga archivos KRD parseados
   - `loadKrdFixtureRaw()` - Carga archivos KRD como string
   - `loadFixturePair()` - Carga par FIT+KRD
   - `getFixturePath()` - Obtiene ruta a fixture
   - `FIXTURE_NAMES` - Constantes con nombres

3. **`packages/core/src/test-utils/index.ts`**
   - Re-exporta todos los helpers

### SPA Editor Package

4. **`packages/workout-spa-editor/src/test-utils/fixtures.ts`**
   - Re-exporta helpers de core (solo KRD)

5. **`packages/workout-spa-editor/src/test-utils/fixtures.test.ts`**
   - Tests de ejemplo
   - Demuestra uso de fixtures compartidos

6. **`packages/workout-spa-editor/SHARED_FIXTURES.md`**
   - Guía de uso para SPA editor
   - Ejemplos de código
   - API reference
   - FAQ

### Configuración

7. **`packages/core/package.json`** (modificado)
   - Agregado export `./test-utils`
   - Incluidos fixtures en `files`

8. **`packages/core/tsup.config.ts`** (modificado)
   - Agregado entry point para test-utils

---

## 🔧 API de Helpers

### `loadKrdFixture(filename: string): KRD`

Carga y parsea un archivo KRD.

```typescript
import { loadKrdFixture, FIXTURE_NAMES } from "@kaiord/core/test-utils";

const krd = loadKrdFixture(`${FIXTURE_NAMES.INDIVIDUAL_STEPS}.krd`);
console.log(krd.version); // "1.0"
```

### `loadFitFixture(filename: string): Uint8Array`

Carga un archivo FIT como buffer.

```typescript
import { loadFitFixture, FIXTURE_NAMES } from "@kaiord/core/test-utils";

const buffer = loadFitFixture(`${FIXTURE_NAMES.INDIVIDUAL_STEPS}.fit`);
const krd = await fitReader.readToKRD(buffer);
```

### `loadFixturePair(baseName: string): { fit, krd }`

Carga un par FIT+KRD para round-trip tests.

```typescript
import { loadFixturePair, FIXTURE_NAMES } from "@kaiord/core/test-utils";

const { fit, krd } = loadFixturePair(FIXTURE_NAMES.INDIVIDUAL_STEPS);
const converted = await fitReader.readToKRD(fit);
expect(converted).toEqual(krd);
```

### `FIXTURE_NAMES`

Constantes con nombres de fixtures.

```typescript
import { FIXTURE_NAMES } from "@kaiord/core/test-utils";

console.log(FIXTURE_NAMES.INDIVIDUAL_STEPS); // "WorkoutIndividualSteps"
console.log(FIXTURE_NAMES.REPEAT_STEPS); // "WorkoutRepeatSteps"
console.log(FIXTURE_NAMES.CUSTOM_TARGET_VALUES); // "WorkoutCustomTargetValues"
console.log(FIXTURE_NAMES.REPEAT_GREATER_THAN); // "WorkoutRepeatGreaterThanStep"
```

---

## 📝 Uso en Tests

### Ejemplo Básico

```typescript
import { describe, expect, it } from "vitest";
import { loadKrdFixture, FIXTURE_NAMES } from "@kaiord/core/test-utils";

describe("FileUpload", () => {
  it("should load workout from fixture", () => {
    // Arrange
    const krd = loadKrdFixture(`${FIXTURE_NAMES.INDIVIDUAL_STEPS}.krd`);

    // Act
    const result = validateWorkout(krd);

    // Assert
    expect(result.success).toBe(true);
  });
});
```

### Ejemplo con Componente

```typescript
import { render, screen } from "@testing-library/react";
import { loadKrdFixture, FIXTURE_NAMES } from "@kaiord/core/test-utils";
import { WorkoutList } from "./WorkoutList";

it("should render workout steps", () => {
  const krd = loadKrdFixture(`${FIXTURE_NAMES.REPEAT_STEPS}.krd`);

  render(<WorkoutList workout={krd.extensions.workout} />);

  expect(screen.getByText(/Step 1/i)).toBeInTheDocument();
});
```

### Ejemplo Round-Trip

```typescript
import { loadFixturePair, FIXTURE_NAMES } from "@kaiord/core/test-utils";

it("should maintain data in round-trip conversion", async () => {
  const { fit, krd } = loadFixturePair(FIXTURE_NAMES.INDIVIDUAL_STEPS);

  // FIT → KRD
  const converted = await fitReader.readToKRD(fit);
  expect(converted).toEqual(krd);

  // KRD → FIT
  const reconverted = await fitWriter.writeFromKRD(krd);
  expect(reconverted).toEqual(fit);
});
```

---

## 🎨 Fixtures Disponibles

| Nombre                 | Archivo                      | Descripción                | Tamaño |
| ---------------------- | ---------------------------- | -------------------------- | ------ |
| `INDIVIDUAL_STEPS`     | WorkoutIndividualSteps       | Steps individuales básicos | ~2KB   |
| `REPEAT_STEPS`         | WorkoutRepeatSteps           | Bloques de repetición      | ~3KB   |
| `CUSTOM_TARGET_VALUES` | WorkoutCustomTargetValues    | Targets personalizados     | ~4KB   |
| `REPEAT_GREATER_THAN`  | WorkoutRepeatGreaterThanStep | Condiciones avanzadas      | ~5KB   |

Cada fixture tiene:

- ✅ Archivo `.fit` (binario)
- ✅ Archivo `.krd` (JSON)
- ✅ Validado contra schema
- ✅ Probado en round-trip
- ✅ Anonimizado

---

## 🚀 Ventajas

### 1. Sin Duplicación

- Un solo lugar para todos los fixtures
- Ahorro de espacio en disco
- Menos archivos que mantener

### 2. Consistencia

- Todos los paquetes usan los mismos datos
- Cambios se propagan automáticamente
- Tests más confiables

### 3. Mantenimiento

- Actualizar una vez, usar en todos lados
- Fácil agregar nuevos fixtures
- Documentación centralizada

### 4. Developer Experience

- API simple y clara
- Constantes tipadas
- Helpers convenientes
- Ejemplos de uso

### 5. Type Safety

- Tipos inferidos automáticamente
- Validación en tiempo de compilación
- Autocompletado en IDE

---

## 📊 Impacto

### Tests Actualizados

- ✅ 3 tests nuevos en SPA editor
- ✅ Todos los tests pasando
- ✅ Sin cambios en tests existentes de core

### Documentación

- ✅ README en fixtures/
- ✅ Guía de uso en SPA editor
- ✅ Ejemplos de código
- ✅ API reference

### Configuración

- ✅ Package.json actualizado
- ✅ Tsup config actualizado
- ✅ Exports configurados
- ✅ Build funcionando

---

## 🔄 Migración

### Para Nuevos Tests

Simplemente importa y usa:

```typescript
import { loadKrdFixture, FIXTURE_NAMES } from "@kaiord/core/test-utils";

const krd = loadKrdFixture(`${FIXTURE_NAMES.INDIVIDUAL_STEPS}.krd`);
```

### Para Tests Existentes

Si tienes fixtures locales duplicados:

1. **Elimina** los fixtures locales
2. **Importa** desde `@kaiord/core/test-utils`
3. **Actualiza** las rutas en los tests

```typescript
// Antes
const krd = JSON.parse(
  readFileSync("./fixtures/WorkoutIndividualSteps.krd", "utf-8")
);

// Después
import { loadKrdFixture, FIXTURE_NAMES } from "@kaiord/core/test-utils";
const krd = loadKrdFixture(`${FIXTURE_NAMES.INDIVIDUAL_STEPS}.krd`);
```

---

## 📚 Referencias

- [Fixtures README](packages/core/src/tests/fixtures/README.md)
- [SPA Editor Guide](packages/workout-spa-editor/SHARED_FIXTURES.md)
- [Testing Guidelines](.kiro/steering/testing.md)
- [KRD Format](.kiro/steering/krd-format.md)

---

## 🎉 Conclusión

Los fixtures ahora están centralizados en `@kaiord/core` con helpers convenientes para uso en todos los paquetes. Esto elimina duplicación, mejora consistencia y facilita mantenimiento.

**Beneficios clave**:

- ✅ Sin duplicación de archivos
- ✅ API simple y tipada
- ✅ Documentación completa
- ✅ Fácil de usar y mantener
- ✅ Tests más confiables

**Próximos pasos**:

1. Migrar tests existentes en CLI (si hay fixtures duplicados)
2. Agregar más fixtures según necesidad
3. Considerar fixtures para otros formatos (TCX, PWX)
