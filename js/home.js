/* home.js — homepage chrome + interactions
   Constellation comes from field.js. Gold dot+ring cursor (distinct from reference). */
(function () {
  "use strict";
  var fine    = window.matchMedia("(pointer: fine)").matches;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof gsap !== "undefined";

  /* ── Intro loader ──
     Masks the rough first paint. Dismissed on the EARLIEST of window 'load'
     or a short hard cap — the hero visual is native now, nothing heavy to wait for. */
  (function () {
    var loader = document.getElementById("loader");
    /* hero entrance animations (CSS) are gated on this class so they start
       the moment the curtain lifts, not while it still covers the page */
    function go() { document.documentElement.classList.add("hero-go"); }
    if (!loader) { go(); return; }
    var seen = false;
    try { seen = sessionStorage.getItem("__seen") === "1"; sessionStorage.setItem("__seen", "1"); } catch (e) {}
    if (seen) { loader.parentNode.removeChild(loader); go(); return; }   /* returning within session: no curtain */
    var done = false;
    function hide() {
      if (done) return; done = true;
      loader.classList.add("gone");
      go();
      setTimeout(function () { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 700);
    }
    if (document.readyState === "complete") setTimeout(hide, 350);
    else window.addEventListener("load", function () { setTimeout(hide, 350); });
    setTimeout(hide, reduced ? 400 : 900);   /* hard cap — no heavy scene to mask anymore */
  })();

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

  /* ── Scroll-position memory (back/forward nav) ──
     Lenis owns the scroll loop and otherwise fights native scroll restoration,
     snapping back to 0 on every return trip. Save position ourselves and let
     Lenis re-apply it once it's constructed below. */
  var SCROLL_KEY = "__portfolio_scrollpos::" + (location.pathname.split("/").pop() || "index.html");
  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) {}
  var scrollSaveQueued = false;
  function saveScrollPos() {
    if (scrollSaveQueued) return;
    scrollSaveQueued = true;
    requestAnimationFrame(function () {
      scrollSaveQueued = false;
      try { sessionStorage.setItem(SCROLL_KEY, String(window.scrollY)); } catch (e) {}
    });
  }

  /* custom cursor removed — native cursor is used */

  /* ── Nav scrolled state + scroll progress ── */
  var nav = document.getElementById("nav");
  var prog = document.getElementById("scrollProgress");
  function onScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle("scrolled", y > 40);
    if (prog) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    }
    saveScrollPos();
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ── Geolocation clock (Haversine nearest airport) ── */
  (function () {
    var AP = [
      ["IST","Asia/Kolkata"],["DEL","Asia/Kolkata"],["BOM","Asia/Kolkata"],["BLR","Asia/Kolkata"],
      ["LHR","Europe/London"],["CDG","Europe/Paris"],["FRA","Europe/Berlin"],["AMS","Europe/Amsterdam"],
      ["JFK","America/New_York"],["SFO","America/Los_Angeles"],["ORD","America/Chicago"],["YYZ","America/Toronto"],
      ["DXB","Asia/Dubai"],["SIN","Asia/Singapore"],["HKG","Asia/Hong_Kong"],["NRT","Asia/Tokyo"],
      ["ICN","Asia/Seoul"],["SYD","Australia/Sydney"],["GRU","America/Sao_Paulo"],["JNB","Africa/Johannesburg"]
    ];
    var elHome = document.getElementById("clockHome");
    var elVis  = document.getElementById("clockVisitor");
    var lblVis = document.getElementById("hudVisitorLabel");
    var elContact = document.getElementById("contactClock");
    function fmt(tz, withSec) {
      try {
        return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit",
          second: withSec ? "2-digit" : undefined, hour12: false }).format(new Date());
      } catch (e) { return "--:--"; }
    }
    var visTz = "Asia/Kolkata", visCode = "IST";
    try {
      var btz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (btz && btz !== "Asia/Kolkata" && btz !== "Asia/Calcutta") {
        visTz = btz; visCode = "YOU";
        for (var i = 0; i < AP.length; i++) if (AP[i][1] === btz) { visCode = AP[i][0]; break; }
      }
    } catch (e) {}
    function paint() {
      if (lblVis) lblVis.textContent = visCode;
      function tick() {
        if (elHome) elHome.textContent = fmt("Asia/Kolkata", true);
        if (elVis)  elVis.textContent  = fmt(visTz, true);
        if (elContact) elContact.textContent = fmt("Asia/Kolkata", false);
      }
      tick(); setInterval(tick, 1000);
    }
    paint();
    /* No geolocation request: the clock already reads the visitor's own timezone from
       Intl, so asking for coordinates only bought a permission prompt on page load. */
  })();

  /* ── Bottom-right HUD ── */
  (function () {
    var brh = document.getElementById("brh");
    if (!brh) return;
    var SK = "__portfolio_session_start";
    var start = parseInt(sessionStorage.getItem(SK), 10);
    if (!start || isNaN(start)) { start = Date.now(); sessionStorage.setItem(SK, start); }

    var EK = "__portfolio_explored_v2";
    var PAGES = ["index.html","project-aria.html","project-finsight.html","project-finsight-web.html",
      "project-fairscope.html","project-indiafinbench.html","project-serenespace.html"];
    var explored = {};
    try { explored = JSON.parse(localStorage.getItem(EK) || "{}"); } catch (e) {}
    var cur = window.location.pathname.split("/").pop() || "index.html";
    if (cur === "") cur = "index.html";

    var sessEl = document.getElementById("brhSession");
    var expEl  = document.getElementById("brhExplore");
    var xyEl   = document.getElementById("brhXY");
    var ringFill = document.getElementById("brhRingFill");
    var btn    = document.getElementById("brhScrollBtn");
    var CIRC = 94.25, mX = "0.00", mY = "0.00";

    document.addEventListener("mousemove", function (e) {
      mX = (e.clientX / window.innerWidth * 2 - 1).toFixed(2);
      mY = (-(e.clientY / window.innerHeight * 2 - 1)).toFixed(2);
    }, { passive: true });
    if (btn) btn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

    function pct() { var s=0; for (var i=0;i<PAGES.length;i++) s+=Math.min(explored[PAGES[i]]||0,1); return Math.round(s/PAGES.length*100); }
    function tick() {
      var el = Math.floor((Date.now() - start)/1000), m = Math.floor(el/60), s = el%60;
      if (sessEl) sessEl.textContent = (m<10?"0":"")+m+":"+(s<10?"0":"")+s;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var sp = max>0 ? window.scrollY/max : 0;
      if (sp > (explored[cur]||0)) { explored[cur] = sp; try { localStorage.setItem(EK, JSON.stringify(explored)); } catch(e){} }
      if (expEl) expEl.textContent = pct() + "%";
      if (ringFill) ringFill.style.strokeDashoffset = (CIRC*(1-sp)).toFixed(2);
      if (btn) btn.classList.toggle("visible", window.scrollY > 220);
      if (xyEl) xyEl.textContent = mX + ", " + mY;
    }
    tick(); setInterval(tick, 1000); window.addEventListener("scroll", tick, { passive: true });
  })();

  /* ── Stack render ── */
  (function () {
    var host = document.getElementById("stackGroups");
    if (!host) return;
    var L = "logos/";
    var colors = ["#a855f7", "#eab308", "#14b8a6", "#ef4444", "#3b82f6", "#ec4899"];
    
    function fableItem(name, logo) {
      var iconHtml = logo 
        ? '<img src="' + L + logo + '" alt="' + name + '" style="width: 44px; height: 44px; min-width: 44px; min-height: 44px; object-fit: contain; display: block; flex: 0 0 44px;" loading="lazy">' 
        : '<svg style="width: 44px; height: 44px; min-width: 44px; min-height: 44px; display: block; flex: 0 0 44px;" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>';
      
      return '<div class="stack-fable-item" style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.8rem; width: 90px; flex: 0 0 90px;">' +
               '<div class="stack-fable-icon" style="width: 44px; height: 44px; min-width: 44px; min-height: 44px; flex: 0 0 44px; display: flex; align-items: center; justify-content: center; overflow: hidden;">' + iconHtml + '</div>' +
               '<div class="stack-fable-text" style="font-family: var(--sans); font-size: 0.85rem; color: #d4d4d4; font-weight: 500; line-height: 1.2;">' + name + '</div>' +
             '</div>';
    }

    var groups = [
      ["Languages", [["Python","python.svg"],["TypeScript","typescript.svg"],["Bash","gnubash.svg"]]],
      ["ML & Deep Learning", [["PyTorch","pytorch.svg"],["scikit-learn","scikitlearn.svg"],["XGBoost","xgboost.png"],["LightGBM","lightgbm.svg"],["CatBoost","catboost.png"],["SHAP","shap.png"]]],
      ["Causal, Stats & Data", [["pandas","pandas.svg"],["NumPy","numpy.svg"],["Polars","polars.svg"],["statsmodels","statsmodels.svg"],["EconML","econml.svg"]]],
      ["LLM, NLP & RAG", [["Transformers","huggingface.svg"],["LangChain","langchain.svg"],["LangGraph","langgraph.svg"],["FAISS","faiss.svg"],["ChromaDB","chroma.svg"],["Ollama","ollama.svg"],["Groq","groq.svg"]]],
      ["Federated & Privacy", [["Flower","flower.svg"],["Opacus","opacus.svg"]]],
      ["Deployment & Infra", [["FastAPI","fastapi.svg"],["Flask","flask.svg"],["Next.js","nextjs.svg"],["React","react.svg"],["Three.js","threejs.svg"],["Docker","docker.svg"],["GCP","gcp-compute-engine.svg"],["Vercel","vercel.svg"]]]
    ];

    host.innerHTML = groups.map(function (g, idx) {
      var labelColor = colors[idx % colors.length];
      return '<div class="stack-fable-group" style="display: flex; padding: 2.2rem 0; border-top: 1px solid rgba(255,255,255,0.06); gap: 2rem; flex-wrap: wrap;">' +
               '<div class="stack-fable-label" style="flex: 0 0 140px; font-family: var(--mono); font-size: 0.6875rem; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600; padding-top: 0.5rem; color: ' + labelColor + ';">' + g[0] + '</div>' +
               '<div class="stack-fable-items" style="display: flex; flex-wrap: wrap; gap: 2rem 3rem; flex: 1;">' +
                 g[1].map(function (it) { return fableItem(it[0], it[1]); }).join("") +
               '</div>' +
             '</div>';
    }).join("");
  })();

  /* ── Gold & Glory highlights marquee ── */
  (function () {
    var track = document.getElementById("gloryTrack");
    if (!track) return;
    /* Paper venue and status come from js/papers.js so the marquee cannot drift. */
    function paperTag(slug) {
      var p = (window.PAPERS || []).filter(function (x) { return x.slug === slug; })[0];
      if (!p) return "";
      return p.venue ? p.venue + " · " + p.status : p.status;
    }
    var HL = [
      { title: "Benchmark Accuracy Is Not Identified", time: paperTag("benchmark-accuracy-not-identified"), sub: "357 of 378 leaderboard orderings are not identified" },
      { title: "Smart India Hackathon 2025", time: "Top 50 of 250",        sub: "SereneSpace — anonymous student mental-health" },
      { title: "Twelve Papers and Manuscripts", time: "2025–26",              sub: "1 published · 5 under review · 2 working papers" },
      { title: "IndiaFinBench",              time: paperTag("indiafinbench"),          sub: "406 expert QA items · the scoring rule reorders the board" },
      { title: "FinSight",                   time: "Deployed System",        sub: "14,584 transcripts · IC +0.31 in Energy" },
      { title: "ARIA Assistant",             time: "Local-First Voice AI",   sub: "Zero cloud LLM calls · one RTX 4060" },
      { title: "Who Bears the Burden?",      time: paperTag("who-bears-the-burden"), sub: "42 million applications · −9.39 pp conditional gap" },
      { title: "Higher AUC, Fewer Cases Flagged", time: paperTag("subgroup-fairness-reversal"), sub: "542 fewer flagged per 100,000 at fixed capacity" },
      { title: "Diabetes External Validation", time: paperTag("diabetes-external-validation"), sub: "0.794 internal, 0.717 external on 1.28M records" },
      { title: "ICGDF Deployment Gate",      time: paperTag("when-the-gate-stays-closed"), sub: "0.0% false deploy across 12 folds" }
    ];
    var ICON = '<svg class="glory-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>';
    function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
    function item(h) {
      return '<div class="glory-item">' +
               '<div class="glory-row">' + ICON + '<span class="glory-title">' + esc(h.title) + '</span></div>' +
               '<div class="glory-time">' + esc(h.time) + '</div>' +
               '<div class="glory-sub">' + esc(h.sub) + '</div>' +
             '</div><span class="glory-sep" aria-hidden="true">•</span>';
    }
    var one = HL.map(item).join("");
    track.innerHTML = one + one;   /* doubled → translateX(-50%) loops seamlessly */
  })();

  /* ── Whole-card click ──
     The visible "card" reads as a single clickable unit, but only the small
     text links at the bottom were wired up. Clicking anywhere else on a card
     now opens its primary case-study link; clicks on an actual <a> still
     behave exactly as that link defines (new tab, external href, etc). */
  document.querySelectorAll(".card").forEach(function (card) {
    var primary = card.querySelector(".card-links a[href$=\".html\"]");
    if (!primary) return;
    card.style.cursor = "pointer";
    card.addEventListener("click", function (e) {
      if (e.target.closest("a")) return;
      window.location.href = primary.getAttribute("href");
    });
  });

  /* ── Lenis smooth scroll ── */
  var lenis;
  if (typeof Lenis !== "undefined" && !reduced) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, touchMultiplier: 1.8, smoothWheel: true });
    if (hasGSAP) {
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      /* drive ScrollTrigger off Lenis so reveals stay in lockstep with the
         smooth-scroll loop — without this they fire late and pop (the "rough"). */
      if (typeof ScrollTrigger !== "undefined") lenis.on("scroll", ScrollTrigger.update);
    } else {
      requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
    }
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length > 1) { var t = document.querySelector(id); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -20 }); } }
      });
    });
  }

  /* ── Restore scroll position on back/forward nav ──
     Read what onScroll saved before we left. Re-applied a few times over the
     first beat because Spline/stack-render/ScrollTrigger can still be settling
     layout — without the repeats the first restore wins the race and then loses it. */
  (function restoreScrollPos() {
    var saved = 0;
    try { saved = parseInt(sessionStorage.getItem(SCROLL_KEY), 10) || 0; } catch (e) {}
    if (saved <= 0) return;
    function apply() {
      if (lenis) lenis.scrollTo(saved, { immediate: true });
      else window.scrollTo(0, saved);
    }
    apply();
    requestAnimationFrame(apply);
    setTimeout(apply, 300);
    setTimeout(apply, 800);
  })();

  /* ── GSAP reveals ── */
  if (hasGSAP && typeof ScrollTrigger !== "undefined" && !reduced) {
    gsap.registerPlugin(ScrollTrigger);
    /* hero entrance is pure CSS, gated on html.hero-go (added when the loader lifts) */
    /* sections on scroll */
    gsap.utils.toArray(".section .reveal").forEach(function (el) {
      gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", overwrite: "auto",
        scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" } });
    });
    ScrollTrigger.refresh();
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.style.opacity = "1"; el.style.transform = "none"; });
  }

  /* Safety net: content must never stay invisible if rAF/GSAP is throttled or fails.
     Only force-show what's already in/above the viewport — below-fold elements are
     left for ScrollTrigger to animate on scroll, so the reveal choreography survives. */
  setTimeout(function () {
    document.querySelectorAll(".reveal").forEach(function (el) {
      var inView = el.getBoundingClientRect().top < window.innerHeight * 0.95;
      if (inView && parseFloat(getComputedStyle(el).opacity) < 0.05) { el.style.opacity = "1"; el.style.transform = "none"; }
    });
  }, 1600);

  /* ── Impact node constellation ── */
  (function () {
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.getElementById("impactSVG");
    if (!svg) return;

    function e(tag, attrs) {
      var el = document.createElementNS(NS, tag);
      for (var k in attrs) el.setAttribute(k, attrs[k]);
      return el;
    }
    function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
    function hexToRgba(hex, a) {
      hex = hex.replace("#", "");
      return "rgba("+parseInt(hex.slice(0,2),16)+","+parseInt(hex.slice(2,4),16)+","+parseInt(hex.slice(4,6),16)+","+a+")";
    }

    var HCX = 650, HCY = 320;
      var CATS = [
        { label: "MODEL PERFORMANCE", cx: 880, cy: 138, color: "#c9a25a", nodes: [
          { cx: 780, cy: 88, val: "0.717",  sub: "External AUROC · Diabetes Risk * NHANES to BRFSS", desc: "Internal 0.794 falls to 0.717 on 1.28M BRFSS records, a 9.7% relative drop; adults 60 and over reach only 0.607." },
          { cx: 960, cy: 78, val: "0.034",   sub: "Sensitivity Gap at Capacity · Federated Screening * FedAvg",      desc: "The White-Black AUC gap narrows to 0.0005 while the gap in who is actually flagged widens from 0.009 to 0.034." },
          { cx: 840, cy: 218, val: "−9.39 pp", sub: "Conditional Approval Gap · HMDA * Causal forest DML",           desc: "Pooled conditional differential across 42 million applications; manual underwriting −14.79 pp against automated −6.17 pp." },
          { cx: 1000, cy: 188, val: "ρ = −0.273",  sub: "Strict vs Judge Ranking · IndiaFinBench * 12 LLMs", desc: "No positive rank correspondence between the strict and judge-only leaderboards (p = 0.39); no model holds its rank across all three regimes." },
          { cx: 900, cy: 248, val: "357 / 378", sub: "Orderings Not Identified · MATH-Hard * 28 models",         desc: "Once unreadable responses and measured scorer error are counted, most published orderings cannot be separated." }
        ]},
        { label: "DATA SCALE", cx: 1110, cy: 320, color: "#38bdf8", nodes: [
          { cx: 1020, cy: 240, val: "42.3M",    sub: "Mortgage Records · HMDA * 2020-2024",          desc: "Every U.S. mortgage application in the window: causal forest double machine learning on the full HMDA dataset." },
          { cx: 1210, cy: 260, val: "1.28M",    sub: "BRFSS Validation Set * Diabetes External Validation",         desc: "Never trained on: the external generalisation test for the diabetes risk model." },
          { cx: 990, cy: 360, val: "14,584",   sub: "S&P 500 Earnings Transcripts * FinSight",           desc: "Earnings calls from 601 S&P 500 firms, 2018-2024, under a strict walk-forward backtest." },
          { cx: 1190, cy: 410, val: "601",      sub: "S&P 500 Firms · FinSight * 6-Year Corpus",          desc: "601 S&P 500 constituents: a six-year earnings corpus with sector-level walk-forward isolation." },
          { cx: 1080, cy: 440, val: "192 docs", sub: "Regulatory Documents * IndiaFinBench / SEBI & RBI", desc: "192 SEBI and RBI source documents annotated into 406 expert QA pairs across four task types." }
        ]},
        { label: "SYSTEMS BUILT", cx: 880, cy: 502, color: "#c084fc", nodes: [
          { cx: 800, cy: 412, val: "0",        sub: "Cloud LLM Calls · ARIA * Fully Local Pipeline",  desc: "The entire voice-to-voice pipeline runs on a single RTX 4060: faster-whisper, Qwen3-8B and TTS." },
          { cx: 990, cy: 452, val: "16",       sub: "Local Tool Registry · ARIA * Offline Routing",   desc: "Web search, calendar, code execution and system control, all routed through a local model, offline." },
          { cx: 770, cy: 522, val: "12 LLMs",  sub: "Models Benchmarked * IndiaFinBench / Zero-Shot", desc: "Twelve contemporary models scored zero-shot on Indian financial regulatory text." },
          { cx: 950, cy: 582, val: "1 GPU",   sub: "Consumer Hardware · ARIA * RTX 4060",            desc: "About 7.1 GB VRAM: a single consumer GPU runs the whole ARIA multi-tool voice assistant." },
          { cx: 860, cy: 602, val: "7.1 GB",  sub: "Peak VRAM · ARIA * RTX 4060 / 8 GB Card",       desc: "The faster-whisper, Qwen3-8B and TTS pipeline fits in 7.1 GB VRAM on a consumer GPU." }
        ]},
        { label: "RESEARCH OUTPUT", cx: 420, cy: 502, color: "#fcd34d", nodes: [
          { cx: 320, cy: 442, val: "12",      sub: "Papers and Manuscripts * 1 published · 5 under review",  desc: "One published in IEEE Xplore, five under review, two working papers on SSRN, three manuscripts and one in preparation." },
          { cx: 510, cy: 422, val: "4 domains", sub: "One Audit Protocol * TrustShift", desc: "Clinical risk, mental-health text, mortgage lending and network security: shift magnitude alone does not explain which axis fails." },
          { cx: 360, cy: 572, val: "50/250", sub: "SIH 2025 · SereneSpace * Smart India Hackathon",     desc: "Top 50 of 250 teams at the Smart India Hackathon with an anonymous student mental-health platform." },
          { cx: 540, cy: 552, val: "5+",     sub: "Live Deployments * Hugging Face · Vercel · Render",   desc: "Hugging Face Spaces, Vercel, Render and a PyPI package, all publicly accessible." },
          { cx: 440, cy: 612, val: "3 probes", sub: "Label-Free Shift Diagnosis * TrustShift", desc: "Prevalence change, a domain classifier and an importance-reweighting check, before labels arrive." }
        ]},
        { label: "FAIRNESS & IMPACT", cx: 190, cy: 320, color: "#34d399", nodes: [
          { cx: 80, cy: 250, val: "542",   sub: "Fewer Flagged per 100,000 * Federated Screening", desc: "Under a race-blind screening policy FedAvg flags 542 fewer reference-positive Black respondents per 100,000 than the centralised control." },
          { cx: 280, cy: 280, val: "0.0%",   sub: "False Deploy Rate · ICGDF Gate * 12 Folds",         desc: "The gate stayed closed across 12 folds and 1,512 out-of-sample days; a naive test would have deployed 11.8% of the time." },
          { cx: 120, cy: 400, val: "33-39%", sub: "Bias Caught by Equity Axis * ARIA Audit",           desc: "Failures caught by ARIA's equity axis that calibration, faithfulness and consistency missed." },
          { cx: 270, cy: 410, val: "108 / 240",   sub: "Evaluations Below Chance * Cross-Network Detection",      desc: "Cross-network transfer passes through chance rather than decaying to it; the worst run scores ROC-AUC 0.0697." },
          { cx: 40, cy: 330, val: "4 axes", sub: "Audit Dimensions · ARIA * Cal, Faith, Consist, Equity", desc: "Calibration, faithfulness, consistency and equity: four independent axes that expose different blind spots." }
        ]},
        { label: "BENCHMARKS", cx: 420, cy: 138, color: "#22d3ee", nodes: [
          { cx: 340, cy: 78, val: "0.785",   sub: "Recall@5 · RAG Hybrid * BM25 + FAISS + RRF",        desc: "Hybrid retrieval on the IndiaFinBench corpus, 9.7 points above dense-only." },
          { cx: 510, cy: 118, val: "IC+0.31", sub: "Alpha Signal · FinSight Energy * Walk-Forward",  desc: "Cross-sectional information coefficient in the Energy sector under strict walk-forward discipline." },
          { cx: 370, cy: 228, val: "1,512",   sub: "OOS Trading Days · ICGDF Gate * 2018-2024",      desc: "Twelve walk-forward folds: the gate stayed closed across every market regime tested." },
          { cx: 530, cy: 208, val: "12×",     sub: "Walk-Forward Folds · ICGDF * HAC Conjunctive",   desc: "A HAC and permutation conjunctive test held closed across every market regime tested." },
          { cx: 290, cy: 148, val: "+9.7 pp", sub: "RAG Recall@5 Gain * Hybrid vs Dense-Only",      desc: "Hybrid BM25, FAISS and RRF retrieval lifts Recall@5 from about 0.688 to 0.785 on regulatory QA." }
        ]}
      ];

    /* Mobile: the SVG constellation needs hover; touch can't. Render the same CATS
       data as a scannable list of metric cards, grouped by category. */
    (function buildImpactMobile() {
      var host = document.getElementById("impactMobileList");
      if (!host) return;
      var html = "";
      for (var c = 0; c < CATS.length; c++) {
        var g = CATS[c];
        html += '<h3 class="im-cat" style="--c:' + g.color + '">' + esc(g.label) + "</h3>";
        for (var n = 0; n < g.nodes.length; n++) {
          var nd = g.nodes[n];
          var parts = (nd.sub || "").split("*");
          var src = parts.length > 1 ? parts[1].trim() : g.label;
          html += '<article class="im-card" style="--c:' + g.color + '">'
                +   '<span class="im-val">' + esc(nd.val) + "</span>"
                +   '<span class="im-body"><span class="im-desc">' + esc(nd.desc) + "</span>"
                +     '<span class="im-src">' + esc(src) + "</span></span>"
                + "</article>";
        }
      }
      host.innerHTML = html;
    })();

    var hud      = document.getElementById("impactCentralHud");
    var hudValue = hud && hud.querySelector(".hud-value");
    var hudSub   = hud && hud.querySelector(".hud-sub");
    var hudDesc  = hud && hud.querySelector(".hud-desc");
    var centerNode = null;
    var spokeLines = null;

    var defaultHUD = {
      val:   "30 Metrics",
      sub:   "ML Research & Deployed Systems * Rajveer Singh Pall",
      desc:  "An end-to-end research portfolio spanning causal inference, federated learning, fairness audits, NLP benchmarking, and local AI systems. Hover any node to inspect the metric.",
      color: "#ffffff"
    };

    function renderSub(el, text, color) {
      if (!el) return;
      var parts = text.split("*");
      if (parts.length > 1) {
        el.innerHTML = esc(parts[0].trim())
          + ' <span style="color:' + color + ';text-shadow:0 0 8px '
          + hexToRgba(color, 0.32) + '">' + esc(parts[1].trim()) + "</span>";
      } else { el.textContent = text; }
    }

    function updateHUD(n, color, starLine) {
      if (!hud) return;
      if (hudValue) {
        hudValue.textContent      = n.val;
        hudValue.style.color      = color;
        hudValue.style.textShadow = "0 0 22px " + hexToRgba(color, 0.42);
      }
      renderSub(hudSub, n.sub, color);
      if (hudDesc) hudDesc.textContent = n.desc;
      if (centerNode) centerNode.setAttribute("fill", color);
      if (spokeLines) {
        spokeLines.forEach(function (ln) {
          var match = ln.getAttribute("stroke") === color;
          ln.setAttribute("stroke-opacity", match ? "0.55" : "0.02");
          ln.setAttribute("stroke-width",   match ? "1.75" : "1");
        });
      }
      if (starLine) {
        starLine.setAttribute("stroke-opacity", "0.62");
        starLine.setAttribute("stroke-width",   "1.75");
      }
    }

    function resetHUD(starLine) {
      if (!hud) return;
      if (hudValue) {
        hudValue.textContent      = defaultHUD.val;
        hudValue.style.color      = defaultHUD.color;
        hudValue.style.textShadow = "none";
      }
      if (hudSub) {
        var parts = defaultHUD.sub.split("*");
        hudSub.innerHTML = parts.length > 1
          ? esc(parts[0].trim()) + ' <span style="color:rgba(255,255,255,0.65)">'
            + esc(parts[1].trim()) + "</span>"
          : esc(defaultHUD.sub);
      }
      if (hudDesc) hudDesc.textContent = defaultHUD.desc;
      if (centerNode) centerNode.setAttribute("fill", defaultHUD.color);
      if (spokeLines) {
        spokeLines.forEach(function (ln) {
          ln.setAttribute("stroke-opacity", "0.05");
          ln.setAttribute("stroke-width",   "1");
        });
      }
      if (starLine) {
        starLine.setAttribute("stroke-opacity", "0.22");
        starLine.setAttribute("stroke-width",   "0.9");
      }
    }

    var drift = [];

    /* Phase 1: centre→hub spoke lines */
    var spokeG = e("g", { fill: "none" });
    CATS.forEach(function (c) {
      spokeG.appendChild(e("line", {
        x1: HCX, y1: HCY, x2: c.cx, y2: c.cy,
        stroke: c.color, "stroke-opacity": "0.05",
        "stroke-width": "1", class: "hud-spoke-line"
      }));
    });
    svg.appendChild(spokeG);
    spokeLines = Array.prototype.slice.call(svg.querySelectorAll(".hud-spoke-line"));

    /* Phase 2: hub→node branch lines */
    var branchG = e("g", { fill: "none" });
    CATS.forEach(function (c) {
      c.nodes.forEach(function (n) {
        n._sl = e("line", { x1: c.cx, y1: c.cy, x2: n.cx, y2: n.cy,
          stroke: c.color, "stroke-opacity": "0.22", "stroke-width": "0.9" });
        branchG.appendChild(n._sl);
      });
    });
    svg.appendChild(branchG);

    /* Phase 3: hub circles + pill labels */
    CATS.forEach(function (c) {
      var g = e("g", { class: "ig-hub" });
      g.appendChild(e("circle", { cx: c.cx, cy: c.cy, r: "18", fill: c.color, "fill-opacity": "0.05" }));
      g.appendChild(e("circle", { cx: c.cx, cy: c.cy, r: "10", fill: c.color, "fill-opacity": "0.07" }));
      g.appendChild(e("circle", { cx: c.cx, cy: c.cy, r: "5.5", fill: c.color, "fill-opacity": "0.85" }));
      var charW = 6.6, padX = 8, padY = 4, capH = 9;
      var rw = c.label.length * charW + padX * 2;
      var rh = capH + padY * 2;
      var ry0 = c.cy - 26 - rh;
      var rx0 = Math.max(4, Math.min(1300 - rw - 4, c.cx - rw / 2));
      g.appendChild(e("rect", { x: rx0, y: ry0, width: rw, height: rh, rx: "4",
        fill: c.color, "fill-opacity": "0.12", stroke: c.color, "stroke-opacity": "0.40", "stroke-width": "0.8" }));
      var lbl = e("text", { x: c.cx, y: ry0 + rh / 2 + capH * 0.38,
        class: "ig-hub-label", fill: c.color, "text-anchor": "middle" });
      lbl.textContent = c.label;
      g.appendChild(lbl);
      svg.appendChild(g);
    });

    /* Phase 4: data nodes */
    CATS.forEach(function (c) {
      c.nodes.forEach(function (n) {
        var starLine = n._sl;
        var labY = n.cy < 320 ? 20 : -12;
        var g = e("g", { class: "ig-node" });
        g.appendChild(e("circle", { cx: "0", cy: "0", r: "16", fill: c.color, "fill-opacity": "0.06" }));
        var dot = e("circle", { cx: "0", cy: "0", r: "7", fill: c.color, class: "ig-dot" });
        var valEl = e("text", { x: "0", y: String(labY), class: "ig-val", "text-anchor": "middle" });
        valEl.textContent = n.val;
        dot.addEventListener("mouseenter", function () { updateHUD(n, c.color, starLine); });
        dot.addEventListener("mouseleave", function () { resetHUD(starLine); });
        dot.addEventListener("focus",      function () { updateHUD(n, c.color, starLine); });
        dot.addEventListener("blur",       function () { resetHUD(starLine); });
        g.appendChild(dot);
        g.appendChild(valEl);
        g.setAttribute("transform", "translate(" + n.cx + "," + n.cy + ")");
        svg.appendChild(g);
        drift.push({ g: g, bx: n.cx, by: n.cy,
          amp: 1.6 + Math.random() * 2.2,
          ph:  Math.random() * Math.PI * 2,
          fq:  0.28 + Math.random() * 0.26 });
      });
    });

    /* Phase 5: pulsing centre node */
    centerNode = e("circle", { cx: HCX, cy: HCY, r: "5",
      fill: "#ffffff", id: "hudCenterNode", class: "hud-center-node-circle" });
    svg.appendChild(centerNode);

    /* Phase 6: drift animation */
    var t0 = null;
    function tick(ts) {
      if (!t0) t0 = ts;
      var t = (ts - t0) * 0.001;
      drift.forEach(function (d) {
        var dx = d.amp * Math.sin(d.fq * t + d.ph);
        var dy = d.amp * Math.cos(d.fq * t * 0.71 + d.ph * 1.13);
        d.g.setAttribute("transform",
          "translate(" + (d.bx + dx).toFixed(2) + "," + (d.by + dy).toFixed(2) + ")");
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    resetHUD(null);
  
  /* ------------------------------------------------------------------ */
  /*  3D Mouse Parallax Effect for Hero Section                          */
  /* ------------------------------------------------------------------ */
  (function initHeroParallax() {
    if (!fine || reduced || !hasGSAP) return;

    var hero = document.querySelector('.hero');
    var leftCol = document.getElementById('heroLeft');
    var photoCard = document.getElementById('heroPhotoCard');

    if (!hero || !leftCol || !photoCard) return;

    gsap.set(photoCard, { transformPerspective: 1000 });

    var leftX = gsap.quickTo(leftCol, "x", { duration: 0.5, ease: "power2" });
    var leftY = gsap.quickTo(leftCol, "y", { duration: 0.5, ease: "power2" });
    var cardRotX = gsap.quickTo(photoCard, "rotateX", { duration: 0.5, ease: "power2" });
    var cardRotY = gsap.quickTo(photoCard, "rotateY", { duration: 0.5, ease: "power2" });
    var cardX = gsap.quickTo(photoCard, "x", { duration: 0.5, ease: "power2" });
    var cardY = gsap.quickTo(photoCard, "y", { duration: 0.5, ease: "power2" });

    /* reference transforms: X,K in -1..1 from viewport centre;
       left col translate(X*8, K*5); portrait rotateY(X*7) rotateX(-K*5) translate(X*18, K*12) */
    hero.addEventListener("mousemove", function (e) {
      var X = (e.clientX / window.innerWidth - 0.5) * 2;
      var K = (e.clientY / window.innerHeight - 0.5) * 2;
      leftX(X * 8);  leftY(K * 5);
      cardX(X * 18); cardY(K * 12);
      cardRotY(X * 7); cardRotX(-K * 5);
    });

    hero.addEventListener("mouseleave", function () {
      leftX(0); leftY(0);
      cardX(0); cardY(0);
      cardRotX(0); cardRotY(0);
    });
  })();

})();

  /* ── Mobile nav — full-screen overlay (≤768) ──
     Built from the existing .nav-links so the six links never drift and the detail
     pages can reuse the identical pattern. Accessible: aria-expanded, focus-trap,
     Esc to close, body scroll-locked via Lenis, closes on link tap then scrolls. */
  (function initMobileNav() {
    var nav = document.querySelector(".nav");
    var srcLinks = document.querySelectorAll(".nav-links a");
    if (!nav || !srcLinks.length) return;

    var btn = document.createElement("button");
    btn.className = "nav-toggle";
    btn.type = "button";
    btn.setAttribute("aria-label", "Open menu");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "navOverlay");
    btn.innerHTML = "<span></span><span></span><span></span>";
    nav.appendChild(btn);

    var overlay = document.createElement("div");
    overlay.className = "nav-overlay";
    overlay.id = "navOverlay";
    overlay.setAttribute("aria-hidden", "true");
    var list = document.createElement("nav");
    list.className = "nav-overlay-links";
    list.setAttribute("aria-label", "Sections");
    var html = "";
    for (var i = 0; i < srcLinks.length; i++) {
      var href = srcLinks[i].getAttribute("href") || "#";
      var label = (srcLinks[i].textContent || "").trim();
      var num = ("0" + (i + 1)).slice(-2);
      html += '<a href="' + href + '"><span class="nav-overlay-idx">' + num + "</span>" + label + "</a>";
    }
    list.innerHTML = html;
    overlay.appendChild(list);
    document.body.appendChild(overlay);
    var links = overlay.querySelectorAll("a");

    function open() {
      overlay.classList.add("is-open");
      btn.classList.add("is-active");
      btn.setAttribute("aria-expanded", "true");
      btn.setAttribute("aria-label", "Close menu");
      overlay.setAttribute("aria-hidden", "false");
      document.documentElement.classList.add("nav-locked");
      if (lenis) lenis.stop();
      if (links[0]) links[0].focus();
      document.addEventListener("keydown", onKey);
    }
    function close() {
      overlay.classList.remove("is-open");
      btn.classList.remove("is-active");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "Open menu");
      overlay.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("nav-locked");
      if (lenis) lenis.start();
      document.removeEventListener("keydown", onKey);
    }
    function onKey(e) {
      if (e.key === "Escape") { close(); btn.focus(); return; }
      if (e.key === "Tab" && links.length) {
        var first = links[0], last = links[links.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    btn.addEventListener("click", function () {
      if (overlay.classList.contains("is-open")) close(); else open();
    });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) { close(); btn.focus(); } });
    Array.prototype.forEach.call(links, function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        close();
        if (id && id.charAt(0) === "#" && id.length > 1) {
          var target = document.querySelector(id);
          if (target) {
            e.preventDefault();
            if (lenis) lenis.scrollTo(target, { offset: -20 });
            else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
          }
        }
      });
    });
    /* if the viewport grows back to desktop while open, dismiss so it can't linger */
    window.matchMedia("(min-width: 769px)").addEventListener("change", function (e) {
      if (e.matches && overlay.classList.contains("is-open")) close();
    });
  })();

})();
