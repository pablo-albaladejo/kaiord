---
"@kaiord/core": patch
"@kaiord/fit": patch
"@kaiord/tcx": patch
"@kaiord/zwo": patch
"@kaiord/all": patch
"@kaiord/cli": patch
---

feat: add Node.js 24 Active LTS support

Add comprehensive Node.js 24.x (Active LTS) support to all packages and CI workflows while maintaining backward compatibility with Node.js 20.x and 22.x.

**Changes:**

- Add Node.js 24.x to CI test matrices (lint, test, test-frontend)
- Upgrade @types/node from ^20.11.0 to ^24.0.0 across all packages
- Update deployment workflows to use Node.js 24.x (release, deploy-spa-editor, security)
- Update documentation to recommend Node.js 24.x as the preferred version
- Maintain Node.js >=20.0.0 engine requirement for backward compatibility

**Breaking Changes:** None
