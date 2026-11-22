---
"@kaiord/workout-spa-editor": patch
"@kaiord/landing": patch
---

Serve the Kaiord App and the landing with a content security policy. Scripts run only from the site itself, by the hash of each inline script, and from the origins the code already uses (Umami, the Google sign-in client for Drive sync); a script injected into a page does not run. The App connects only to the athlete's Provider APIs, Drive, intervals.icu and Umami.
