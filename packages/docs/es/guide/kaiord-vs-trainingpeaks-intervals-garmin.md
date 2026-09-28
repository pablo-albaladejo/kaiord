---
title: "Kaiord frente a TrainingPeaks, intervals.icu y Garmin Connect"
description: "Una comparación honesta y con fuentes de Kaiord con TrainingPeaks, intervals.icu y el creador de entrenamientos de Garmin Connect: precio, editor, envío a Garmin, datos y código."
---

# Kaiord frente a TrainingPeaks, intervals.icu y Garmin Connect

TrainingPeaks, intervals.icu y Garmin Connect son plataformas consolidadas.
Kaiord es un proyecto de código abierto joven y con otro planteamiento: se
ejecuta en tu navegador, guarda tus datos ahí y no necesita cuenta. Esta página
compara lo que ofrece cada uno, con una fuente para cada afirmación sobre otro
producto. Los precios y los planes cambian; revisa las páginas enlazadas antes
de decidir.

_Read in English: [Kaiord vs TrainingPeaks, intervals.icu and Garmin Connect](/guide/kaiord-vs-trainingpeaks-intervals-garmin)._

## De un vistazo (a fecha de 2026-09-28)

|                                             | Kaiord                                                         | TrainingPeaks                                                                          | intervals.icu                                            | Garmin Connect                                   |
| ------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------ |
| Precio                                      | Gratis, licencia MIT                                           | Premium 19,95 US$/mes o 134,99 US$/año [^tp]; nivel Basic gratuito [CONFIRMAR: fuente] | Gratis; plan opcional de apoyo de 4 US$/mes [^iv]        | Gratis; Connect+ opcional por 6,99 US$/mes [^gc] |
| Editor de entrenamientos estructurados      | Sí                                                             | Sí [^tpwb]                                                                             | Sí, en el nivel gratuito [^iv]                           | Sí [^gcwb]                                       |
| Enviar entrenamientos planificados a Garmin | Sí, con la extensión Garmin Bridge                             | Figura como función Premium: "Sync planned workouts to your device" [^tp]              | Sí, "Upload planned workouts" [^ivgc] [CONFIRMAR: nivel] | Sí, de forma nativa [^gcsend]                    |
| Exportar el entrenamiento a archivo         | FIT, TCX, ZWO, Garmin Connect, KRD                             | [CONFIRMAR: formatos y fuente]                                                         | [CONFIRMAR: formatos y fuente]                           | [CONFIRMAR: formatos y fuente]                   |
| IA                                          | Con tu propia clave (Anthropic, OpenAI, Google)                | [CONFIRMAR]                                                                            | [CONFIRMAR]                                              | "Active Intelligence" en Connect+ [^gc]          |
| Cuenta y datos                              | Sin cuenta; los datos se quedan en tu navegador                | [CONFIRMAR: fuente]                                                                    | [CONFIRMAR: fuente]                                      | [CONFIRMAR: fuente]                              |
| Código fuente                               | Abierto ([GitHub](https://github.com/pablo-albaladejo/kaiord)) | [CONFIRMAR: fuente]                                                                    | [CONFIRMAR: fuente]                                      | [CONFIRMAR: fuente]                              |

La columna de Kaiord se puede comprobar en su
[política de privacidad](/legal/privacy-policy) (en inglés) y en su código
fuente.

## Dónde los demás son más fuertes

- **Análisis e historial.** intervals.icu incluye en su nivel gratuito
  seguimiento de forma, fatiga y estado, análisis de actividades y curvas de
  potencia [^iv]; TrainingPeaks Premium incluye análisis de entrenamientos y
  seguimiento de la forma [^tp]. Los análisis de Kaiord son mucho más limitados.
- **Entrenadores.** TrainingPeaks vende entrenamiento personal y planes [^tp];
  el plan de apoyo de intervals.icu incluye equipos y organizaciones de
  entrenadores [^iv].
- **Integración nativa con el dispositivo.** Garmin Connect envía los
  entrenamientos a tu dispositivo Garmin directamente [^gcsend]; Kaiord
  necesita una extensión del navegador para llegar a Garmin Connect.
- **Móvil.** Garmin Connect tiene app móvil [^gcapp]; Kaiord es una app web.

## En qué es distinto Kaiord

- **Sin cuenta, datos locales.** No se envía nada a un servidor de Kaiord; la
  app guarda tu plan, tus entrenamientos y tus registros de salud en el
  navegador.
- **Conversión de formatos.** Cualquier entrenamiento se puede exportar a FIT,
  TCX, ZWO, JSON de Garmin Connect y KRD, y las mismas conversiones están
  disponibles como [CLI](/cli/commands), [SDK de TypeScript](/guide/quick-start)
  y [servidor MCP](/mcp/tools) (en inglés).
- **Tu propia clave de IA.** Consulta
  [Planifica tu entrenamiento con IA y tu propia clave de API](/es/guide/ai-planning-byok).
- **Código abierto.** Licencia MIT; puedes leer y cambiar cada línea.

## Usarlos juntos

Kaiord no tiene por qué sustituir nada. Puedes crear un entrenamiento en Kaiord
y [exportarlo](/convert/) (en inglés) como un archivo que otra plataforma
importe, o [llevar un entrenamiento de Zwift a Garmin](/es/guide/zwift-to-garmin).
Hoy Kaiord no se sincroniza con intervals.icu.

## Fuentes

Consultadas el 2026-09-28.

[^tp]: TrainingPeaks, [Pricing for athletes](https://www.trainingpeaks.com/pricing/for-athletes/).

[^tpwb]: TrainingPeaks, [Introducing the TrainingPeaks Workout Builder](https://www.trainingpeaks.com/learn/articles/introducing-trainingpeaks-workout-builder/).

[^iv]: intervals.icu, [Pricing](https://www.intervals.icu/pricing/).

[^ivgc]: Anuncio en el foro de intervals.icu, [Upload planned workouts to Garmin Connect](https://forum.intervals.icu/t/upload-planned-workouts-to-garmin-connect/1521).

[^gc]: Garmin, [Elevate your health and fitness goals with Garmin Connect+](https://www.garmin.com/en-US/newsroom/press-release/wearables-health/elevate-your-health-and-fitness-goals-with-garmin-connect/) (precio de lanzamiento; "All existing features and data in Garmin Connect will remain free").

[^gcwb]: Soporte de Garmin, [Creating a Custom Workout in Garmin Connect](https://support.garmin.com/en-US/?faq=wZ52AaLbLG2GC1Lxu2l4k7).

[^gcsend]: Soporte de Garmin, [How to Send Workouts to a Garmin Device](https://support.garmin.com/en-US/?faq=Oyqt6jUjOF8L1Rnuc9Sms8).

[^gcapp]: Garmin, [Garmin Connect Mobile App](https://www.garmin.com/en-US/p/125677/).
