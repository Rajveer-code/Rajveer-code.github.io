# Portfolio Elevation — Design Spec

Date: 2026-07-06
Scope: full site — `index.html` + all 13 `project-*.html` detail pages.
Direction: refine current brand (black + gold, Playfair Display / DM Mono). No palette swap, no font swap, no section removals.

## Goal

Elevate the site across four dimensions the owner selected:

1. Scroll & animation feel
2. Visual design elevation (typography, spacing, micro-detail)
3. Page transitions & navigation (homepage ↔ detail pages)
4. Content & storytelling flow

Constraint set: vanilla HTML/CSS/JS, no bundler. All content claims must remain traceable to verified sources (see memory `verified_owner_content`) — zero invented numbers or facts. Preserve existing signature systems: field.js constellation, trajectory Gantt (`js/trajectory.js`), research spiral (`js/spiral.js`), Gold & Glory marquee, loader, mobile overlay nav.

## Decision already made

**Hero Spline is removed.** The `spline-viewer` script, `prod.spline.design` / `unpkg.com` preconnects, `#heroSpline` skeleton, and the 20s load-cap logic in `js/home.js` all go. Replacement: a bespoke native canvas/WebGL hero visual — flowing gold particle/line system, same visual language as field.js and the hero line-art, zero network dependency, pointer-reactive (gated to fine pointers), `prefers-reduced-motion` → static composition. Built with the same perf discipline as field.js: no deps, capped DPR, no `shadowBlur` in the hot loop. Loader hard cap drops 2.4s → ~0.9s since there is no longer a heavy scene to mask.

## Architecture: seven ordered passes + one optional cleanup, one commit each

Each pass is independently verifiable in the preview browser before its commit.

### Pass 1 — Audit (no site changes)

Run the site (`python devserver.py`, port 8124). Measure: long frames while scrolling full page, layout shifts, console errors, per-section screenshots at 1440 / 768 / 375. Deliverable: a short findings list ranked by severity that tunes priorities inside passes 2–7, plus 2–3 sketched hero-visual variants (as screenshots) for the owner to pick from.

### Pass 2 — Hero rebuild

Remove Spline (as above). Add new hero visual as its own file `js/hero.js` (same load pattern as field.js). Shorten loader cap. Verify: hero paints instantly on reload, no network requests to spline.design/unpkg, no console errors, reduced-motion shows static frame.

### Pass 3 — Motion unification

One motion token set — easing curves, duration steps, stagger values — defined once as CSS custom properties and mirrored in JS constants; consumed by both `css/home.css` and `css/style.css`, `js/home.js` and `js/detail.js`. Audit every reveal, hover, and scrub against the tokens. Lenis config identical on both page types. Verify: scroll full homepage and 2 detail pages — reveals fire on time, no pops, hover states consistent.

### Pass 4 — Type & spacing

Consistent modular type scale and baseline spacing rhythm applied to both stylesheets. Section-head treatment unified (kicker / headline / lede pattern). Playfair Display and DM Mono stay. Verify: side-by-side screenshots before/after per section; no overflow at 375.

### Pass 5 — Page transitions

Cross-document View Transitions API: `@view-transition { navigation: auto }` in both CSS files, `view-transition-name` on persistent chrome (nav/back-link region). Non-supporting browsers: 200ms opacity fade on navigation via existing JS infra. Verify in Chrome: homepage → detail → back feels continuous; Firefox degrades to fade without errors.

### Pass 6 — Detail-page parity

All 13 detail pages brought to homepage polish: motion tokens, type scale, spacing from passes 3–4 applied to `css/style.css`; back-link chrome consistent; reveal quality equal to homepage. Verify: 3 representative pages (heaviest, lightest, newest) at 3 breakpoints.

### Pass 7 — Content flow

Top-to-bottom narrative pass on homepage: section order sanity check, heads and ledes tightened, transitions between sections read as one argument. Copy edits only — every factual claim keeps its verified source; no new numbers. Detail pages: intro/lede consistency only, not full rewrites. Verify: full read-through; grep repo for `href="#"`, placeholder text, TODO markers.

### Pass 8 (optional, execute-time confirm) — Root cleanup

Candidates: 21 one-off python mutator scripts, `index_backup_traj.html`, `index_stack_backup.html`, `css/home_backup_traj.css`, `css/home_stack_backup.css`, `js/home_stack_backup.js`, `current-desktop.png`, `current-mobile.png`, orphaned `js/traj-spiral.js`, stale `INTEGRATION_NOTES.md`, `_previous_version/`. **`portfolio gemini/` is kept** — it is the live reference source. Nothing is deleted without a listed manifest confirmed by the owner at execution time.

## Error handling / risk controls

- Desktop regression check at 1440 / 768 / 375 after every pass; baseline = current zero-horizontal-overflow state.
- Trajectory Gantt and Research spiral internals untouched — token alignment only. If trajectory ever renders single-column-left on desktop, the wrong layout fn was used (known gotcha).
- Preview harness gotchas (from memory): `innerWidth` can read 0 after reload → use explicit `preview_resize`; deep-scroll screenshots can time out → hide `#field` / `#gl-research` first; recover `chrome-error://` with `location.assign`.
- Asset cache-busting: bump `?v=` query on every changed css/js file, every pass.

## Testing

Per-pass verification steps listed above, run in the preview browser before each commit. Final gate: full-site pass — console clean, no dead links, all 13 detail pages open from their entry points, mobile 375 and desktop 1440 screenshots archived.

## Out of scope

- New sections, new pages, new content claims.
- Palette or font changes.
- Rebuilding trajectory/spiral/field systems.
- SPA conversion or build tooling.
