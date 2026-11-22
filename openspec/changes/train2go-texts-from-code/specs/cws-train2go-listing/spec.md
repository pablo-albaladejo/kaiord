## MODIFIED Requirements

### Requirement: Train2Go Bridge store listing documentation

The train2go-bridge package SHALL include a `store-listing.md` file containing the extension name, short description (max 132 characters), detailed description with features and privacy notes, and metadata (category, privacy policy URL, website, support URL, publisher). Its Short and Detailed Description SHALL be a registered claims surface (`claims/train2go.json`, see `public-claims`), and the short description SHALL equal `extDescription`.

#### Scenario: Store listing file exists with required fields

- **WHEN** the `packages/train2go-bridge/store-listing.md` file is read
- **THEN** it SHALL contain: extension name, short description, detailed description, and metadata section with category, privacy policy URL, website, support URL, and publisher

### Requirement: Train2Go Bridge privacy justification

The train2go-bridge package SHALL include a `privacy-justification.md` file explaining why each declared permission is required, together with the single purpose and the remote-code answer of the Chrome Web Store privacy form. It SHALL be a registered claims surface.

#### Scenario: Privacy justification covers all manifest permissions

- **WHEN** the `packages/train2go-bridge/privacy-justification.md` file is read
- **THEN** it SHALL document the `storage` permission, the `https://app.train2go.com/*` host permission, the `kaiord-announce.js` content script, the `externally_connectable` matches, the single purpose and the remote-code answer

## REMOVED Requirements

### Requirement: Train2Go Bridge CWS privacy practices

**Reason**: The file described `tabs` and `scripting` permissions and a Train2Go content script the extension no longer has, and was not a registered surface, so nothing failed when it went false. A second copy of the same answers is a second place to go stale.

**Migration**: The single purpose, permission justifications and remote-code answer live in `privacy-justification.md`, which is registered in `claims/train2go.json`. `cws-privacy-practices.txt` is deleted.
