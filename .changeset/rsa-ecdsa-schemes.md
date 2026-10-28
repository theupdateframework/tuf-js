---
'@tufjs/models': patch
---

Support RSA-PSS signatures with SHA-384 and SHA-512. Fix ECDSA P-384 verification to use SHA-384 instead of SHA-256, support hex-encoded P-384 keys, and reject ECDSA keys whose curve does not match their scheme.
