// Renders the social share cards into assets/og/ (1200x630 each), one per indexable
// page. The cards are plain HTML drawn by a headless browser with the site's own
// palette and fonts, so a shared link looks like the site it opens.
//
// Needs Microsoft Edge (or set CHROMIUM_PATH) and a network connection for the fonts.
// Usage: node tools/build-og.mjs

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT = join(ROOT, "assets/og");
const BROWSER =
  process.env.CHROMIUM_PATH ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

// eyebrow, title, line, footer facts. Kept short: a share card is read at thumbnail size.
const CARDS = [
  {
    out: "home.png",
    eyebrow: "Decision Systems Research",
    title: "Rajveer Singh Pall",
    line: "Testing whether deployed systems are fair and honest, and shipping the systems that check.",
    facts: ["12 papers and manuscripts", "6 systems"],
  },
  {
    out: "aria.png",
    eyebrow: "Local-first agent",
    title: "ARIA Assistant",
    line: "Whisper, Qwen3-8B, a five-axis runtime audit and Piper TTS, entirely on one GPU.",
    facts: ["16 tools", "7.1 GB VRAM", "no cloud LLM calls"],
  },
  {
    out: "indiafinbench.png",
    eyebrow: "Benchmark and retrieval system",
    title: "IndiaFinBench",
    line: "Indian financial regulation, annotated question by question, with a hybrid retrieval stack over it.",
    facts: ["406 items", "192 documents", "hybrid BM25 + FAISS"],
  },
  {
    out: "fairscope.png",
    eyebrow: "Auditing library",
    title: "fairscope",
    line: "Subgroup-stratified, calibration-aware fairness auditing, from the papers that needed it.",
    facts: ["on PyPI", "scikit-learn API"],
  },
  {
    out: "finsight.png",
    eyebrow: "Research pipeline",
    title: "FinSight",
    line: "Earnings calls turned into a measurable record of what management said and what followed.",
    facts: ["14,584 transcripts", "601 S&P 500 firms"],
  },
  {
    out: "finsight-web.png",
    eyebrow: "Scroll-driven monograph",
    title: "FinSight, on the web",
    line: "The findings as a reading experience: WebGL, scroll-linked type, one argument per scene.",
    facts: ["Three.js", "GSAP ScrollTrigger"],
  },
  {
    out: "serenespace.png",
    eyebrow: "Product",
    title: "SereneSpace",
    line: "Anonymous mental-health support for students, built for a hackathon and kept usable.",
    facts: ["top 50 of 250", "Smart India Hackathon 2025"],
  },
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Mono:wght@400;500&family=DM+Sans:opsz,wght@9..40,400&display=swap");
* { box-sizing: border-box; margin: 0; }
html, body { width: 1200px; height: 630px; overflow: hidden; }
body {
  background:
    radial-gradient(900px 500px at 82% 18%, rgba(201, 162, 90, 0.16), transparent 70%),
    radial-gradient(700px 420px at 8% 92%, rgba(201, 162, 90, 0.07), transparent 70%),
    #07080b;
  color: #ece7db;
  font-family: "DM Sans", system-ui, sans-serif;
  display: grid;
  grid-template-rows: 104px 1fr 104px;
}
.top, .foot { display: flex; align-items: center; justify-content: space-between; padding: 0 76px; }
.top { border-bottom: 1px solid rgba(236, 231, 219, 0.1); }
.foot { border-top: 1px solid rgba(236, 231, 219, 0.1); }
.mono { font-family: "DM Mono", monospace; text-transform: uppercase; letter-spacing: 0.2em; font-size: 18px; color: #c9a25a; }
.mono--dim { color: rgba(236, 231, 219, 0.5); letter-spacing: 0.16em; }
.mark { display: flex; align-items: center; gap: 14px; }
.mark span:last-child { letter-spacing: 0.18em; color: rgba(236, 231, 219, 0.72); }
.dot { width: 13px; height: 13px; border-radius: 50%; background: #c9a25a; box-shadow: 0 0 22px rgba(201, 162, 90, 0.75); }
.main { padding: 0 76px; display: grid; align-content: center; gap: 26px; }
h1 { font-family: "Playfair Display", Georgia, serif; font-weight: 700; font-size: 92px; line-height: 1.02; letter-spacing: -0.02em; }
h1.long { font-size: 74px; }
.line { font-size: 27px; line-height: 1.45; color: rgba(236, 231, 219, 0.74); max-width: 900px; }
.facts { display: flex; gap: 14px; align-items: center; }
.facts span { font-family: "DM Mono", monospace; font-size: 17px; color: rgba(236, 231, 219, 0.6); }
.facts i { width: 4px; height: 4px; border-radius: 50%; background: rgba(201, 162, 90, 0.7); display: block; }
`;

mkdirSync(OUT, { recursive: true });
const dir = mkdtempSync(join(tmpdir(), "og-portfolio-"));

for (const card of CARDS) {
  const facts = card.facts
    .map((f) => `<span>${esc(f)}</span>`)
    .join(`<i></i>`);
  const body = `
    <div class="top">
      <div class="mark mono"><span class="dot"></span><span>Rajveer Singh Pall</span></div>
      <div class="mono">${esc(card.eyebrow)}</div>
    </div>
    <div class="main">
      <h1${card.title.length > 18 ? ' class="long"' : ""}>${esc(card.title)}</h1>
      <p class="line">${esc(card.line)}</p>
      <div class="facts">${facts}</div>
    </div>
    <div class="foot">
      <div class="mono mono--dim">rajveer-code.github.io</div>
      <div class="mono mono--dim">Jabalpur, India</div>
    </div>`;

  const page = join(dir, card.out.replace(".png", ".html"));
  writeFileSync(
    page,
    `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body}</body></html>`,
  );
  execFileSync(BROWSER, [
    "--headless=new",
    "--disable-gpu",
    "--disable-lcd-text", // grayscale antialiasing: subpixel rendering tints the text on a dark card
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1200,630",
    "--virtual-time-budget=4000",
    `--screenshot=${join(OUT, card.out)}`,
    pathToFileURL(page).href,
  ]);
  console.log(`assets/og/${card.out}`);
}
