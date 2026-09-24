// Checks the site against the record before it ships. Every gate here exists because
// the thing it checks has drifted at least once: statuses lived in seven places and
// disagreed, a canonical pointed at a paper that had been replaced, and numbers from a
// retracted study outlived the study.
//
// Usage: node tools/verify-content.mjs   (exits non-zero on the first failing gate)

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SITE = "https://rajveer-code.github.io";
const RESEARCH = "https://rajveer-research.vercel.app";

const read = (f) => readFileSync(join(ROOT, f), "utf8");
const papersSrc = read("js/papers.js");
const PAPERS = JSON.parse(papersSrc.slice(papersSrc.indexOf("["), papersSrc.lastIndexOf("]") + 1));

const INDEXABLE = [
  "index.html",
  "project-aria.html",
  "project-indiafinbench.html",
  "project-fairscope.html",
  "project-finsight.html",
  "project-finsight-web.html",
  "project-serenespace.html",
];
const STUBS = [
  "project-trustshift.html",
  "project-cate-hmda.html",
  "project-disparities.html",
  "project-diabetes-eval.html",
  "project-icgdf.html",
  "project-cpfe.html",
  "project-federated-diabetes.html",
];
const HTML = [...INDEXABLE, ...STUBS];
const SCRIPTS = ["js/home.js", "js/spiral.js", "js/trajectory.js", "js/detail.js", "js/papers.js", "js/field.js"];

const unesc = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .trim();
const text = (s) => unesc(s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));

let failures = 0;
const fail = (gate, msg) => {
  failures += 1;
  console.error(`  FAIL  [${gate}] ${msg}`);
};
const pass = (gate, msg) => console.log(`  ok    [${gate}] ${msg}`);

