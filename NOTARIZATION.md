# macOS signing and notarization

Markd releases are signed with a Developer ID Application certificate, submitted to Apple's notary service by Tauri, and stapled before distribution.

## 1. Install the signing certificate

In Apple Developer, create a **Developer ID Application** certificate using a certificate signing request from this Mac. Download and install the certificate in the login keychain.

Confirm that the certificate and its private key are available:

```bash
security find-identity -v -p codesigning
```

Copy the complete identity, including the team name and ID:

```bash
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAMID)"
```

Do not use an Apple Development, Apple Distribution, or ad-hoc identity for direct downloads.

## 2. Configure notarization credentials

The App Store Connect API key flow is recommended for releases. Create a key with Developer access in App Store Connect under **Users and Access → Integrations**, then set:

```bash
export APPLE_API_ISSUER="issuer-id"
export APPLE_API_KEY="key-id"
export APPLE_API_KEY_PATH="$HOME/.private_keys/AuthKey_key-id.p8"
```

The private key can only be downloaded once. Keep it outside the repository. `.p8`, `.p12`, `.key`, and environment files are ignored by Git.

Alternatively, use an Apple ID with an app-specific password:

```bash
export APPLE_ID="you@example.com"
export APPLE_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="team-id"
```

## 3. Verify the environment

```bash
bun run release:check
```

The check rejects ad-hoc signing, Apple Development certificates, missing private keys, and partial notarization credentials.
It also requires `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, because a release without a signed updater archive must not be published.

## 4. Release

```bash
bun run release -- 0.1.7 --type=feature "Release notes"
```

The release script removes stale artifacts and builds the app without submitting an intermediate bundle for notarization. It then applies the final Developer ID signature, notarizes and staples that exact app, creates a fresh updater archive from it, and signs the archive. Only then does it create and notarize the DMG. The script verifies the app and DMG with `codesign`, `hdiutil`, `stapler`, and Gatekeeper before generating updater metadata.

If DMG creation or notarization fails after the app has passed verification, resume without rebuilding it:

```bash
bun run release -- 0.1.7 --type=feature --resume "Release notes"
```

The resume path validates the existing app version, signature, notarization ticket, updater archive, and updater signature before using them. If Tauri's DMG command fails, the release automatically retries with Tauri's generated `create-dmg` helper.

Never use `--skip-stapling` for a public release.
