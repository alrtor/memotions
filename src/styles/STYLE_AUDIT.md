# Memotions Style Audit (HTML + JSX)

## Current style sources
- `src/index.css`: minimal global reset (`box-sizing` only).
- `src/App.css`: base full-page layout reset/background.
- `src/parity/RawHtmlPage.jsx`: primary styling driver, with large runtime inline CSS via `style.cssText`, injected modal markup, and route-specific `<style>` injection.
- Standalone HTML files (creator variants + `public/offline.html`): each ships separate in-file `<style>` blocks and palette tokens.

## Main duplication patterns
1. Same purple/dark palette repeated as hardcoded hex values.
2. Modal + overlay styles repeated in inline templates.
3. Button/input/tag geometry repeated with slight deltas.
4. Reaction rails (post actions + emoji rail) repeated in multiple route patches.
5. Sidebar/feed layout spacing tuned per route via direct JS style mutations.

## Dedicated shared file
- New file: `src/styles/memotions-global.css`
- Purpose: single source for tokens + reusable primitives so route patches can migrate from inline styles to classes.

## Migration plan (safe, incremental)
1. Import `memotions-global.css` once in app shell.
2. Replace modal inline styles first (`openMemReportDialog`, share dialog).
3. Replace toast and button/input styles.
4. Move reaction rails to `.mem-reaction-rail` and `.mem-emoji-rail` classes.
5. Collapse route-specific layout hacks into `.mem-layout-3col` + route modifiers.

## Rules for later refactor
- No new hardcoded color hex in runtime-generated `style.cssText`.
- Prefer class toggles (`is-open`, variant classes) over mutating many style properties in JS.
- Keep route overrides as small modifier classes; avoid one-off style IDs unless temporary.
