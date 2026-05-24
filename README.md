# Memotions (Launchable Build)

Memotions is a React + Vite meme social product with legacy page parity plus persistent cross-page social interactions.

## Product Features
- Legacy-compatible routed pages converted into React routes.
- Persistent local social state via `public/bridge.js`:
  - session auth
  - post creation
  - like/share/save/comment
  - notifications feed
  - follow/unfollow
- Missing legacy route support (`/profile`) added.
- Data backup tooling in Settings (export/import/reset local data).

## Launch Readiness Added
- SEO/OpenGraph/Twitter metadata in `index.html`.
- PWA manifest: `public/manifest.webmanifest`.
- Service worker offline support: `public/sw.js`, `public/offline.html`.
- SPA routing support via `public/_redirects`.
- Security headers template via `public/_headers`.
- Robots + sitemap: `public/robots.txt`, `public/sitemap.xml`.

## Run
```bash
npm install
npm run dev
```

## Production Build
```bash
npm run build
npm run preview
```

## Deploy Notes
- Replace `https://memotions.app` in `index.html` and `public/sitemap.xml` with your actual domain.
- Ensure host supports SPA rewrites (`_redirects` file already included for Netlify-style hosts).
- If hosting on Vercel, also configure rewrite to `/index.html` for all routes.

## Launch Checklist
- Verify all core routes: `/memotions`, `/create`, `/comments`, `/share`, `/notifications`, `/profile`, `/settings`.
- Test backup export/import from Settings.
- Verify mobile viewport on iOS and Android.
- Check offline fallback by disabling network after first visit.
- Run Lighthouse and fix any host-specific warnings.
