# Rajveer Singh Pall — Portfolio

Personal research portfolio for **Rajveer Singh Pall** — ML & decision-systems research.
A dark "engineering command-center" aesthetic: an animated constellation field behind
noir editorial typography, a live 3D hero scene, scroll-scrubbed data visualisations,
and six in-depth case studies of the systems. Fully responsive — an intentionally designed
mobile layout, not a squeezed desktop.

The papers themselves live on the [research site](https://rajveer-research.vercel.app),
which is the single source of their status, venue and numbers. This site links out to them
and keeps the engineering.

**Live:** [rajveer-code-github-io.vercel.app](https://rajveer-code-github-io.vercel.app/)
· [rajveer-code.github.io](https://rajveer-code.github.io/) — static site, no build step.

## Homepage sections

In DOM order (`index.html`):

| Section | What it is |
|---|---|
| **Hero** | Name + thesis over a Spline 3D scene and an animated gold line-art overlay, with portrait, social links, and an intro loader that masks first paint. On mobile the portrait becomes a compact editorial composition. |
| **Credentials** | An at-a-glance band directly below the hero — degree, research output, internships, IIT Guwahati certificate, and current SGPA. |
| **About** | The research stance, the full per-semester **SGPA progression**, plus the **Gold & Glory** highlights marquee (a seamless right-to-left ticker of verified milestones). |
| **Trajectory** | "The trajectory." — a scroll-scrubbed vertical **Gantt timeline**: a centred time-spine with systems to the right, research papers to the left, duration bars, and a growing playhead. |
| **Impact** | An interactive node **constellation** (SVG) of 30+ metrics across six categories, with a central HUD that updates on hover. On touch it becomes a native stacked card list of the same data. |
| **Work** | Featured systems as cards (whole-card click → case study). |
| **Research** | Twelve papers and manuscripts, with a WebGL **research spiral** (`spiral.js`). Every card is generated from one record, so a status cannot drift between views. |
| **Stack** | Tooling grouped by domain, rendered from data with logo icons. |
| **Contact** | Links + a live local clock. |

Six case-study pages (`project-*.html`) cover the systems in depth, sharing `css/style.css`
+ `js/detail.js`. Seven older paper pages remain as short stubs: they keep their URLs alive
for the résumé, ORCID and Scholar links that point at them, carry a canonical to the paper's
page on the [research site](https://rajveer-research.vercel.app), and send the reader there.

## Tech

- **Vanilla HTML / CSS / JS** — no framework, no bundler, no build step.
- **Three.js** (CDN, via import map) — the WebGL research spiral.
- **Spline viewer** (CDN) — the hero 3D scene, lazily injected (desktop + motion only).
- **GSAP + ScrollTrigger** — scroll-driven reveals and scrubbing, kept in lockstep with…
- **Lenis** — smooth momentum scroll.
- **Canvas 2D** — the constellation background field, hand-written (no library).
- **Google Fonts** — Space Grotesk, DM Sans, JetBrains Mono, Playfair Display, DM Mono.

## Project structure

```
index.html            — homepage, fully baked into HTML (SEO + no-JS safe)
project-*.html         — 6 system case studies + 7 canonical stubs for retired paper URLs
sitemap.xml            — the 7 self-canonical pages (stubs are deliberately absent)
robots.txt, llms.txt   — crawl and model-readable summary

css/
  home.css            — homepage design system
  style.css           — detail-page design system

js/
  papers.js           — the paper record (generated; every other view reads it)
  field.js            — animated constellation background (shared by all pages)
  home.js             — homepage chrome: loader, nav, Spline injection, marquee,
                        impact constellation, clock/HUD, stack render, Lenis, reveals
  trajectory.js       — the scroll-scrubbed Gantt timeline
  spiral.js           — WebGL research spiral (Three.js module)
  detail.js           — detail-page chrome: clock, scroll rail, Lenis, reveals, HUD

assets/portrait.jpg
assets/og/             — share cards, one per indexable page (generated)
assets/figures/        — publication figures from the era of the full paper pages; now
                         unreferenced, kept until the paper pages' fate is settled
logos/                 — stack icons
tools/                 — content generation and the pre-ship verifier (see below)
devserver.py           — local dev server (no-store headers)
```

## Content and checks

Statuses, venues and links for the twelve papers are generated, never typed twice:

```bash
node tools/sync-papers.mjs      # js/papers.js from the research site's own record
node tools/build-lists.mjs      # the two static lists in index.html
node tools/build-stubs.mjs      # the seven retired paper pages
node tools/build-seo.mjs        # sitemap.xml, llms.txt, social and JSON-LD head blocks
node tools/build-og.mjs         # assets/og/*.png (needs Edge and a network connection)
node tools/verify-content.mjs   # eight gates; non-zero exit on any failure
```

`verify-content.mjs` is the gate before a push. It checks retracted and withdrawn content,
the status vocabulary and which venues may be named, both lists against the record, the
stubs against their canonical target, per-page h1/title/description/canonical/links/alt,
the sitemap and its share images, and that no link points at a research URL that has moved.

## Running locally

CDN access is required (libraries + fonts load from CDNs):

```bash
python devserver.py        # → http://localhost:8124  (sends Cache-Control: no-store)
# or any static server, e.g.
python -m http.server 8123 # → http://localhost:8123
```

Open the served URL (not the `file://` path) so the Three.js import map and fetches work.

## Deploy

Static — deploy the repository as-is to **Vercel**, **GitHub Pages**, or **Netlify**.
No build command and no output directory are needed; pushing to `main` is the deploy.

## Accessibility & resilience

- **`prefers-reduced-motion`** is respected site-wide (marquee, reveals, and animations
  are disabled; content is shown immediately, and the research spiral gives way to the
  static list rather than animating).
- **No JS / blocked CDN** — all content is in the HTML and renders without scripts.
- **Spline is non-blocking** — a gold shimmer holds until the scene actually paints, with
  a safety cap so it never waits forever; the page is fully usable meanwhile.
- **Reveal safety net** — a timeout force-shows any in-view content if an animation stalls.
- **Mobile / touch** — a full-screen **overlay nav** (hamburger, focus-trapped, Esc to
  close, scroll-locked); an editorial mobile hero; the Impact constellation becomes native
  stacked cards; the Gantt timeline and research spiral fall back to plain lists; the field
  thins out; `viewport-fit=cover` + `env(safe-area-inset-*)` handle notched phones.
- **Hidden tab** — the constellation field pauses to save power.