// ---- 1. Banned strings -------------------------------------------------------
// Anchored to context: a bare 0.98 is a legitimate number elsewhere on the site.
const BANNED = [
  [/0\.757/, "retracted federated external AUC"],
  [/40\s*%\s*(narrower|smaller)|(narrower|smaller)\s+by\s+40/i, "retracted fairness-gap claim"],
  [/21\.7\s*%/, "retracted fairness gain"],
  [/conviction[- ]rank/i, "withdrawn paper P7"],
  [/transaction[- ]cost trap/i, "withdrawn paper P8"],
  [/89\.7\s*%/, "superseded IndiaFinBench single-leader accuracy"],
  [/#1 LLM/i, "ranking claim the paper's own result contradicts"],
  // Venues that must never be named: double-blind submissions under review.
  [/Applied Intelligence|Computational Economics|\bCMPB\b|Computer Methods and Programs/i, "blind venue named"],
  // Private or anonymised repositories.
  [/github\.com\/[^"'\s]*(knowledgeshift|ddos_xdomain|mental-health-fairness)/i, "private repo linked"],
];
{
  const gate = "banned";
  let hits = 0;
  for (const file of [...HTML, ...SCRIPTS, "llms.txt", "sitemap.xml"]) {
    if (!existsSync(join(ROOT, file))) continue;
    const src = read(file);
    for (const [rx, why] of BANNED) {
      const m = src.match(rx);
      if (m) {
        hits += 1;
        fail(gate, `${file}: ${why} (${JSON.stringify(m[0])})`);
      }
    }
  }
  if (!hits) pass(gate, `${BANNED.length} patterns absent from ${HTML.length + SCRIPTS.length + 2} files`);
}

// ---- 2. Status vocabulary ----------------------------------------------------
const VOCAB = ["Published", "Under review", "Working paper", "Manuscript", "In preparation"];
// A venue may be named only where the submission is not double-blind, or where the
// venue is the preprint host itself. Anything else under review stays unnamed.
const NAMEABLE = ["IEEE Xplore (CIPHER-2026)", "Journal of Housing Economics", "SSRN"];
{
  const gate = "vocabulary";
  let bad = 0;
  for (const p of PAPERS) {
    if (!VOCAB.includes(p.status)) {
      bad += 1;
      fail(gate, `${p.slug}: status ${JSON.stringify(p.status)} is outside the vocabulary`);
    }
    if (p.venue && !NAMEABLE.includes(p.venue)) {
      bad += 1;
      fail(gate, `${p.slug}: names a venue that is not on the nameable list (${p.venue})`);
    }
  }
  if (!bad) pass(gate, `${PAPERS.length} papers, statuses in vocabulary, venues limited to the nameable list`);
}

// ---- 3. The two static lists agree with the record ---------------------------
// Below 768px these lists are the only research UI, so a stale one is not a fallback.
const byTitle = Object.fromEntries(PAPERS.map((p) => [p.title, p]));

/** The rows of one list, bounded by walking div depth so the next list is not read too. */
function rows(source, id) {
  const open = source.indexOf(`id="${id}">`);
  if (open < 0) throw new Error(`${id} not found in index.html`);
  let depth = 1;
  let i = source.indexOf("\n", open) + 1;
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
  const block = source.slice(open, i);
  const out = [];
  for (const m of block.matchAll(/<a class="pub reveal" href="([^"]+)"[\s\S]*?<\/a>/g)) {
    const row = m[0];
    const title = text(row.match(/<h3 class="pub-title">([\s\S]*?)<\/h3>/)[1]);
    const venue = row.match(/<span class="pub-venue">([\s\S]*?)<\/span>/);
    const status = row.match(/<span class="pub-status">([\s\S]*?)<\/span>/);
    out.push({ href: m[1], title, venue: venue ? text(venue[1]) : "", status: status ? text(status[1]) : "" });
  }
  return out;
}

{
  const gate = "lists";
  const index = read("index.html");
  for (const id of ["pubList", "trajList"]) {
    const all = rows(index, id);
    const seen = new Set();
    for (const r of all) {
      const p = byTitle[r.title];
      if (!p) continue; // a system row: its copy is hand-written and not under this gate
      seen.add(p.slug);
      if (r.status !== p.status) fail(gate, `#${id} / ${p.slug}: status "${r.status}" != record "${p.status}"`);
      if (r.venue !== p.venue) fail(gate, `#${id} / ${p.slug}: venue "${r.venue}" != record "${p.venue}"`);
      const href = p.page ?? p.href;
      if (r.href !== href) fail(gate, `#${id} / ${p.slug}: href ${r.href} != ${href}`);
    }
    const missing = PAPERS.filter((p) => !seen.has(p.slug)).map((p) => p.slug);
    if (missing.length) fail(gate, `#${id}: missing ${missing.join(", ")}`);
    else pass(gate, `#${id}: all ${PAPERS.length} papers present, statuses and links match the record`);
  }
}

// ---- 4. Stubs point at the right paper ---------------------------------------
{
  const gate = "stubs";
  const byHref = Object.fromEntries(PAPERS.map((p) => [p.href, p]));
  for (const file of STUBS) {
    const src = read(file);
    const canonical = src.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    const p = byHref[canonical];
    if (!p) {
      fail(gate, `${file}: canonical ${canonical} is not a current paper URL`);
      continue;
    }
    const badge = text(src.match(/<div class="th-badge"[^>]*>([\s\S]*?)<\/div>/)[1]);
    const expected = p.venue ? `${p.status} · ${p.venue}` : p.status;
    if (badge !== expected) fail(gate, `${file}: badge "${badge}" != "${expected}"`);
    if (!src.includes(`href="${p.href}"`)) fail(gate, `${file}: does not link to ${p.href}`);
    if (src.includes("noindex")) fail(gate, `${file}: noindex would cancel the canonical`);
  }
  pass(gate, `${STUBS.length} retired pages canonicalise to a current paper and link to it`);
}

// ---- 5. Search metadata ------------------------------------------------------
{
  const gate = "seo";
  for (const file of HTML) {
    const src = read(file);
    const h1s = [...src.matchAll(/<h1\b/g)].length;
    if (h1s !== 1) fail(gate, `${file}: ${h1s} h1 elements`);

    const desc = src.match(/<meta name="description" content="([^"]*)"/)?.[1];
    if (!desc) fail(gate, `${file}: no meta description`);
    else if (unesc(desc).length < 70 || unesc(desc).length > 160)
      fail(gate, `${file}: description is ${unesc(desc).length} characters (want 70-160)`);

    const title = src.match(/<title>([^<]*)<\/title>/)?.[1];
    if (!title) fail(gate, `${file}: no title`);
    else if (unesc(title).length > 60) fail(gate, `${file}: title is ${unesc(title).length} characters (want <= 60)`);

    if (!/<link rel="canonical" href="https:\/\//.test(src)) fail(gate, `${file}: no absolute canonical`);

    // No heading skips: h3 may not follow h1 without an h2 between them.
    const levels = [...src.matchAll(/<h([1-4])\b/g)].map((m) => Number(m[1]));
    for (let i = 1; i < levels.length; i += 1) {
      if (levels[i] - Math.min(...levels.slice(0, i)) > 1 && levels[i] - levels[i - 1] > 1) {
        fail(gate, `${file}: heading jumps h${levels[i - 1]} -> h${levels[i]}`);
        break;
      }
    }

    // Dead ends.
    if (/href="#"/.test(src)) fail(gate, `${file}: href="#"`);
    for (const m of src.matchAll(/href="((?!https?:|mailto:|#|data:)[^"]+)"/g)) {
      const target = m[1].split("#")[0].split("?")[0];
      if (target && !existsSync(join(ROOT, target))) fail(gate, `${file}: broken link ${m[1]}`);
    }
    for (const m of src.matchAll(/(?:src|href)="((?:css|js|assets)\/[^"]+)"/g)) {
      const target = m[1].split("?")[0];
      if (!existsSync(join(ROOT, target))) fail(gate, `${file}: missing asset ${m[1]}`);
    }
    // Images carry alt text.
    for (const m of src.matchAll(/<img\b[^>]*>/g)) {
      if (!/\balt=/.test(m[0])) fail(gate, `${file}: <img> without alt (${m[0].slice(0, 60)}…)`);
    }
  }
  pass(gate, `${HTML.length} pages checked for h1, title, description, canonical, headings, links and alt text`);
}

