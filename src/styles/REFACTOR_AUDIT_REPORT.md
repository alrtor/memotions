# Memotions Refactor Audit Report

## Scope
This audit covers style architecture across:
- React-level globals: `/Users/khilesh/Desktop/SC's/meme-share-FLAT-20260523-133545/src/index.css`, `/Users/khilesh/Desktop/SC's/meme-share-FLAT-20260523-133545/src/App.css`
- Parity runtime renderer: `/Users/khilesh/Desktop/SC's/meme-share-FLAT-20260523-133545/src/parity/RawHtmlPage.jsx`
- Standalone HTML style blocks:
  - `/Users/khilesh/Desktop/SC's/meme-share-FLAT-20260523-133545/dedicated-meme-creator.html`
  - `/Users/khilesh/Desktop/SC's/meme-share-FLAT-20260523-133545/meme-creator-minimal.html`
  - `/Users/khilesh/Desktop/SC's/meme-share-FLAT-20260523-133545/meme-creator-pro-lite.html`
  - `/Users/khilesh/Desktop/SC's/meme-share-FLAT-20260523-133545/meme-creator-steps.html`
  - `/Users/khilesh/Desktop/SC's/meme-share-FLAT-20260523-133545/meme-creator-splitpane.html`
  - `/Users/khilesh/Desktop/SC's/meme-share-FLAT-20260523-133545/public/offline.html`

## Executive summary
Current UI behavior is functional but style ownership is fragmented. The app currently combines:
- minimal global CSS,
- heavy runtime inline styling in `RawHtmlPage.jsx`,
- per-route style injection,
- isolated static HTML style systems.

This causes inconsistent spacing, alignment drift, modal behavior divergence, and expensive iteration when one UI change should apply globally.

## Measured findings
- `RawHtmlPage.jsx` style/inline injection patterns matched: **209** occurrences.
- `style.cssText` assignments in `RawHtmlPage.jsx`: widespread (toasts, modals, rails, profile blocks, comments UI, kebab menus).
- Runtime `<style>` creation in `RawHtmlPage.jsx`: multiple blocks (`memotions-*style` IDs), often route-scoped.
- Standalone files with their own `<style>` roots: **6** files.
- Global CSS (`src/index.css`, `src/App.css`) currently only provides basic reset/background, not a shared design system.

## Root causes
1. **No canonical design token source in active render path**
   Colors, radii, spacing, borders, and shadows are repeated as raw hex values.

2. **Runtime style mutation as primary mechanism**
   UI is shaped in JS using `style.cssText` rather than reusable classes.

3. **Route-local patching**
   Per-route fixes (`/memotions`, `/own_profile`, `/others_profile`, `/explore`) are applied as isolated hacks instead of composed primitives.

4. **Parallel style universes**
   Static HTML files and parity-rendered routes use overlapping but separate visual systems.

5. **Modal and rail components not standardized**
   Similar UI patterns (post modal, share dialog, report dialog, reaction rails) are implemented multiple times with slightly different behavior and geometry.

## UX impact map
- **Inconsistent vertical rhythm**: card spacing and row gaps vary by route.
- **Modal inconsistency**: opening, close affordances, and sizing differ across contexts.
- **Scroll behavior drift**: feed transitions and peek behavior are sensitive to route-specific CSS.
- **Control alignment instability**: reaction bar, emoji rail, and action icons can desync after local tweaks.
- **Regression risk**: small visual changes in one path break another due to duplicated constants.

## Refactor target architecture
Use a shared style contract anchored to:
- `/Users/khilesh/Desktop/SC's/meme-share-FLAT-20260523-133545/src/styles/memotions-global.css`

### 1. Tokens layer
- Color tokens
- Radius tokens
- Spacing scale
- Border/shadow/z-index tokens
- Layout widths and breakpoints

