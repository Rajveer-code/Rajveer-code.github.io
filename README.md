# Rajveer Singh Pall — Portfolio

Personal research portfolio for **Rajveer Singh Pall** — ML & decision-systems research.
A dark "engineering command-center" aesthetic: an animated constellation field behind
noir editorial typography, a live 3D hero scene, scroll-scrubbed data visualisations,
and twelve in-depth case-study pages.

Live: deployed as a static site (GitHub Pages / Vercel — no build step).

## Homepage sections

In DOM order (`index.html`):

| Section | What it is |
|---|---|
| **Hero** | Name + thesis over a Spline 3D scene and an animated gold line-art overlay, with portrait, social links, and an intro loader that masks first paint. |
| **About** | The research stance, plus the **Gold & Glory** highlights marquee (a seamless right-to-left ticker of verified milestones). |
| **Trajectory** | "The trajectory." — a scroll-scrubbed vertical **Gantt timeline**: a centred time-spine with systems to the right, research papers to the left, duration bars, and a growing playhead. |
| **Impact** | An interactive node **constellation** (SVG) of 30+ metrics across six categories, with a central HUD that updates on hover. |
| **Work** | Featured systems as cards (whole-card click → case study). |
| **Research** | Papers, with a WebGL **research spiral** (`spiral.js`). |
| **Stack** | Tooling grouped by domain, rendered from data with logo icons. |
| **Contact** | Links + a live local clock. |

Twelve case-study pages (`project-*.html`) cover each system and paper in depth, sharing
`css/style.css` + `js/detail.js`.

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
project-*.html         — 12 case-study detail pages

css/
  home.css            — homepage design system
  style.css           — detail-page design system

js/
  field.js            — animated constellation background (shared by all pages)
  home.js             — homepage chrome: loader, nav, Spline injection, marquee,
                        impact constellation, clock/HUD, stack render, Lenis, reveals
  trajectory.js       — the scroll-scrubbed Gantt timeline
  spiral.js           — WebGL research spiral (Three.js module)
  detail.js           — detail-page chrome: clock, scroll rail, Lenis, reveals, HUD

assets/portrait.jpg
logos/                 — stack icons
devserver.py           — local dev server (no-store headers)
```

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
  are disabled; content is shown immediately).
- **No JS / blocked CDN** — all content is in the HTML and renders without scripts.
- **Spline is non-blocking** — a gold shimmer holds until the scene actually paints, with
  a safety cap so it never waits forever; the page is fully usable meanwhile.
- **Reveal safety net** — a timeout force-shows any in-view content if an animation stalls.
- **Mobile / touch** — the Gantt timeline falls back to a plain list; the field thins out.
- **Hidden tab** — the constellation field pauses to save power.
