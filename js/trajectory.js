/* ------------------------------------------------------------------ */
/*  Trajectory — faithful port of the reference "The trajectory."       */
/*  desktop vertical Gantt (portfolio gemini / App.D9sC4DB2.js, fn Bn).  */
/*                                                                      */
/*  CENTERED time-spine with year ticks + gridlines; systems sit RIGHT   */
/*  of the spine, research papers LEFT (split layout). Thin colored      */
/*  duration bars in collision lanes, Playfair/DM-Mono cards in          */
/*  non-overlapping per-side columns, the whole chart translated (-f)     */
/*  inside a sticky-pinned                                                */
/*  viewport as the page scrolls, a white playhead line+dot growing      */
/*  along the spine, and a velocity-driven particle spray. Pure vanilla  */
/*  (window scroll, Lenis-compatible) — no GSAP, no WebGL.               */
/*  Cards link to their project page. Mobile (<768) → #trajList.         */
/* ------------------------------------------------------------------ */

(function () {
  "use strict";

  /* fonts (reference) */
  var FF_DISP = '"Playfair Display", Georgia, serif';
  var FF_MONO = '"DM Mono", "JetBrains Mono", monospace';
  var FF_SANS = '"DM Sans", system-ui, sans-serif';

  /* 14 entries — earliest first → top. track groups the bar lanes.
     start/end estimated (owner-approved): Jun 2025 → Oct 2026, scheduled so the
     SYSTEM side is strictly sequential (1 lane) and the RESEARCH side never has
     more than 2 concurrent bars — mirrors the reference's clean lane structure. */
  var ENTRIES = [
    { id: "serenespace", track: "system", color: "#f59e0b", url: "project-serenespace.html",
      role: "SereneSpace", company: "System · SIH 2025", start: [2025, 5], end: [2025, 9],
      bullets: [
        "A no-login entry point — the barrier to first contact in student mental health is identity.",
        "Mood-based routing to check-ins, an AI companion, activities and peer community, with crisis escalation.",
        "Selected among the top 50 of 250 teams at Smart India Hackathon 2025.",
      ] },
    { id: "diabetes-eval", track: "research", color: "#10b981", url: "project-diabetes-eval.html",
      role: "Type 2 Diabetes ML Evaluation", company: "IEEE · Accepted", start: [2025, 5], end: [2025, 7],
      bullets: [
        "XGBoost reaches 0.794 AUC internally, 0.717 on an external population 83× larger.",
        "A 9.7% deployment gap quantified, with a full subgroup fairness audit.",
        "SHAP: age & BMI dominate; race/ethnicity ranks 4th — explicit audit required.",
      ] },
    { id: "finsight", track: "system", color: "#38bdf8", url: "project-finsight.html",
      role: "FinSight", company: "System", start: [2025, 10], end: [2026, 0],
      bullets: [
        "Earnings-intelligence pipeline over 14,584 transcripts from 601 S&P 500 firms.",
        "FinBERT sentiment fused with RAG-retrieved features under strict walk-forward discipline.",
        "A genuine cross-sectional signal in Energy — information coefficient +0.31.",
      ] },
    { id: "indiafinbench", track: "research", color: "#06b6d4", url: "project-indiafinbench.html",
      role: "IndiaFinBench", company: "Benchmark · in prep", start: [2026, 2], end: [2026, 4],
      bullets: [
        "The first benchmark over Indian financial regulation — SEBI & RBI text.",
        "406 expert QA items, 192 documents, 12 LLMs scored zero-shot.",
        "Hybrid RAG (FAISS + BM25, RRF) lifts Recall@5 to 0.785.",
      ] },
    { id: "finsight-web", track: "system", color: "#22d3ee", url: "project-finsight-web.html",
      role: "FinSight + Web", company: "System", start: [2026, 1], end: [2026, 3],
      bullets: [
        "A scroll-driven WebGL monograph that makes the FinSight findings explorable.",
        "Next.js 16 + React Three Fiber, rendering the signal field and equity curves.",
        "Shipped on Vercel for a non-technical reader.",
      ] },
    { id: "cpfe", track: "research", color: "#2dd4bf", url: "project-cpfe.html",
      role: "Cross-Platform Fairness Failure", company: "Journal submission · under review", start: [2026, 0], end: [2026, 2],
      bullets: [
        "Classifiers scoring AUC 0.98 within-platform collapse 30–39% off-platform.",
        "A five-axis audit shows calibration and equity failing in lockstep.",
        "Fairness that does not transfer between mental-health datasets.",
      ] },
    { id: "aria", track: "system", color: "#4ade80", url: "project-aria.html",
      role: "ARIA Assistant", company: "System", start: [2026, 4], end: [2026, 6],
      bullets: [
        "A fully local voice AI — faster-whisper → Qwen3-8B → five-axis audit → Piper TTS.",
        "16 real tools, ≤7.1 GB VRAM on one RTX 4060, zero cloud LLM calls.",
        "The equity axis catches 33–39% of failures other guardrails miss.",
      ] },
    { id: "icgdf", track: "research", color: "#a78bfa", url: "project-icgdf.html",
      role: "When the Gate Stays Closed", company: "Journal submission · under review", start: [2026, 3], end: [2026, 5],
      bullets: [
        "An IC-gated deployment framework with a conjunctive HAC + permutation test.",
        "The gate never opened across 12 folds and 1,512 out-of-sample days.",
        "False deployment cut from 11.8% to 0.0% on large-cap NASDAQ equities.",
      ] },
    { id: "federated-diabetes", track: "research", color: "#34d399", url: "project-federated-diabetes.html",
      role: "Privacy-Preserving Federated Learning", company: "JBI · under review", start: [2025, 11], end: [2026, 1],
      bullets: [
        "FedAvg / FedProx / FedNova / SCAFFOLD on partitioned NHANES.",
        "Externally validated on 1.28M BRFSS records.",
        "A 40% smaller generalisation gap than a matched centralised model.",
      ] },
    { id: "disparities", track: "research", color: "#f97316", url: "project-disparities.html",
      role: "Persistent Racial Disparities", company: "JHE · submitted", start: [2025, 7], end: [2025, 9],
      bullets: [
        "Five identification strategies on 42M HMDA applications, 2020–2024.",
        "All confirm a 14.95 pp Black–White approval gap.",
        "≥44% survives maximally adversarial selection assumptions.",
      ] },
    { id: "cate-hmda", track: "research", color: "#60a5fa", url: "project-cate-hmda.html",
      role: "Who Bears the Burden?", company: "Journal submission · under review", start: [2025, 9], end: [2025, 11],   /* Oct–Dec '25 */
      bullets: [
        "Causal Forest Double ML on 42.3M HMDA applications.",
        "A 9.4 pp conditional Black approval penalty, net of 33 controls.",
        "Largest under manual underwriting.",
      ] },
    { id: "aria-audit", track: "research", color: "#f5ca40", url: "project-aria-audit.html",
      role: "ARIA: Runtime Fairness Audit", company: "arXiv preprint", start: [2026, 5], end: [2026, 7],
      bullets: [
        "Inline counterfactual disparate-impact + equalized-odds on a model's actual output.",
        "Not a fixed offline benchmark — a live runtime property.",
        "Catches 33–39% of failures other guardrails miss, ~1.2s, zero cloud calls.",
      ] },
    { id: "trustshift", track: "research", color: "#f472b6", url: "project-trustshift.html",
      role: "TrustShift: Shift Type Determines Failure Modes", company: "Applied Intelligence · under review", start: [2026, 6], end: [2026, 8],
      bullets: [
        "One pre-registered audit across clinical risk, mental-health NLP, mortgage lending, and network security.",
        "Shift type, not shift magnitude, decides which trustworthiness axis fails at deployment.",
        "Three label-free probes diagnose the failure axis in advance — before labels arrive.",
      ] },
    { id: "fairscope", track: "system", color: "#e3c07e", url: "project-fairscope.html",
      role: "fairscope", company: "System · PyPI library", start: [2026, 7], end: [2026, 9],
      bullets: [
        "Subgroup-stratified, calibration-aware fairness auditing as a pip-installable library.",
        "DeLong CIs for per-subgroup AUC, per-subgroup ECE/MCE, gap tests with Bonferroni/BH correction.",
        "Five modules shipped at v0.3.0 — 100% line coverage on the statistical core, CI green on Python 3.9–3.12.",
      ] },
  ];

  var Y0 = [2025, 5];            /* origin: Jun 2025 = month 0 (top) */
  var YEND = [2026, 10];         /* axis end (padded below the last entry, Oct '26) */

  /* ── time helpers ── */
  function ym(d) { return (d[0] - Y0[0]) * 12 + (d[1] - Y0[1]); }   /* months since origin */
  var RE = ym(YEND);

  /* ── geometry constants (from reference Bn — desktop, CENTERED split) ── */
  var PE = 60, ZT = 80, OT = 3.6, STRIP_PAD = 140;   /* OT raised: more time-space so cards fit their slots and bars line up */
  var BAR_GAP = 40, BAR_W = 2, LANE_GAP = 16, CARD_GAP = 22, EDGE = 40;
  var SYS_CARD_MAX = 320, RES_CARD_MAX = 380;
  var PAD_L = 14, PAD_T = 12, PAD_B = 16, HEAD_GAP = 14;   /* card paddings */
  var BFONT = 13.2, LH = 1.48, JN = 59, BULLET_GAP = 4;

  /* ── dom ── */
  var host = document.getElementById("trajScroll");
  var pubList = document.getElementById("trajList");
  if (!host) return;

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function showListOnly() {
    host.style.display = "none";
    if (pubList) pubList.classList.remove("is-hidden");
  }
  /* init is at the bottom (lazy start — survives innerWidth==0 at load) */

  /* ── bar lane assignment (greedy, by time overlap) ── */
  function assignLanes(items) {
    var sorted = items.slice().sort(function (a, b) { return ym(a.start) - ym(b.start); });
    var laneEnds = [];     /* month at which each lane frees up */
    var map = {};
    sorted.forEach(function (e) {
      var s = ym(e.start), en = ym(e.end);
      var lane = laneEnds.findIndex(function (m) { return m <= s; });
      if (lane === -1) { lane = laneEnds.length; }
      laneEnds[lane] = en;
      map[e.id] = lane;
    });
    return { map: map, count: Math.max(1, laneEnds.length) };
  }
  var sysLanes = assignLanes(ENTRIES.filter(function (e) { return e.track === "system"; }));
  var resLanes = assignLanes(ENTRIES.filter(function (e) { return e.track === "research"; }));
  function laneOf(e) { return (e.track === "system" ? sysLanes.map : resLanes.map)[e.id] || 0; }
  var totalLanes = sysLanes.count + resLanes.count;

  /* ── measure card height (canvas text wrap, like reference qe) ── */
  var measureCtx = document.createElement("canvas").getContext("2d");
  function cardHeight(e, cardW) {
    var u = cardW - PAD_L * 2 - 8;
    measureCtx.font = BFONT + 'px ' + FF_SANS;
    var lineH = BFONT * LH, total = 0;
    e.bullets.forEach(function (txt, i) {
      var words = txt.split(" "), lines = 0, line = "";
      for (var w = 0; w < words.length; w++) {
        var test = line ? line + " " + words[w] : words[w];
        if (measureCtx.measureText(test).width > u && line) { lines++; line = words[w]; }
        else { line = test; }
      }
      if (line) lines++;
      total += Math.ceil(lines * lineH);
      if (i < e.bullets.length - 1) total += BULLET_GAP;
    });
    return JN + total + PAD_B + 22;   /* header block + bullets + paddings */
  }

  /* ── layout (recomputed on resize) ── */
  var chartH, monthPx, stripH, maxOffset, hostW, hostH, SPINE_X;
  var sysCardX, sysCardW, resCardX, resCardW;
  var stage, viewport, layer, canvas, ctx, playLine, playDot;
  var barEls = [], cardEls = [];
  var placed = [];          /* {e, top, h} card positions in layer space */

  function compute() {
    hostW = host.clientWidth;
    hostH = innerHeight;
    chartH = Math.max(hostH * OT, 2400);
    monthPx = (chartH - PE - ZT) / RE;
    stripH = hostH - STRIP_PAD;
    maxOffset = Math.max(0, chartH - stripH);
    SPINE_X = Math.round(hostW * 0.5);          /* centered spine */

    /* systems → RIGHT of the spine */
    var sysBlock = sysLanes.count * BAR_W + Math.max(0, sysLanes.count - 1) * LANE_GAP;
    sysCardX = SPINE_X + BAR_GAP + sysBlock + CARD_GAP;
    sysCardW = Math.min(SYS_CARD_MAX, Math.max(140, hostW - EDGE - sysCardX));

    /* research → LEFT of the spine */
    var resBlock = resLanes.count * BAR_W + Math.max(0, resLanes.count - 1) * LANE_GAP;
    var resF = SPINE_X - BAR_GAP - resBlock - CARD_GAP;   /* card right edge */
    resCardW = Math.min(RES_CARD_MAX, Math.max(140, resF - EDGE));
    resCardX = resF - resCardW;
  }
  function toPy(d) { return PE + ym(d) * monthPx; }   /* earliest (Jun '25) at top */

  /* per-entry horizontal placement (two-sided, like reference Bn) */
  function barLeftOf(e) {
    var lane = laneOf(e);
    return e.track === "system"
      ? SPINE_X + BAR_GAP + lane * (BAR_W + LANE_GAP)
      : SPINE_X - BAR_GAP - BAR_W - lane * (BAR_W + LANE_GAP);
  }
  function cardLeftOf(e)  { return e.track === "system" ? sysCardX : resCardX; }
  function cardWidthOf(e) { return e.track === "system" ? sysCardW : resCardW; }

  /* ── build DOM ── */
  function build() {
    compute();
    host.textContent = "";
    host.style.cssText = "position:relative;height:" + (hostH + maxOffset) + "px;";

    stage = el("div", "position:sticky;top:0;height:" + hostH + "px;overflow:hidden;display:flex;flex-direction:column;");

    /* header (pinned with the chart) */
    var header = el("div", "padding:0.85rem 6vw 1.4rem;flex-shrink:0;");
    var krow = el("div", "display:flex;align-items:center;gap:1rem;margin-bottom:0.9rem;");
    krow.appendChild(el("span", "font-family:" + FF_MONO + ";font-size:0.62rem;letter-spacing:0.2em;color:rgba(255,255,255,0.4);text-transform:uppercase;", "02 — Experience & Education"));
    krow.appendChild(el("div", "flex:1;height:1px;background:rgba(255,255,255,0.07);"));
    header.appendChild(krow);
    header.appendChild(el("h2", "font-family:" + FF_DISP + ";font-weight:800;font-size:clamp(2.4rem,4.5vw,4rem);line-height:1.1;letter-spacing:0.02em;color:#fafaf8;margin:0;", "The trajectory."));
    stage.appendChild(header);

    /* chart viewport */
    viewport = el("div", "position:relative;width:100%;flex:1;overflow:hidden;");
    layer = el("div", "position:absolute;top:0;left:0;width:100%;height:" + chartH + "px;will-change:transform;");

    /* month ticks — quarterly cadence (Jun 2025, Sep 2025, Dec 2025, …) */
    var MABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var TICK_MONTHS = 3;
    var ticks = [];
    for (var mo = 0; mo <= RE; mo += TICK_MONTHS) {
      var absM = Y0[1] + mo;
      ticks.push({ y: PE + mo * monthPx, label: MABBR[absM % 12] + " " + (Y0[0] + Math.floor(absM / 12)) });
    }

    /* gridlines at each tick */
    ticks.forEach(function (t) {
      if (t.y >= 0 && t.y <= chartH) layer.appendChild(el("div", "position:absolute;left:0;right:0;top:" + t.y + "px;height:1px;background:rgba(255,255,255,0.04);"));
    });

    /* spine segments (broken at each tick so the label sits in the gap) */
    var tickYs = ticks.map(function (t) { return t.y; }).filter(function (y) { return y >= 0 && y <= chartH; }).sort(function (a, b) { return a - b; });
    var cur = 0;
    tickYs.forEach(function (ty) {
      var gap = ty - 12 - cur;
      if (gap > 0) layer.appendChild(el("div", "position:absolute;left:" + SPINE_X + "px;top:" + cur + "px;height:" + gap + "px;width:1px;background:rgba(255,255,255,0.15);"));
      cur = ty + 12;
    });
    if (chartH - cur > 0) layer.appendChild(el("div", "position:absolute;left:" + SPINE_X + "px;top:" + cur + "px;height:" + (chartH - cur) + "px;width:1px;background:rgba(255,255,255,0.15);"));

    /* tick marks + month labels centred on the spine */
    ticks.forEach(function (t) {
      if (t.y < 0 || t.y > chartH) return;
      layer.appendChild(el("div", "position:absolute;top:" + t.y + "px;left:" + (SPINE_X - 5) + "px;width:11px;height:1px;background:rgba(255,255,255,0.22);"));
      layer.appendChild(el("span", "position:absolute;top:" + (t.y - 8) + "px;left:" + SPINE_X + "px;transform:translateX(-50%);font-family:" + FF_MONO + ";font-size:0.56rem;letter-spacing:0.05em;color:rgba(255,255,255,0.5);white-space:nowrap;background:rgba(7,8,11,0.9);padding:0 7px;", t.label));
    });

    /* cards laid out first — greedy non-overlap PER SIDE (systems and research
       occupy separate columns, so they don't collide). Bars connect to these. */
    function layoutSide(list) {
      var arr = list.map(function (e) {
        var w = cardWidthOf(e), hh = cardHeight(e, w);
        var mid = (toPy(e.start) + toPy(e.end)) / 2;
        return { e: e, h: hh, top: mid - hh / 2 };
      }).sort(function (a, b) { return a.top - b.top; });
      var prevBottom = -Infinity;
      arr.forEach(function (p) {
        if (p.top < prevBottom + 14) p.top = prevBottom + 14;
        if (p.top < 0) p.top = 0;
        prevBottom = p.top + p.h;
      });
      return arr;
    }
    placed = layoutSide(ENTRIES.filter(function (e) { return e.track === "system"; }))
      .concat(layoutSide(ENTRIES.filter(function (e) { return e.track === "research"; })));
    var placedMap = {};
    placed.forEach(function (p) { placedMap[p.e.id] = p; });

    /* duration bars at true time + a colour-matched leader tying each to its card */
    barEls = [];
    ENTRIES.forEach(function (e) {
      var top = toPy(e.start);
      var h = Math.max(monthPx * 0.9, (ym(e.end) - ym(e.start)) * monthPx);
      var x = barLeftOf(e);
      var p = placedMap[e.id];

      /* leader: from the bar edge (bar mid-Y) to the card near edge (card mid-Y) */
      if (p) {
        var barMidY = top + h / 2;
        var cardMidY = p.top + p.h / 2;
        var x1, x2;
        if (e.track === "system") { x1 = x + BAR_W; x2 = cardLeftOf(e); }        /* card is to the right */
        else { x1 = x; x2 = cardLeftOf(e) + cardWidthOf(e); }                      /* card is to the left */
        var dx = x2 - x1, dy = cardMidY - barMidY;
        var len = Math.sqrt(dx * dx + dy * dy), ang = Math.atan2(dy, dx) * 180 / Math.PI;
        layer.appendChild(el("div", "position:absolute;left:" + x1 + "px;top:" + barMidY + "px;width:" + len + "px;height:1px;background:" + e.color + ";opacity:0.25;transform-origin:0 0;transform:rotate(" + ang + "deg);pointer-events:none;"));
        layer.appendChild(el("div", "position:absolute;left:" + (x1 - 2.5) + "px;top:" + (barMidY - 2.5) + "px;width:5px;height:5px;border-radius:50%;background:" + e.color + ";opacity:0.9;pointer-events:none;"));
      }

      var bar = el("div", "position:absolute;top:" + top + "px;left:" + x + "px;width:" + BAR_W + "px;height:" + h + "px;background:" + e.color + ";border-radius:2px;opacity:0.85;");
      layer.appendChild(bar);
      barEls.push({ e: e, top: top, x: x, el: bar });
    });

    cardEls = [];
    placed.forEach(function (p) {
      var card = buildCard(p.e, cardLeftOf(p.e), cardWidthOf(p.e), p.top, p.h);
      layer.appendChild(card);
      cardEls.push(card);
    });

    viewport.appendChild(layer);

    /* particle canvas (scrub spray) */
    canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;top:0;left:0;pointer-events:none;z-index:2;";
    canvas.width = hostW; canvas.height = stripH;
    ctx = canvas.getContext("2d");
    viewport.appendChild(canvas);

    /* playhead (viewport space) */
    playLine = el("div", "position:absolute;left:" + SPINE_X + "px;top:0;width:1px;height:0;background:#fff;opacity:0.9;pointer-events:none;z-index:1;");
    playDot = el("div", "position:absolute;left:" + (SPINE_X - 4) + "px;top:-4px;width:9px;height:9px;border-radius:50%;background:#fff;box-shadow:0 0 10px rgba(255,255,255,0.9);pointer-events:none;z-index:3;");
    viewport.appendChild(playLine);
    viewport.appendChild(playDot);

    stage.appendChild(viewport);
    host.appendChild(stage);
  }

  function buildCard(e, left, width, top, h) {
    var c = e.color;
    var a = document.createElement("a");
    a.href = e.url; a.setAttribute("data-cursor", "");
    a.style.cssText = "position:absolute;left:" + left + "px;top:" + top + "px;width:" + width + "px;height:" + h + "px;" +
      "background:linear-gradient(180deg," + c + "0e 0%," + c + "05 100%);border-left:2px solid " + c + ";" +
      "border-top:1px solid " + c + "28;border-bottom:1px solid " + c + "28;border-right:1px solid " + c + "28;" +
      "border-radius:3px;box-sizing:border-box;overflow:hidden;display:flex;flex-direction:column;text-decoration:none;color:inherit;" +
      "transition:transform .3s cubic-bezier(0.76,0,0.24,1),box-shadow .3s,border-color .3s;";

    var headWrap = el("div", "padding:" + PAD_T + "px " + PAD_L + "px 0;flex-shrink:0;");
    var hrow = el("div", "display:flex;align-items:baseline;justify-content:space-between;gap:6px;margin-bottom:2px;");
    hrow.appendChild(el("span", "font-family:" + FF_DISP + ";font-weight:700;font-size:0.95rem;color:#fafaf8;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;", e.role));
    hrow.appendChild(el("span", "font-family:" + FF_MONO + ";font-size:0.5rem;color:rgba(255,255,255,0.3);letter-spacing:0.06em;flex-shrink:0;white-space:nowrap;", period(e)));
    headWrap.appendChild(hrow);
    headWrap.appendChild(el("span", "font-family:" + FF_MONO + ";font-size:0.56rem;color:" + c + "cc;letter-spacing:0.04em;display:block;line-height:1.4;", e.company));
    headWrap.appendChild(el("div", "height:1px;background:" + c + "20;margin-top:6px;margin-bottom:9px;"));
    a.appendChild(headWrap);

    var bl = el("div", "padding:0 " + PAD_L + "px " + PAD_B + "px;display:flex;flex-direction:column;gap:" + BULLET_GAP + "px;");
    e.bullets.forEach(function (txt) {
      var row = el("div", "display:flex;gap:5px;align-items:flex-start;");
      row.appendChild(el("span", "color:" + c + ";font-size:0.5rem;flex-shrink:0;margin-top:0.22rem;opacity:0.7;", "▪"));
      row.appendChild(el("span", "font-family:" + FF_SANS + ";font-size:" + BFONT + "px;line-height:" + LH + ";color:rgba(255,255,255,0.62);text-align:justify;", txt));
      bl.appendChild(row);
    });
    a.appendChild(bl);

    a.addEventListener("mouseenter", function () { a.style.transform = "translateX(3px)"; a.style.borderColor = c; a.style.boxShadow = "0 0 22px " + c + "22"; });
    a.addEventListener("mouseleave", function () { a.style.transform = ""; a.style.borderTopColor = c + "28"; a.style.borderRightColor = c + "28"; a.style.borderBottomColor = c + "28"; a.style.boxShadow = ""; });
    return a;
  }

  function period(e) {
    var m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var sy = String(e.start[0]).slice(2), ey = String(e.end[0]).slice(2);
    return sy === ey
      ? m[e.start[1]] + "–" + m[e.end[1]] + " '" + sy
      : m[e.start[1]] + " '" + sy + " – " + m[e.end[1]] + " '" + ey;
  }

  function el(tag, css, text) {
    var n = document.createElement(tag);
    if (css) n.style.cssText = css;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ── scroll scrub ── derive f from the section's live viewport position
     (self-correcting; immune to layout shifts above, e.g. the hero Spline). */
  var f = 0, onScreen = true;
  function onScroll() {
    var rect = host.getBoundingClientRect();
    onScreen = rect.bottom > 0 && rect.top < innerHeight;
    f = Math.max(0, Math.min(maxOffset, -rect.top));
    apply();
  }
  function apply() {
    layer.style.transform = "translate3d(0," + (-f) + "px,0)";
    var prog = maxOffset > 0 ? f / maxOffset : 0;
    var ph = prog * stripH;
    playLine.style.height = ph + "px";
    playDot.style.top = (ph - 4) + "px";
  }

  /* ── particle spray (velocity along spine) ── */
  var parts = [], lastScrub = 0, vel = 0, rafId = 0, lastT = 0;
  function tick(t) {
    rafId = requestAnimationFrame(tick);
    var dt = Math.min((t - lastT) / 1000, 0.05); lastT = t;
    /* drive the scrub from the live rect every frame — under Lenis the window
       'scroll' event is unreliable, but the section's rect always reflects truth. */
    var rect = host.getBoundingClientRect();
    onScreen = rect.bottom > 0 && rect.top < innerHeight;
    f = Math.max(0, Math.min(maxOffset, -rect.top));
    apply();
    if (!onScreen) { if (parts.length) { parts = []; ctx.clearRect(0, 0, canvas.width, canvas.height); } return; }
    var scrub = (maxOffset > 0 ? f / maxOffset : 0) * stripH;
    var dy = scrub - lastScrub; lastScrub = scrub;
    if (Math.abs(dy) > 0.1) vel = dy / Math.max(dt, 0.001); else vel *= Math.pow(0.001, dt);
    if (Math.abs(vel) > 5) {
      var dir = vel > 0 ? 1 : -1, sp = Math.min(Math.abs(vel) * 0.85, 200);
      var n = Math.max(1, Math.min(6, Math.round(Math.abs(vel) / 25)));
      for (var i = 0; i < n; i++) parts.push({ x: SPINE_X + (Math.random() - 0.5) * 6, y: scrub + (Math.random() - 0.5) * 4, vx: (Math.random() - 0.5) * 30, vy: dir * sp * (0.4 + Math.random() * 0.6), life: 1, size: 0.8 + Math.random() * 1.5 });
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parts = parts.filter(function (p) { return p.life > 0; });
    for (var j = 0; j < parts.length; j++) {
      var p = parts[j];
      p.life -= dt / 0.5;
      if (p.life <= 0) continue;
      p.x += p.vx * dt; p.y += p.vy * dt;
      ctx.globalAlpha = p.life * 0.9;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0.3, p.size * p.life), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ── intro fade when section enters view ── */
  function playIntro() {
    if (stage.dataset.in) return;
    stage.dataset.in = "1";
    stage.style.transition = "opacity 0.6s ease";
    stage.style.opacity = "0";
    requestAnimationFrame(function () { stage.style.opacity = "1"; });
  }

  /* ── init (lazy + self-healing) ──
     The harness can report innerWidth==0 when the deferred script runs, which
     looks like "mobile". So never permanently bail: build the chart the first
     time we see a real desktop width, and tear back down to the list on mobile. */
  var built = false, scrollBound = false;
  function buildChart() {
    host.style.display = "";
    if (pubList) pubList.classList.add("is-hidden");
    build();
    onScroll(); playIntro();
    if (!scrollBound) { addEventListener("scroll", function () { playIntro(); onScroll(); }, { passive: true }); scrollBound = true; }
    lastT = performance.now(); cancelAnimationFrame(rafId); rafId = requestAnimationFrame(tick);
    built = true;
  }
  function decide() {
    var mobile = innerWidth <= 768 || reduced;
    if (!mobile && !built) { buildChart(); }
    else if (!mobile && built) { cancelAnimationFrame(rafId); build(); onScroll(); lastT = performance.now(); rafId = requestAnimationFrame(tick); }
    else if (mobile && built) { cancelAnimationFrame(rafId); built = false; showListOnly(); }
    else { showListOnly(); }     /* mobile / unknown width at load → list, retried on resize */
  }
  /* boot: innerWidth can read 0 in some embedders at script time — retry on a
     short timer until a real width appears instead of waiting for a resize */
  (function boot(n) {
    if (innerWidth > 0) { decide(); return; }
    if (n < 50) setTimeout(function () { boot(n + 1); }, 120);
  })(0);
  addEventListener("load", decide);
  var rt;
  addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(decide, 160); }, { passive: true });
})();
