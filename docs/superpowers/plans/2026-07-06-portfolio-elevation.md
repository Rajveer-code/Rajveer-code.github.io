# Portfolio Elevation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the portfolio site (homepage + 13 detail pages) across scroll feel, visual design, page transitions, and content flow — replacing the Spline hero with a native canvas visual.

**Architecture:** Vanilla HTML/CSS/JS static site, no bundler. Homepage = `index.html` + `css/home.css` + `js/home.js`/`field.js`/`spiral.js`/`trajectory.js`. Detail pages = 13 × `project-*.html` + `css/style.css` + `js/detail.js`/`field.js`. Eight ordered passes, one commit each, verified in the preview browser (`python devserver.py`, port 8124) before each commit.

**Tech Stack:** Canvas 2D, GSAP + ScrollTrigger, Lenis, cross-document View Transitions API.

**Spec:** `docs/superpowers/specs/2026-07-06-portfolio-elevation-design.md`

**Verification stack (every task):** `preview_start` server "portfolio" → `preview_resize` explicit 1440×900 (never trust default width — harness reports `innerWidth` 0/2 after reload) → check `preview_console_logs level:error` → `preview_screenshot`. For deep-scroll screenshots hide `#field`/`#gl-research` via eval first. Recover `chrome-error://` with `location.assign('http://127.0.0.1:8124/')`.

**Cache-bust rule:** every changed CSS/JS file gets its `?v=` bumped in every HTML file that references it, same commit.

**Content rule:** zero new factual claims anywhere. Copy edits only rephrase already-verified content (memory `verified_owner_content`).

---

### Task 1: Audit — findings list + hero variant choice

**Files:** none modified (report only).

- [ ] **Step 1: Start server + baseline screenshots.** `preview_start` "portfolio". Resize 1440×900. Screenshot each homepage section (hero, creds, about, trajectory, impact, work, research, stack, contact) by `preview_eval` `document.querySelector('#about').scrollIntoView()` etc., then 375×812 pass, then 2 detail pages (project-aria.html, project-conviction-ranking.html).
- [ ] **Step 2: Perf + error sweep.** `preview_console_logs` (all levels). `preview_eval` long-frame probe:

```js
(() => { const longs = []; let last = performance.now();
  return new Promise(res => { let n = 0;
    function tick(t){ if (t - last > 34) longs.push(Math.round(t - last)); last = t;
      if (++n < 300) requestAnimationFrame(tick); else res({ longFrames: longs.length, worst: Math.max(0, ...longs) }); }
    requestAnimationFrame(tick);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }); })()
```

