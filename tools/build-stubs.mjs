// Rewrites the retired paper pages as short canonical stubs.
//
// These URLs are linked from the résumé PDF, GitHub, ORCID and Scholar, and GitHub
// Pages cannot serve a redirect, so the pages stay. Each one keeps its cross-domain
// canonical to the research site, states the paper's current status, and sends the
// reader on. No figures, no numbers, no citation: the research site owns those.
//
// Usage: node tools/build-stubs.mjs   (run after tools/sync-papers.mjs)

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const papersSrc = readFileSync(join(ROOT, "js/papers.js"), "utf8");
const PAPERS = JSON.parse(papersSrc.slice(papersSrc.indexOf("["), papersSrc.lastIndexOf("]") + 1));
const bySlug = Object.fromEntries(PAPERS.map((p) => [p.slug, p]));

// Retired page -> the paper it now points at. project-federated-diabetes.html is the
// important one: the study it described was retracted, and the page that replaced it
// is a different paper about the same screening setting.
const STUBS = {
  "project-trustshift.html": "trustshift",
  "project-cate-hmda.html": "who-bears-the-burden",
  "project-disparities.html": "mortgage-disparities",
  "project-diabetes-eval.html": "diabetes-external-validation",
  "project-icgdf.html": "when-the-gate-stays-closed",
  "project-cpfe.html": "text-genre-transfer-failure",
  "project-federated-diabetes.html": "subgroup-fairness-reversal",
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='30' fill='%2306080c'/%3E%3Ctext x='32' y='43' font-family='Georgia,serif' font-size='34' fill='%23f5ca40' text-anchor='middle'%3ER%3C/text%3E%3C/svg%3E";
const FONTS =
  "https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap";

const description = (p) => {
  const tail = ` Read it on the research site.`;
  const full = p.sub + tail;
  return full.length <= 160 ? full : p.sub;
};

const badge = (p) => (p.venue ? `${p.status} · ${p.venue}` : p.status);

function stub(file, p) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${esc(p.short)} — Rajveer Singh Pall</title>
  <meta name="description" content="${esc(description(p))}">
  <link rel="icon" href="${FAVICON}">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="canonical" href="${p.href}">
  <link href="${FONTS}" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css?v=13">
</head>
<body>
  <canvas id="field" aria-hidden="true"></canvas>
  <div class="bottom-fade" aria-hidden="true"></div>

  <div class="spatial-scene">
    <div class="thinking-scroll">
      <div class="thinking-body">
        <a href="index.html#research" class="back-link">← Back to research</a>
        <header class="th-header">
          <div class="th-badge" style="color:${p.color}">${esc(badge(p))}</div>
          <h1 class="th-title">${esc(p.short)}</h1>
          <p class="th-subtitle">${esc(p.sub)}</p>
          <p class="th-authors">${esc(p.authors)} · ${p.year}</p>
        </header>
        <section class="th-section">
          <h2 class="th-section-title">Where this paper lives</h2>
          <p class="th-body">The full write-up is on the research site: the discovery in one figure, the paper in five minutes, the method, the results with their stated limits, and the citation. This page stays so older links keep working.</p>
          <div class="related-row" style="--pn-accent:${p.color}">
            <a href="${p.href}" target="_blank" rel="noopener"><span>${esc(p.title)}</span><span class="rel-status">${esc(badge(p))}</span></a>
            <a href="index.html#work"><span>Engineering systems on this site</span><span class="rel-status">ARIA · FinSight · fairscope</span></a>
          </div>
        </section>
        <div class="th-footer">© 2026 Rajveer Singh Pall · Decision Systems Research · Jabalpur, India</div>
      </div>
    </div>
  </div>

  <script src="js/field.js?v=3"></script>
</body>
</html>
`;
}

for (const [file, slug] of Object.entries(STUBS)) {
  const p = bySlug[slug];
  if (!p) throw new Error(`${file}: no paper for slug ${slug}`);
  if (p.page) throw new Error(`${file}: ${slug} still claims a local page`);
  writeFileSync(join(ROOT, file), stub(file, p));
  console.log(`${file.padEnd(34)} -> ${p.href}  [${badge(p)}]`);
}
