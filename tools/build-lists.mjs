// Rewrites the two static lists in index.html from js/papers.js.
//
// #pubList and #trajList are not fallbacks: below 768px they are the only research
// UI (css/home.css hides the spiral and the Gantt), so they must carry the same
// statuses as everything else. System rows are preserved from the current markup;
// only paper rows are generated.
//
// Usage: node tools/build-lists.mjs   (run after tools/sync-papers.mjs)

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const INDEX = join(ROOT, "index.html");

const papersSrc = readFileSync(join(ROOT, "js/papers.js"), "utf8");
const PAPERS = JSON.parse(papersSrc.slice(papersSrc.indexOf("["), papersSrc.lastIndexOf("]") + 1));
const bySlug = Object.fromEntries(PAPERS.map((p) => [p.slug, p]));

// The timeline list mirrors the bar order in js/trajectory.js (by start date).
const TIMELINE = [
  "project-serenespace.html",
  "diabetes-external-validation",
  "project-finsight.html",
  "mortgage-disparities",
  "who-bears-the-burden",
  "text-genre-transfer-failure",
  "project-finsight-web.html",
  "indiafinbench",
  "when-the-gate-stays-closed",
  "project-aria.html",
  "could-it-read-the-answer",
  "confidently-wrong",
  "trustshift",
  "subgroup-fairness-reversal",
  "benchmark-accuracy-not-identified",
  "project-fairscope.html",
  "scorer-partial-identification",
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const html = readFileSync(INDEX, "utf8");

/** Pull the existing markup of each system row so its copy and tags survive untouched. */
function systemRows(source) {
  const rows = {};
  for (const m of source.matchAll(/ *<a class="pub reveal" href="(project-[^"]+)"[\s\S]*?<\/a>/g)) {
    if (!rows[m[1]]) rows[m[1]] = m[0];
  }
  return rows;
}

function paperRow(p, indent) {
  const pad = " ".repeat(indent);
  const external = !p.page;
  const href = p.page ?? p.href;
  const venue = p.venue ? `<span class="pub-venue">${esc(p.venue)}</span>` : "";
  const tags = p.tags.slice(0, 4).map((t) => `<span>${esc(t)}</span>`).join("");
  return [
    `${pad}<a class="pub reveal" href="${href}"${external ? ' target="_blank" rel="noopener"' : ""} data-cursor style="--accent:${p.color}">`,
    `${pad}  <div class="pub-main">`,
    `${pad}    <h3 class="pub-title">${esc(p.title)}</h3>`,
    `${pad}    <p class="pub-sub">${esc(p.sub)}</p>`,
    `${pad}    <div class="pub-tags">${tags}</div>`,
    `${pad}  </div>`,
    `${pad}  <div class="pub-side">${venue}<span class="pub-status">${esc(p.status)}</span><span class="pub-arrow">↗</span></div>`,
    `${pad}</a>`,
  ].join("\n");
}

/** Replace a list's children by walking div depth, so an inner </div> does not end it. */
function replaceList(source, id, body) {
  const open = source.indexOf(`id="${id}">`);
  if (open < 0) throw new Error(`${id} not found`);
  const start = source.indexOf("\n", open) + 1;
  let depth = 1;
  let i = start;
  while (depth > 0) {
    const nextOpen = source.indexOf("<div", i);
    const nextClose = source.indexOf("</div>", i);
    if (nextClose < 0) throw new Error(`${id} close not found`);
    if (nextOpen >= 0 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + 4;
    } else {
      depth -= 1;
      i = nextClose + 6;
    }
  }
  const end = i - 6;
  const closeIndent = source.slice(source.lastIndexOf("\n", end) + 1, end);
  return source.slice(0, start) + body + "\n" + closeIndent + source.slice(end);
}

const systems = systemRows(html);
for (const key of TIMELINE.filter((k) => k.endsWith(".html"))) {
  if (!systems[key]) throw new Error(`system row ${key} not found in index.html`);
}

const pubBody = PAPERS.map((p) => paperRow(p, 6)).join("\n\n");
const trajBody = TIMELINE.map((key) =>
  key.endsWith(".html") ? systems[key].replace(/^ */, "        ") : paperRow(bySlug[key], 8),
).join("\n\n");

let out = replaceList(html, "pubList", pubBody);
out = replaceList(out, "trajList", trajBody);
writeFileSync(INDEX, out);

console.log(`#pubList: ${PAPERS.length} papers`);
console.log(`#trajList: ${TIMELINE.length} rows (${TIMELINE.filter((k) => k.endsWith(".html")).length} systems)`);
