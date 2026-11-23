---
"@kaiord/workout-spa-editor": minor
"@kaiord/docs": patch
---

The first time health data would go to a Provider, the Kaiord App stops before sending, names the Provider and each kind of health data, and asks: send this time, always allow that Provider, or don't send. With "don't send" the assistant answers without the athlete's health data (and without its earlier answers that used it), a workout is generated without the heart-rate threshold and zones, and a lab document is not sent. The answer is kept per Provider in this browser and can be changed in Settings, Privacy, which now lists every destination data can leave the device for, drawn from the code that sends it, with whether each one is set up. The privacy policy says the same.
