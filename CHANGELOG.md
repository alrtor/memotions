# Changelog

## Memotions v2 (latest)

### Core migration and parity
- Converted legacy multi-page HTML app into React/Vite parity routing.
- Preserved original page surfaces while centralizing behavior in `src/parity/RawHtmlPage.jsx`.
- Standardized sidebar/header/footer behavior across pages.

### Navigation and layout
- Added consistent left sidebar links for:
  - For You
  - GIF Feed
  - Trending
  - Creators
  - Activity
  - Create
  - Upload Meme
  - Hall of Fame
  - Settings
- Added bottom policy links (`About`, `Help`, `Terms`, `Privacy`, `Cookies`) in sidebar.
- Added sidebar profile card and logout button.
- Added responsive mobile brand bar + bottom nav.

### Post interactions and modal system
- Unified post-opening modal behavior across:
  - Profile
  - Own profile
  - Other profile
  - For You
  - Trending
  - Hall of Fame
- Added consistent modal open/close with `Esc` support.
- Fixed repeated-like increment logic in post modal (toggle behavior).
- Enabled Enter-to-post in comment input.
- Improved modal rendering for small screens and preserved input visibility.

### Share flow
- Replaced share popup with `share.html`-style modal layout.
- Bound share modal to currently interacted post payload.
- Added platform icon buttons:
  - WhatsApp, Instagram, Twitter, Facebook, Reddit, Telegram, Discord, Copy Link
- Wired original interaction values into share modal stats (`likes`, `comments`, `shares`).
- Updated share modal left pane to match own-profile-style full media rendering.

### Create / Upload / profile feed integration
- Added top action behavior for create/notification/upload actions.
- Implemented upload modal using create-container styling.
- Added image preview and confirmation in upload flow.
- Fixed upload modal overflow/responsiveness on small screens.
- Ensured created/uploaded posts are stored and surfaced in profile as newest first.
- Fixed saved tab contamination: created/uploaded posts no longer appear in saved unless explicitly saved.
- Ensured saved tab displays newest saved items first.

### Trending / feed behavior
- Fixed trending cards opening dedicated modal.
- Corrected modal data extraction for creator/likes/comments on trending and feed cards.
- Fixed For You side-gap/background alignment issues.
- Added mobile one-post snap behavior for For You feed.
- Improved reaction rail responsiveness and overlap handling on mobile.

### Auth (demo)
- Added demo auth gate with login/signup modal based on original `auth.html` style.
- Auth-required actions enforced for:
  - Like
  - Reactions
  - Create
  - Upload
  - Comment
- Added dummy/demo login support and Google demo path.
- Added logout action in sidebar (red button styling).

### Theming and utility improvements
- Added global light/dark theme propagation via settings.
- Removed duplicate top nav on selected policy/settings pages where requested.
- Added profile avatar change support on own profile.

### Build and packaging
- Verified builds repeatedly with `npm run build`.
- Prepared shareable zips with filtered contents:
  - Excluded `.git`, `node_modules`, `dist`
  - Excluded markdown files when requested
  - Excluded specified extra creator HTML files when requested

---

## Notes
- This changelog reflects the latest integrated state of the React parity project.
- Runtime data is currently localStorage-backed (demo-level persistence).
