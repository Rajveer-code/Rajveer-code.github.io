# Reference Hero Port + Trajectory Rebuild + fairscope Card — Design Spec

Date: 2026-07-06. Approved by owner in-session.
Scope: `index.html`, `css/home.css`, `js/home.js`, `js/trajectory.js`; delete `js/hero.js`. Nothing else changes.

## 1. Hero — exact port of reference (`portfolio gemini/`)

Source of truth: `portfolio gemini/index.html` hero section + `_astro/App.D9sC4DB2.js` framer-motion specs.

Layout (desktop): top hairline; 1fr/1fr grid; left column = kicker (28px dash + DM Mono line), H1 "Rajveer" + H1 "Singh Pall" in Playfair Display 800 `clamp(3.8rem,10vw,8.5rem)`, line-height 0.9/1.1, letter-spacing 0.02em, color #fafaf8, each inside overflow-hidden mask; Role/Institution meta row (mono labels, DM Sans values); 38px circle icon buttons (mail/GitHub/LinkedIn/Scholar) + pill resume button; bordered status chip with red pulsing dot. Right column = portrait at 74% width right-aligned, aspect 3:4, `object-position 50% 15%`, `filter: grayscale(20%) contrast(1.05)`, bottom dark gradient overlay, mono caption row under photo with hairline. "Scroll" label centered at section bottom. Mobile (≤900): single column, text first then portrait (reference order), name `clamp(2.8rem,10vw,8.5rem)`.

Entrance timings (exact from reference): hairline scaleX 0→1 dur 1.2 ease [.76,0,.24,1]; kicker y30/op0→0/1 delay .3 dur .7; "Rajveer" y105%→0 delay .5 dur .9; "Singh Pall" delay .65 dur .9; meta op0/y20 delay 1.0 dur .7; actions delay 1.2 dur .7; portrait op0/y60 delay .4 dur 1.1. Implemented as CSS keyframe animations gated on `html.hero-go` class, added by `js/home.js` at the moment the loader hides (both fresh-load and session-skip paths). `prefers-reduced-motion`: all elements visible immediately.

Pointer parallax (exact reference transforms, fine pointers only): left column `translate(X*8px, K*5px)`; portrait card `perspective(1000px) rotateY(X*7deg) rotateX(K*-5deg) translate(X*18px, K*12px)`; reset to none on mouseleave. X,K = pointer offset from viewport centre, range −1..1. Reuse existing GSAP quickTo plumbing in home.js with retuned values/targets.

Removed: `js/hero.js` (file + script tag), `.hero-visual` CSS + markup, hero line-art SVG + its CSS/keyframes. field.js starfield remains as the hero background. Site nav bar unchanged. Kicker/status/meta/caption text = current verified content, not reference's.

## 2. Trajectory

- Init fix: replace resize-only recovery with a boot retry loop (timer, ~120ms, until real width) so the Gantt builds on first load; resize handling stays.
- Dates (owner chose estimated spread): Jun 2025 → Jul 2026, no future entries. 14 entries, starts ~1 month apart per track, durations 1–3 months by project weight:
  - system: SereneSpace Jun–Nov '25 · FinSight Nov '25–Jan '26 · FinSight+Web Jan–Mar '26 · ARIA Assistant Apr–Jun '26 · ARIA Audit May–Jun '26 · fairscope Jun–Jul '26
  - research: Diabetes ML Eval Jul–Sep '25 · Mortgage Disparities Sep–Nov '25 · CATE-HMDA Oct–Dec '25 · Federated Diabetes Dec '25–Feb '26 · CPFE Feb–Apr '26 · IndiaFinBench Mar–Jun '26 · ICGDF Apr–Jun '26 · Conviction Ranking May–Jul '26
- Y-axis: YSTART Jun 2025, YEND ~Sep 2026 (bottom padding). Mobile `#trajList` gains fairscope entry; order matches chart.
- Gantt geometry/animations (centered spine, split tracks, lanes, playhead, particle spray, sticky scrub) already match reference `Bn` — untouched.

## 3. Work section — fairscope card

Grid: `.work-grid` → `repeat(6, 1fr)`; normal cards span 2 (top row of 3), fairscope + ARIA span 3 each in second row (ARIA keeps `order:2`-style placement; both keep collapse/expand card behavior). Tablet/mobile overrides keep 2-col/1-col.

fairscope card content (all from `D:\Projects\fairscope` README, v0.3.0): subgroup-stratified, calibration-aware fairness auditing library on PyPI; DeLong CIs per-subgroup AUC, per-subgroup ECE/MCE + reliability, gap significance testing with Bonferroni/BH, subgroup recalibration interface, novel CPFE protocol; 5 modules shipped, 100% line coverage on statistical core, CI green Python 3.9–3.12, MIT. Card links to https://github.com/Rajveer-code/fairscope (no new detail page). Work section headline count references unchanged elsewhere.

## Verification

Per piece in preview (1440 + 375): hero entrance sequence plays once loader hides; parallax matches transforms; no meridian/lineart remnants; trajectory Gantt builds on FIRST load (no resize needed), 14 entries, correct sides/dates; fairscope card renders in both breakpoints, link works; console clean; no other section changed (screenshot diff spot-check).
