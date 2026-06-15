# The Decision Field — Research Portfolio

3D scroll-driven portfolio for **Rajveer Singh Pall** — noir editorial typography over a
continuous WebGL particle universe that morphs as you scroll.

## The concept

One particle system (14,000 points, gold/ivory/ember) travels through six formations,
one per chapter, scrubbed by scroll position:

| Chapter | Formation | Meaning |
|---|---|---|
| Prologue | Spiral galaxy | the unexamined universe of decisions |
| 01 · Thesis | Neural lattice | the model that decides |
| 02 · Inquiries | Seven constellations | seven case files |
| 03 · Instruments | Cube grid | engineered order — the systems built |
| 04 · Methods | Torus | the orbit of methods |
| 05 · Trajectory | Singularity | convergence — the next phase |

The camera drifts between keyframes per chapter, parallaxes with the mouse, and the
field agitates with scroll velocity.

**Readability system** — three layers keep text crisp over the 3D field:
1. *Parting* (`uClear` shader uniform): particles whose screen position falls inside
   the reading column are pushed to the margins and faded, per chapter.
2. *Shield*: a chapter-aware gradient scrim (`body[data-chapter]` drives opacity)
   darkens the content column while leaving the margins alive.
3. *Dimming* (`uFade`): global particle brightness lowers in text-dense chapters.

Dev hook: `/?at=<sectionId>` jumps straight to a chapter with everything revealed
(used for automated screenshots).

## Stack

- **Three.js** (r160, CDN) — custom ShaderMaterial point cloud, additive blending
- **GSAP + ScrollTrigger** — morph scrubbing, reveals, counters, thesis illumination
- **Lenis** — smooth momentum scroll
- No build step. Static HTML/CSS/JS.

## Files

```
index.html      — all content, statically baked (SEO + no-JS safe)
css/style.css   — noir design system (Cormorant Garamond / DM Sans / JetBrains Mono)
js/field.js     — WebGL particle universe (exposes window.FIELD)
js/main.js      — experience engine (preloader, scroll choreography, cursor, magnetic, tilt)
assets/portrait.jpg
_previous_version/ — the old site, kept for reference
```

## Running

Serve the folder over HTTP (CDN access required for libraries + fonts):

```bash
python -m http.server 8123
# → http://localhost:8123
```

Deploy as-is to GitHub Pages, Vercel, or Netlify — no build step needed.

## Resilience

- `prefers-reduced-motion`: static galaxy frame, no animation, everything visible
- No JS / blocked CDN: full content renders, loader never shows
- WebGL unavailable: page works without the background
- 5-second failsafe force-reveals everything if any animation stalls
