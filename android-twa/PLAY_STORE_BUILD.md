# Hisab Dost Android / Play Store build

This directory contains the Trusted Web Activity project for `https://hisab-dost-313.web.app/`.

- Application ID: `com.hisabdost.app`
- App Bundle workflow: `.github/workflows/build-android.yml`
- Upload artifact name: `hisab-dost-release-aab`

## Required GitHub Actions secrets

The workflow intentionally does not store the signing key in Git. In the repository's **Settings → Secrets and variables → Actions**, add these repository secrets:

- `ANDROID_KEYSTORE_BASE64`: base64 contents of the private upload keystore
- `ANDROID_KEYSTORE_PASSWORD`: keystore password
- `ANDROID_KEY_ALIAS`: signing alias
- `ANDROID_KEY_PASSWORD`: signing key password

After adding them, run **Actions → Build Hisab Dost Android App Bundle → Run workflow**. Download the `hisab-dost-release-aab` artifact and upload the `.aab` file to Play Console.

Do not commit `android.keystore`, `.signing-password`, or `keystore.properties`. Keep the upload keystore and passwords backed up securely; future Play Store updates must use the same upload key.

The hosted site includes `/.well-known/assetlinks.json` for the current upload certificate. After Play Console creates the app-signing certificate, add that SHA-256 fingerprint to the same file and redeploy Hosting so the production build opens as a verified Trusted Web Activity.