### 2. Primitive components (CSS class contracts)
- `mem-card`
- `mem-btn`, `mem-btn-primary`, `mem-btn-danger`
- `mem-input`
- `mem-tag`
- `mem-overlay`, `mem-modal`
- `mem-reaction-rail`, `mem-emoji-rail`

### 3. Layout templates
- Feed 3-column template
- Profile grid template
- Explore masonry template
- Settings/utility template

### 4. Interaction standards
- One modal lifecycle and close behavior
- One focus-visible ring system
- One hover/active elevation model
- One scroll/peek pattern for feed cards

## Detailed phased migration plan

### Phase A: Foundation wiring
Goal: make global file authoritative without visual churn.
- Import `memotions-global.css` at app root once.
- Add root scoping class (`memotions-root`) where parity HTML mounts.
- Freeze new inline hex/style additions rule.

Exit criteria:
- All routes load the same token namespace.
- No visual regression beyond 1-2px tolerances.

### Phase B: Modal system unification
Goal: remove modal drift first (highest UX impact).
- Migrate report/share/post modals from inline styles to `mem-overlay` + `mem-modal` primitives.
- Standardize backdrop opacity, radius, close buttons, and z-index tiers.

Exit criteria:
- Modal sizing/placement consistent across feed/profile/explore.
- ESC + backdrop close behavior identical.

### Phase C: Controls and rails
Goal: stabilize action areas and spacing.
- Migrate action buttons, tags, inputs to primitive classes.
- Normalize vertical icon stack spacing/padding/width with rail classes.
- Ensure social action bar and emoji rail use shared geometry.

Exit criteria:
- Same widths and icon spacing on all pages.
- No overlap between primary action stack and emoji stack.

### Phase D: Layout templates
Goal: eliminate route-by-route spacing hacks.
- Move feed/profile/explore layouts to template classes.
- Remove direct JS pixel nudges for margins/paddings where possible.

Exit criteria:
- Card sizes and grid gaps are predictable and route-consistent.
- Right/left rail behavior follows breakpoint templates.

### Phase E: Static HTML convergence
Goal: stop maintaining disconnected style systems.
- Either deprecate standalone creator HTML files or re-skin them with shared tokens.
- Keep only one canonical visual language.

Exit criteria:
- Static routes no longer diverge from app-level design.

## Risk matrix and mitigations
1. **Risk: parity page script assumptions break when classes replace inline styles**
   Mitigation: keep class names additive first; remove inline style in second pass.

2. **Risk: modal layering conflicts**
   Mitigation: reserve z-index tokens and migrate dialogs in descending z-index order.

3. **Risk: route-specific regressions hidden until manual QA**
   Mitigation: maintain per-route visual checklist and capture before/after screenshots.

4. **Risk: perf regressions from repeated DOM rewrites**
   Mitigation: reduce style mutation churn and prefer class toggles.

## Code hygiene rules for refactor
- No new `style.cssText` for reusable components.
- No new hardcoded color hex for shared surfaces/controls.
- Prefer semantic class composition over JS layout mutation.
- Keep temporary compatibility layers explicitly marked with `TODO: remove after migration`.

## Acceptance checklist
- Feed, own profile, other profile, and explore share identical tokenized surfaces.
- Post modal opens from all post contexts using same behavior.
- Reaction rails (social + emoji) use shared spacing and width contract.
- Card corner radius/spacing scale consistent across all grids.
- Scroll transition behavior deterministic across mouse wheel and touchpad.
- Route-specific style IDs in `RawHtmlPage.jsx` reduced substantially.

## Recommended implementation order (practical)
1. Wire global CSS import and root class.
2. Unify post/report/share modals.
3. Unify reaction/social rails.
4. Unify profile + explore card geometry and spacing.
5. Remove redundant injected style blocks from `RawHtmlPage.jsx`.

## Notes
- A starter global style file already exists at:
  `/Users/khilesh/Desktop/SC's/meme-share-FLAT-20260523-133545/src/styles/memotions-global.css`
- This report is the migration blueprint; execution should be checkpointed before each phase.
