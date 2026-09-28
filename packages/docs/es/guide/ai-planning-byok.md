---
title: "Planifica tu entrenamiento con IA y tu propia clave de API"
description: "Usa el asistente de Kaiord en el navegador con tu propia clave de Anthropic, OpenAI o Google: genera entrenamientos estructurados, ponlos en el calendario y pregunta por tus datos."
---

# Planifica tu entrenamiento con IA y tu propia clave de API

El asistente de Kaiord funciona con **tu propia clave de API** ("trae tu propia
clave"). No hay suscripción de Kaiord ni un servidor de Kaiord de por medio: la
app se ejecuta en tu navegador y llama directamente al proveedor de modelos que
elijas.

_Read in English: [Plan your training with AI using your own API key](/guide/ai-planning-byok)._

## 1. Añade un proveedor

Abre **Ajustes → IA → Proveedor y modelos** en la
[app de Kaiord](https://kaiord.com/app/#/settings/ai?section=providers) y añade
un proveedor con su clave de API. Hay tres proveedores disponibles:
**Anthropic** (Claude), **OpenAI** (GPT) y **Google** (Gemini). Puedes elegir un
modelo por defecto y, si quieres, otro distinto para cada tarea (chat,
generación de entrenamientos, extracción de analíticas); un campo de texto libre
admite identificadores de modelo más nuevos que la lista incluida.

## 2. Genera o programa entrenamientos

- **Crea un entrenamiento a partir de una descripción.** Describe la sesión con
  tus palabras ("60 min de rodaje en bici con 3 × 10 min en sweet spot") y pulsa
  **Generar entreno**. El resultado es un entrenamiento estructurado que puedes
  retocar paso a paso en el editor, enviar a Garmin o exportar como FIT, TCX,
  ZWO o Garmin Connect.
- **Pregunta al asistente.** El chat puede leer tus entrenamientos, tu plan de
  entrenador y tus registros de salud, y puede crear un entrenamiento en una
  fecha. Las acciones que cambian tus datos (crear un entrenamiento, registrar
  una métrica de salud, enviar a Garmin) esperan a que pulses **Aprobar**.
- **Ajusta una sesión existente.** En un entrenamiento, **Ajustar con IA** abre
  el chat con ese entrenamiento ya indicado para que pidas los cambios.

Las conversaciones se guardan por perfil en tu navegador y se pueden buscar.

## Privacidad y coste

- Tu clave y tus conversaciones se guardan en tu navegador (IndexedDB). La
  [política de privacidad](/legal/privacy-policy) (en inglés) describe qué se
  envía: tus mensajes, y resúmenes de los datos que lee el asistente, van desde
  tu navegador al proveedor que configuraste, solo mientras chateas.
- La clave guardada está ofuscada, no protegida de forma robusta: cualquiera con
  acceso a tu perfil del navegador puede recuperarla. Si activas la
  sincronización con Google Drive sin cifrado, la app te avisa de que las claves
  se subirían en texto plano. **Ajustes → Privacidad** tiene un botón para
  borrar todas las claves guardadas.
- Pagas directamente a tu proveedor. **Ajustes → IA → Uso** muestra los tokens
  por mes y un coste **estimado**; la factura de tu proveedor es la referencia.

## Usar Kaiord desde otro asistente de IA

El [servidor MCP de Kaiord](/mcp/tools) (en inglés) permite a los asistentes
compatibles con el Model Context Protocol (Claude Desktop, Claude Code y otros)
convertir, validar e inspeccionar archivos de entrenamiento. Solo trabaja con
archivos; no accede al calendario ni a los datos de salud guardados en la app.

## Relacionado

- [Entrenamientos de Zwift en tu Garmin](/es/guide/zwift-to-garmin)
- [La recuperación de WHOOP en tu plan de entrenamiento](/es/guide/whoop-recovery-in-plan)
- [Kaiord frente a TrainingPeaks, intervals.icu y Garmin Connect](/es/guide/kaiord-vs-trainingpeaks-intervals-garmin)