// ---- 6. Sitemap and share images ---------------------------------------------
{
  const gate = "sitemap";
  const before = failures;
  const urls = [...read("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const expected = INDEXABLE.map((f) => (f === "index.html" ? `${SITE}/` : `${SITE}/${f}`));
  const extra = urls.filter((u) => !expected.includes(u));
  const missing = expected.filter((u) => !urls.includes(u));
  if (extra.length) fail(gate, `sitemap lists pages that canonicalise elsewhere: ${extra.join(", ")}`);
  if (missing.length) fail(gate, `sitemap is missing: ${missing.join(", ")}`);

  // Every sitemap URL must be self-canonical, and its share image must exist.
  for (const file of INDEXABLE) {
    const src = read(file);
    const canonical = src.match(/<link rel="canonical" href="([^"]+)"/)[1];
    const own = file === "index.html" ? `${SITE}/` : `${SITE}/${file}`;
    if (canonical !== own) fail(gate, `${file}: canonical ${canonical} != ${own}`);
    const og = src.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    if (!og) fail(gate, `${file}: no og:image`);
    else if (!existsSync(join(ROOT, og.replace(`${SITE}/`, "")))) fail(gate, `${file}: og:image file missing (${og})`);
    if (!/twitter:card/.test(src)) fail(gate, `${file}: no twitter:card`);
  }
  if (failures === before) pass(gate, `${urls.length} URLs, each self-canonical with an existing share image`);
}

// ---- 7. No link to a research URL that has since moved -----------------------
{
  const gate = "links";
  const current = new Set(PAPERS.map((p) => p.href));
  let bad = 0;
  for (const file of [...HTML, ...SCRIPTS, "llms.txt"]) {
    for (const m of read(file).matchAll(new RegExp(`${RESEARCH}/research/[a-z0-9-]+/?`, "g"))) {
      const url = m[0].endsWith("/") ? m[0] : `${m[0]}/`;
      if (!current.has(url)) {
        bad += 1;
        fail(gate, `${file}: ${url} is not a current paper URL (it would redirect)`);
      }
    }
  }
  if (!bad) pass(gate, "every research link resolves to a current paper URL");
}

console.log(failures ? `\n${failures} failure(s)` : "\nall gates pass");
process.exit(failures ? 1 : 0);
