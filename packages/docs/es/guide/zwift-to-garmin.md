---
title: "Entrenamientos de Zwift en tu Garmin: de ZWO a FIT o Garmin Connect"
description: "Lleva un entrenamiento .zwo de Zwift a tu reloj o ciclocomputador Garmin: conviértelo a FIT en el navegador o envíalo a Garmin Connect con Kaiord Garmin Bridge."
---

# Entrenamientos de Zwift en tu Garmin

Has creado (o descargado) un entrenamiento estructurado para Zwift y quieres
hacerlo en exterior con un dispositivo Garmin. Zwift guarda los entrenamientos
como archivos `.zwo`; los dispositivos Garmin leen entrenamientos FIT, y Garmin
Connect tiene su propio formato. Kaiord convierte entre ellos en tu navegador,
sin cuenta y sin subir el archivo a ningún servidor.

_Read in English: [Zwift workouts on your Garmin](/guide/zwift-to-garmin)._

## Opción 1: convertir el archivo (sin extensión)

1. Abre el [conversor de ZWO a FIT](https://kaiord.com/app/#/convert?from=zwo&to=fit).
2. Elige tu archivo `.zwo`. Se procesa en el navegador y nunca se sube.
3. **FIT** ya viene seleccionado como formato de exportación. Pulsa **Descargar un archivo**.

La página solo convierte: no añade nada a tu calendario ni a tu biblioteca de
Kaiord, y no toca el entrenamiento que tengas abierto en el editor. Qué hagas
después con el archivo `.fit` (copiarlo al dispositivo, importarlo en otra
plataforma) depende de ti y de tu dispositivo.

## Opción 2: enviarlo a Garmin Connect

La extensión de Chrome
[Kaiord Garmin Bridge](https://chromewebstore.google.com/detail/kaiord-garmin-bridge/innelncjhkdokailkinkchppgekennoe)
envía entrenamientos estructurados desde la app de Kaiord a tu cuenta de Garmin
Connect y puede colocarlos en un día del calendario de Garmin Connect, desde
donde se sincronizan con tu dispositivo.

1. Instala la extensión e inicia sesión en
   [Garmin Connect](https://connect.garmin.com/) en el mismo navegador. La
   extensión usa esa sesión; nunca escribes tu contraseña de Garmin en Kaiord.
2. En la [app de Kaiord](https://kaiord.com/app/), importa el archivo `.zwo`
   (se abre en el editor, donde puedes ajustar pasos y objetivos).
3. Pulsa **Enviar a Garmin**. Una vez enviado, el entrenamiento aparece como
   **En tu Garmin**.

## Qué se conserva en la conversión

Los objetivos de ZWO son potencia en porcentaje del FTP, y FIT los mantiene en
porcentaje, así que tu dispositivo aplica su propio FTP. Se conservan los
bloques de potencia constante, las rampas de calentamiento y vuelta a la calma
(como un rango de potencia), los intervalos y las secciones libres; los
mensajes de texto en pantalla de Zwift no tienen equivalente en FIT y se
descartan. La tabla completa, campo a campo, está en las páginas
[ZWO to FIT](/convert/zwo-to-fit) y [ZWO to Garmin](/convert/zwo-to-garmin)
(en inglés).

## Desde la línea de comandos

Si programas, puedes automatizar la misma conversión con la
[CLI de Kaiord](/cli/commands):

```bash
pnpm add -g @kaiord/cli
kaiord convert -i workout.zwo -o workout.fit
```

## Relacionado

- [Entrenamientos y actividades](/convert/#workouts-vs-activities) (en inglés):
  esta guía trata de entrenamientos planificados, no de salidas registradas
- [Planifica tu entrenamiento con IA y tu propia clave de API](/es/guide/ai-planning-byok)
