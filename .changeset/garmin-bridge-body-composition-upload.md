---
"@kaiord/garmin-bridge": minor
---

Add a `push-body-composition` action that uploads a FIT file (received from the
editor as a base64 string or byte array) to Garmin Connect as multipart
form-data via `POST /upload-service/upload/.fit` with `Authorization: Bearer`
and no cookies (`credentials:"omit"`). The Bearer transport — JSON and multipart
bodies, status→envelope, and the 401→re-mint retry that now flags `needsReauth`
on a repeated 401 — is extracted into the identity-free `bearer-fetch`
bridge-core master; all Garmin identity (consumer keys, URLs, OAuth1 signer,
mint/exchange) stays in `garmin-oauth.js`. The bridge declares the new
`write:body` capability and allowlists only `POST /upload-service/upload`.
