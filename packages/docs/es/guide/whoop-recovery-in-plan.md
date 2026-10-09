---
title: "La recuperación de WHOOP en tu plan de entrenamiento"
description: "Lleva la recuperación, la VFC, el sueño y el esfuerzo de WHOOP a Kaiord junto a tus entrenamientos planificados, y pregunta al asistente si apretar o aflojar."
---

# La recuperación de WHOOP en tu plan de entrenamiento

WHOOP te dice cuánto te has recuperado; tu plan te dice qué toca hoy. Kaiord
pone las dos cosas en un mismo sitio, en tu navegador, para que decidas si
mantienes la sesión, la cambias o la haces más suave.

_Read in English: [WHOOP recovery in your training plan](/guide/whoop-recovery-in-plan)._

::: warning Acceso anticipado
La extensión Kaiord WHOOP Bridge **todavía no está publicada** en la Chrome Web
Store. Por ahora solo se puede cargar sin empaquetar desde el
[repositorio de código](https://github.com/pablo-albaladejo/kaiord/tree/main/packages/whoop-bridge).
:::

## Cómo llegan los datos

WHOOP Bridge es una extensión de Chrome de solo lectura. Usa la sesión que ya
tienes abierta en `app.whoop.com`: no hace falta una cuenta de desarrollador de
WHOOP ni una app OAuth, y nunca le das tu contraseña de WHOOP a Kaiord. Con la
extensión instalada, la app de Kaiord sincroniza al abrir el calendario y, cuando
quieras, con **Sincronizar ahora** en **Ajustes → Conexiones**.

Importa:

- **Recuperación**: la puntuación de recuperación, guardada junto a tu VFC
  nocturna (rMSSD)
- **Sueño**, **esfuerzo** (strain) y **constantes** diarias como la frecuencia
  cardíaca en reposo
- series de frecuencia cardíaca, **entrenamientos** (como actividades
  registradas), episodios de estrés y biomarcadores de Advanced Labs

Todo se guarda localmente en tu navegador (IndexedDB). Kaiord no tiene ningún
servidor que lo reciba; consulta la
[política de privacidad](/legal/privacy-policy) (en inglés).

## Dónde aparece la recuperación

- **Diario**: la tarjeta de preparación combina tu puntuación de recuperación
  (VFC) y tu puntuación de sueño, junto a las sesiones planificadas para hoy.
- **Salud → Recuperación**: 90 días de historial de VFC.
- **Calendario**: tus entrenamientos planificados de la semana, con las
  actividades registradas.

## Ajustar el plan

Kaiord **no** cambia tu plan automáticamente cuando la recuperación es baja. El
control es tuyo:

1. Abre el entrenamiento de hoy y elige **Ajustar con IA**.
2. Pide, por ejemplo, "Hoy tengo la recuperación baja, haz esta sesión más
   suave". El asistente puede leer tus registros de recuperación, VFC y sueño.
3. Revisa la propuesta. Los cambios que crean un entrenamiento esperan a que
   pulses **Aprobar**.

El asistente necesita tu propia clave de un proveedor de IA; consulta
[Planifica tu entrenamiento con IA y tu propia clave de API](/es/guide/ai-planning-byok).

## Relacionado

- [Kaiord frente a TrainingPeaks, intervals.icu y Garmin Connect](/es/guide/kaiord-vs-trainingpeaks-intervals-garmin)