- [ ] **Step 3: Dead-end grep.** Run: `Grep pattern:'href="#"[^a-z]' glob:'*.html'` and `Grep pattern:'TODO|PLACEHOLDER|lorem' glob:'*.html'`. Known hit: resume button `index.html:172` (`href="#"`). Also verify whether detail pages still ship dead cursor markup (`.cursor-wrap` seen in `project-aria.html:17` — check whether `style.css`/`detail.js` still animate it or it's orphaned).
- [ ] **Step 4: Report findings ranked by severity to user.** Include the three hero-variant descriptions from Task 2 (Meridian / Orbit / Signal) — user picks one AFTER seeing the prototypes in Task 2 Step 3, but flag the choice is coming.

### Task 2: Hero rebuild — Spline out, native `js/hero.js` in

**Files:**
- Create: `js/hero.js`
- Modify: `index.html` (head lines ~16–18 preconnects, ~36–55 bootstrap script, ~112–114 `#heroSpline` div, script block ~683–686)
- Modify: `js/home.js` (loader cap line ~23; delete Spline IIFE lines ~59–125)
- Modify: `css/home.css` (delete `.hero-spline`/`.spline-skeleton` rules ~148–153 + `@keyframes skel`; delete mobile `.hero-spline{display:none}` ~562; add `.hero-visual` rules)

- [ ] **Step 1: Remove Spline from `index.html`.** Delete: `<link rel="preconnect" href="https://prod.spline.design" crossorigin>` and `<link rel="dns-prefetch" href="https://prod.spline.design">`; the whole head bootstrap `<script>(function () { ... __splineViewerSrc ... })();</script>` (comment included); replace

```html
<div class="hero-spline" id="heroSpline" data-spline="https://prod.spline.design/8SbnMxhzrQXLNLIN/scene.splinecode" aria-hidden="true">
  <div class="spline-skeleton" id="splineSkeleton" aria-hidden="true"></div>
</div>
```

with

```html
<div class="hero-visual" aria-hidden="true"><canvas id="heroVisual"></canvas></div>
```

Update loader comment (`<!-- ═══ Intro loader (masks first paint) ═══ -->`). Add `<script src="js/hero.js?v=1"></script>` before `js/home.js` in the bottom script block.

- [ ] **Step 2: Remove Spline from `js/home.js`, shorten loader.** Delete the entire `/* ── Spline 3D scene ... */` IIFE (from its comment through its closing `})();`). Change loader hard cap line to:

```js
setTimeout(hide, reduced ? 400 : 900);   /* hard cap — no heavy scene to mask anymore */
```

and trim the loader comment's "gives Spline a head start" phrasing.

- [ ] **Step 3: Create `js/hero.js` — one engine, three presets.** Preset selected via `?hero=meridian|orbit|signal` (default `meridian` until user picks; after pick, hardcode winner and drop the param). Complete file:

```js
/* hero.js — native hero visual (replaces Spline). One engine, three field presets.
   Same perf discipline as field.js: no deps, DPR capped, no shadowBlur in the loop. */
(function () {
  "use strict";
  var cv = document.getElementById("heroVisual");
  if (!cv) return;
  var fine    = matchMedia("(pointer: fine)").matches;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var m = /[?&]hero=(\w+)/.exec(location.search);
  var PRESET = (m && m[1]) || "meridian";

  var ctx = cv.getContext("2d");
  var W = 0, H = 0, DPR = 1, CX = 0, CY = 0;
  var px = 0, py = 0, tx = 0, ty = 0;          /* pointer parallax (lerped) */
  var running = false, raf = 0, t0 = performance.now();

  /* pre-rendered radial glow sprite — the cheap stand-in for shadowBlur */
  var glow = document.createElement("canvas");
  (function () {
    glow.width = glow.height = 64;
    var g = glow.getContext("2d");
    var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(214,178,110,0.55)");
    grad.addColorStop(0.4, "rgba(201,162,90,0.18)");
    grad.addColorStop(1, "rgba(201,162,90,0)");
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  })();

  /* field functions: given (x, y, t) return flow angle */
  var FIELDS = {
    meridian: function (x, y, t) {           /* filaments streaming around a calm centre */
      var dx = x - CX, dy = y - CY;
      var r = Math.sqrt(dx * dx + dy * dy) + 1;
      return Math.atan2(dy, dx) + Math.PI / 2 + 0.5 * Math.sin(r * 0.004 - t * 0.00022);
    },
    orbit: function (x, y, t) {              /* elliptical orbits echoing the line-art rings */
      var dx = (x - CX) * 0.8, dy = (y - CY) * 1.25;
      return Math.atan2(dy, dx) + Math.PI / 2 + 0.08 * Math.sin(t * 0.0004);
    },
    signal: function (x, y, t) {             /* horizontal signal ridgelines */
      return 0.28 * Math.sin(y * 0.012 + t * 0.00035) + 0.12 * Math.sin(x * 0.006 - t * 0.0002);
    }
  };
  var field = FIELDS[PRESET] || FIELDS.meridian;

  var N = 140, P = [];
  function seed(i) {
    P[i] = { x: Math.random() * W, y: Math.random() * H,
             s: 0.35 + Math.random() * 0.65,               /* speed factor */
             life: 60 + Math.random() * 180, age: Math.random() * 180,
             glint: Math.random() < 0.12 };
  }
  function size() {
    DPR = Math.min(devicePixelRatio || 1, 1.5);
    W = cv.clientWidth; H = cv.clientHeight;
    if (!W || !H) return false;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    CX = W * 0.62; CY = H * 0.46;                          /* visual centre sits right-of-centre, behind the name */
    for (var i = 0; i < N; i++) seed(i);
    ctx.fillStyle = "rgba(6,8,12,1)"; ctx.fillRect(0, 0, W, H);
    return true;
  }

  function frame(now) {
    var t = now - t0;
    px += (tx - px) * 0.04; py += (ty - py) * 0.04;
    /* motion-trail fade instead of full clear — gives filaments without per-point history */
    ctx.fillStyle = "rgba(6,8,12,0.075)"; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(px * 14, py * 10);
    ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(201,162,90,0.30)";
    ctx.beginPath();
    for (var i = 0; i < N; i++) {
      var p = P[i];
      var a = field(p.x, p.y, t);
      var nx = p.x + Math.cos(a) * p.s * 1.15;
      var ny = p.y + Math.sin(a) * p.s * 1.15;
      ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny);
      p.x = nx; p.y = ny;
      if (++p.age > p.life || nx < -20 || nx > W + 20 || ny < -20 || ny > H + 20) seed(i);
    }
    ctx.stroke();
    for (var j = 0; j < N; j++) {
      var q = P[j];
      if (q.glint) ctx.drawImage(glow, q.x - 7, q.y - 7, 14, 14);
    }
    ctx.restore();
    if (running) raf = requestAnimationFrame(frame);
  }

  function staticFrame() {                                  /* reduced-motion: one settled composition */
    for (var k = 0; k < 240; k++) frameStep(k * 16);
  }
  function frameStep(t) {
    ctx.fillStyle = "rgba(6,8,12,0.075)"; ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(201,162,90,0.30)";
    ctx.beginPath();
    for (var i = 0; i < N; i++) {
      var p = P[i], a = field(p.x, p.y, t);
      var nx = p.x + Math.cos(a) * p.s * 1.15, ny = p.y + Math.sin(a) * p.s * 1.15;
      ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny);
      p.x = nx; p.y = ny;
      if (++p.age > p.life || nx < -20 || nx > W + 20 || ny < -20 || ny > H + 20) seed(i);
    }
    ctx.stroke();
  }

  function start() { if (running || reduced) return; running = true; t0 = performance.now(); raf = requestAnimationFrame(frame); }
  function stop()  { running = false; cancelAnimationFrame(raf); }

  /* pause off-screen + when tab hidden */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }, { threshold: 0.02 })
      .observe(cv);
  }
  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  if (fine) addEventListener("pointermove", function (e) {
    tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5;
  }, { passive: true });

  var lastW = 0;
  addEventListener("resize", function () {
    if (innerWidth === lastW) return;                       /* ignore address-bar height-only resizes */
    lastW = innerWidth;
    if (size() && reduced) staticFrame();
  });

  function boot() {
    lastW = innerWidth;
    if (!size()) { setTimeout(boot, 120); return; }         /* harness can report 0 width at script time */
    if (reduced) { staticFrame(); return; }
    start();
  }
  boot();
})();
```

- [ ] **Step 4: CSS.** In `css/home.css`, delete `.hero-spline`, `.hero-spline spline-viewer`, `.hero-spline spline-viewer.loaded`, `.spline-skeleton`, `.spline-skeleton.gone`, `@keyframes skel`, and the `≤768` `.hero-spline { display: none; }` line. Add in their place:

```css
.hero-visual { position: absolute; top: 0; bottom: 0; left: 50%; width: 100vw; transform: translateX(-50%); z-index: 1; pointer-events: none; overflow: hidden; }
.hero-visual canvas { width: 100%; height: 100%; display: block; opacity: 0; animation: heroin 1.4s var(--ease) .1s forwards; }
@keyframes heroin { to { opacity: 1; } }
```

and in the `≤768` block: `.hero-visual { opacity: 0.45; }` (keep it on mobile — it is cheap, unlike Spline; drop to `display:none` only if the audit's mobile long-frame probe says otherwise).

- [ ] **Step 5: Verify.** Bump `css/home.css?v=17`, `js/home.js?v=15` in `index.html`. Reload preview. Checks: `preview_network` shows NO request to `spline.design`/`jsdelivr.../spline-viewer`; console clean; hero visual animating ≤1s after load; screenshot all three presets via `?hero=meridian`, `?hero=orbit`, `?hero=signal`; reduced-motion emulation (`preview_eval` won't emulate — use `matchMedia` override check or just verify staticFrame path by code review + `?hero=` screenshots). Long-frame probe from Task 1 re-run — must be ≤ baseline.
- [ ] **Step 6: User picks preset.** Show 3 screenshots (AskUserQuestion with previews). Hardcode winner: `var PRESET = "<winner>";` (keep the query-param override line above it for future testing). Bump `js/hero.js?v=2`.
- [ ] **Step 7: Commit.**

```bash
git add index.html js/hero.js js/home.js css/home.css
git commit -m "feat(hero): replace Spline scene with native canvas visual"
```

### Task 3: Motion unification — one token set

**Files:**
- Modify: `css/home.css` (`:root` line ~7), `css/style.css` (`:root` line ~6)
- Modify: `js/home.js`, `js/detail.js` (GSAP reveal constants)

- [ ] **Step 1: Add motion tokens to BOTH `:root` blocks** (identical text in both files):

```css
  /* ── motion tokens (single source of truth, mirrored in JS) ── */
  --ease:      cubic-bezier(0.16, 1, 0.3, 1);   /* signature out-expo — already in use */
  --ease-io:   cubic-bezier(0.76, 0, 0.24, 1);  /* symmetric in-out (work cards) */
  --dur-fast:  0.25s;
  --dur-med:   0.45s;
  --dur-slow:  0.9s;
```

(`--ease` already exists in both — keep value, just group under the comment.)

- [ ] **Step 2: Sweep both CSS files** — replace hardcoded one-off durations/easings on interactive elements with tokens: `.25s`→`var(--dur-fast)`, `.4s/.45s/.5s`→`var(--dur-med)` where they animate transform/opacity/color on hover or reveal. Do NOT touch keyframe animations belonging to signature systems (loader sweep, marquee 48s, la-draw, skel-replacement `heroin`). The literal `cubic-bezier(.76,0,.24,1)` on work cards → `var(--ease-io)`.
- [ ] **Step 3: JS constants.** In `js/home.js` and `js/detail.js` find the ScrollTrigger reveal tween(s); normalise both to: `duration: 0.9, ease: "power3.out", start: "top 85%"` with stagger `0.08` where a stagger exists. (home.js already matches from the 2026-06-21 pass — detail.js is the one to align.) Confirm both files have `lenis.on('scroll', ScrollTrigger.update)` + `gsap.ticker.lagSmoothing(0)` + identical Lenis config `{ lerp: 0.1, wheelMultiplier: 1, touchMultiplier: 1.8, smoothWheel: true }`.
- [ ] **Step 4: Verify.** Bump `css/home.css?v=18`, `css/style.css?v=5`, `js/detail.js?v=4` (+`js/home.js?v=16` if touched) in ALL referencing HTML files (PowerShell loop below, adjust versions):

```powershell
Get-ChildItem project-*.html | ForEach-Object { (Get-Content $_ -Raw) -replace 'css/style\.css\?v=\d+','css/style.css?v=5' -replace 'js/detail\.js\?v=\d+','js/detail.js?v=4' | Set-Content $_ -NoNewline }
```

Preview: scroll homepage end-to-end + 2 detail pages — reveals fire at the same viewport point, no pops; hovers feel identical across pages. Console clean.
- [ ] **Step 5: Commit.** `git commit -m "feat(motion): unified motion tokens across homepage and detail pages"`

### Task 4: Type & spacing rhythm

**Files:** Modify: `css/home.css`, `css/style.css`, possibly `index.html` (section-head markup only if a head is missing its kicker/lede)

- [ ] **Step 1: Add scale tokens to both `:root`s:**

```css
  /* ── type scale (minor third, fluid) + spacing rhythm ── */
  --step-0: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  --step-1: clamp(1.2rem, 1.1rem + 0.5vw, 1.45rem);
  --step-2: clamp(1.5rem, 1.3rem + 1vw, 2rem);
  --step-3: clamp(2rem, 1.6rem + 2vw, 3rem);
  --step-4: clamp(2.6rem, 1.9rem + 3.5vw, 4.4rem);
  --space-section: clamp(5rem, 4rem + 6vw, 9.5rem);
```

- [ ] **Step 2: Normalise section heads.** Every homepage section head uses the same pattern (mono kicker → Playfair headline at `--step-3`/`--step-4` → lede at `--step-0` with max-width ~62ch). Apply `--space-section` as the vertical padding of every `<section>` on the homepage (one rule, not per-section). Detail pages: `th-title` → `--step-4`, `th-subtitle` → `--step-1`, section labels aligned to the mono-kicker treatment.
- [ ] **Step 3: Spacing audit.** Fix any section whose internal gaps break the rhythm (audit screenshots from Task 1 decide which — expected candidates: creds band vertical padding, contact block). Rule: gaps only from the set 0.5/0.75/1/1.5/2/3rem.
- [ ] **Step 4: Verify.** Bump both CSS versions everywhere (same PowerShell loop). Screenshots per section at 1440 + 375; compare against Task 1 baseline — no overflow at 375, heads visually consistent. Console clean.
- [ ] **Step 5: Commit.** `git commit -m "feat(type): fluid modular type scale and section spacing rhythm"`

### Task 5: Page transitions

**Files:**
- Modify: `css/home.css`, `css/style.css` (view-transition rules)
- Modify: `js/home.js` (loader session-skip), `js/detail.js` (fallback fade), all 14 HTML files (version bumps only)

- [ ] **Step 1: CSS — both files, near the top:**

```css
/* ── cross-document view transitions (Chromium; others fall back to JS fade) ── */
@view-transition { navigation: auto; }
::view-transition-old(root) { animation: vt-out .28s var(--ease) both; }
::view-transition-new(root) { animation: vt-in .34s var(--ease) both; }
@keyframes vt-out { to { opacity: 0; transform: translateY(-6px); } }
@keyframes vt-in { from { opacity: 0; transform: translateY(8px); } }
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root), ::view-transition-new(root) { animation-duration: .01s; }
}
```

- [ ] **Step 2: JS fallback fade** — add to BOTH `js/home.js` and `js/detail.js` (inside the existing top-level IIFE, near the end):

```js
  /* ── page-transition fallback: browsers without cross-document view transitions ── */
  (function () {
    if ("startViewTransition" in document || reduced) return;
    document.documentElement.classList.add("vt-fallback");
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || a.target === "_blank" || e.metaKey || e.ctrlKey) return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
      e.preventDefault();
      document.documentElement.classList.add("vt-leaving");
      setTimeout(function () { location.href = a.href; }, 190);
    });
    addEventListener("pageshow", function () { document.documentElement.classList.remove("vt-leaving"); });
  })();
```

and to both CSS files:

```css
.vt-fallback body { transition: opacity .19s ease; }
.vt-fallback.vt-leaving body { opacity: 0; }
```

- [ ] **Step 3: Loader session-skip** — in `js/home.js` loader IIFE, first line after the `loader` null-check:

```js
    var seen = false;
    try { seen = sessionStorage.getItem("__seen") === "1"; sessionStorage.setItem("__seen", "1"); } catch (e) {}
    if (seen) { loader.parentNode.removeChild(loader); return; }   /* returning within session: no curtain */
```

- [ ] **Step 4: Verify.** Bump versions everywhere. In preview (Chromium): homepage → click ARIA work card → detail page slides/fades in; back → NO loader replay, scroll position restored, continuous feel. Console clean on both. `preview_eval` `document.startViewTransition ? 'native' : 'fallback'` to know which path was exercised; test fallback by temporarily evaluating the click handler condition (code-review level is fine for the non-Chromium path).
- [ ] **Step 5: Commit.** `git commit -m "feat(transitions): cross-document view transitions with JS fade fallback"`

### Task 6: Detail-page parity

**Files:** Modify: `css/style.css`, `js/detail.js`, all 13 `project-*.html` (only if shared markup fixes needed)

- [ ] **Step 1: Resolve the cursor-markup question from Task 1.** If `.cursor-wrap` lattice is orphaned (CSS/JS no longer animate it), remove the markup block from all 13 pages (PowerShell regex over `project-*.html`) and any dead `.cursor-*` rules in `style.css`. If still live, leave untouched.
- [ ] **Step 2: Apply Task 3/4 tokens through `style.css`** — hover states, reveal timings, `th-header` spacing, `essence-strip` and `metrics-grid` gaps onto the rhythm set. Back-link: give it the same mono-kicker treatment + hover behavior as homepage nav links.
- [ ] **Step 3: Consistency sweep across all 13 pages.** Grep each for: correct `css/style.css?v=`, `js/field.js?v=3`, `js/detail.js?v=` current, `viewport-fit=cover` present, back-link href sane (`index.html#work` or `index.html#research`). One PowerShell pass prints any file deviating:

```powershell
Get-ChildItem project-*.html | ForEach-Object { $c = Get-Content $_ -Raw; if ($c -notmatch 'viewport-fit=cover' -or $c -notmatch 'back-link') { $_.Name } }
```

- [ ] **Step 4: Verify.** Three representative pages (project-aria = heaviest, project-cpfe = plainest, project-conviction-ranking = newest) at 1440 + 375: reveals, type scale, back-link, no overflow, console clean.
- [ ] **Step 5: Commit.** `git commit -m "feat(detail): bring all 13 project pages to homepage polish level"`

### Task 7: Content flow + dead-end kill

**Files:** Modify: `index.html`; Create: `assets/Rajveer_Singh_Pall_Resume.pdf`

- [ ] **Step 1: Wire the resume button.** Copy `C:\Users\Asus\Downloads\masters\Rajveer_Singh_Pall_Resume_2026.pdf` → `assets/Rajveer_Singh_Pall_Resume.pdf`. Change `index.html:172` `href="#"` → `href="assets/Rajveer_Singh_Pall_Resume.pdf" download`. (If the PDF is missing at that path, STOP and ask the user — do not ship a dead button or guess another file.)
- [ ] **Step 2: Narrative read-through.** Read homepage top-to-bottom in preview. Tighten section kickers/heads/ledes so they chain as one argument (hero question → creds proof → about stance → trajectory → impact numbers → work systems → research papers → stack → contact). Copy edits ONLY rephrase existing verified facts; every number stays exactly as it appears now. Ban list honored: no "delve", no symmetrical triads, no hedging filler.
- [ ] **Step 3: Dead-end grep, whole repo (live files only):**

```powershell
Get-ChildItem *.html | Select-String 'href="#"(?!\w)|TODO|PLACEHOLDER|lorem'
```

Expected: zero hits after Step 1 (hash-only section anchors like `#about` are fine and excluded by the pattern).
- [ ] **Step 4: Verify.** Resume click downloads the PDF in preview (`preview_network` shows 200 for the asset). Full-page read-through screenshot set. Console clean.
- [ ] **Step 5: Commit.** `git commit -m "feat(content): narrative flow pass, wire real resume, kill dead ends"`

### Task 8 (optional — execute-time confirmation REQUIRED): Root cleanup

**Files:** Delete only, per confirmed manifest.

- [ ] **Step 1: Present manifest to user, wait for explicit yes:** 21 python mutator scripts (add_css.py … update_stack_js.py), `index_backup_traj.html`, `index_stack_backup.html`, `css/home_backup_traj.css`, `css/home_stack_backup.css`, `js/home_stack_backup.js`, `current-desktop.png`, `current-mobile.png`, `js/traj-spiral.js`, `INTEGRATION_NOTES.md`, `_previous_version/`. KEEP: `portfolio gemini/` (reference source).
- [ ] **Step 2: Delete confirmed items via `git rm`** (tracked) so removal is one revertable commit; `Remove-Item` only for untracked strays.
- [ ] **Step 3: Verify site still loads clean (homepage + 1 detail page), console clean.**
- [ ] **Step 4: Commit.** `git commit -m "chore: remove one-off mutator scripts, backups, and orphaned files"`

---

## Final gate (after last executed task)

- [ ] Console clean on homepage + 3 detail pages.
- [ ] `preview_network` on homepage: zero third-party requests except Google Fonts + jsdelivr (three.js importmap for spiral) — no spline.design.
- [ ] All 13 detail pages reachable from their entry points (Work cards / Research list).
- [ ] 1440 + 375 screenshot set archived to scratchpad.
- [ ] Long-frame probe ≤ Task 1 baseline.
- [ ] Dead-end grep zero hits.
