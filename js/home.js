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
    if (!loader) return;
    var seen = false;
    try { seen = sessionStorage.getItem("__seen") === "1"; sessionStorage.setItem("__seen", "1"); } catch (e) {}
    if (seen) { loader.parentNode.removeChild(loader); return; }   /* returning within session: no curtain */
    var done = false;
    function hide() {
      if (done) return; done = true;
      loader.classList.add("gone");
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
    var coords = {
      "Asia/Kolkata":[21.0,79.0],"Europe/London":[51.5,-0.1],"Europe/Paris":[48.9,2.4],"Europe/Berlin":[50.0,8.6],
      "Europe/Amsterdam":[52.3,4.8],"America/New_York":[40.6,-73.8],"America/Los_Angeles":[37.6,-122.4],
      "America/Chicago":[41.9,-87.9],"America/Toronto":[43.7,-79.6],"Asia/Dubai":[25.3,55.4],"Asia/Singapore":[1.4,104.0],
      "Asia/Hong_Kong":[22.3,113.9],"Asia/Tokyo":[35.8,140.4],"Asia/Seoul":[37.5,126.4],"Australia/Sydney":[-33.9,151.2],
      "America/Sao_Paulo":[-23.4,-46.5],"Africa/Johannesburg":[-26.1,28.2]
    };
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
    function hav(a, b) {
      var r = Math.PI/180, R = 6371;
      var dLat=(b[0]-a[0])*r, dLon=(b[1]-a[1])*r;
      var x = Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dLon/2)*Math.sin(dLon/2);
      return R*2*Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (pos) {
        var me = [pos.coords.latitude, pos.coords.longitude], best = null, bd = Infinity;
        for (var tz in coords) { var d = hav(me, coords[tz]); if (d < bd) { bd = d; best = tz; } }
        if (best) {
          visTz = best; visCode = "YOU";
          for (var i = 0; i < AP.length; i++) if (AP[i][1] === best) { visCode = AP[i][0]; break; }
          if (lblVis) lblVis.textContent = visCode;
        }
      }, null, { timeout: 5000, maximumAge: 3600000 });
    }
  })();

  /* ── Bottom-right HUD ── */
  (function () {
    var brh = document.getElementById("brh");
    if (!brh) return;
    var SK = "__portfolio_session_start";
    var start = parseInt(sessionStorage.getItem(SK), 10);
    if (!start || isNaN(start)) { start = Date.now(); sessionStorage.setItem(SK, start); }

    var EK = "__portfolio_explored_v2";
    var PAGES = ["index.html","project-aria.html","project-cate-hmda.html","project-cpfe.html",
      "project-federated-diabetes.html","project-finsight.html","project-icgdf.html","project-indiafinbench.html"];
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
               '<div class="stack-fable-label" style="flex: 0 0 140px; font-family: var(--mono); font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600; padding-top: 0.5rem; color: ' + labelColor + ';">' + g[0] + '</div>' +
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
    var HL = [
      { title: "Smart India Hackathon 2025", time: "Top 50 of 250",        sub: "SereneSpace — anonymous student mental-health" },
      { title: "Eight Research Papers",      time: "Q1 venues · 2025–26", sub: "Submitted / under review across four domains" },
      { title: "IndiaFinBench",              time: "LLM Benchmark",          sub: "Gemini 2.5 Flash 89.7% · 406 expert QA items" },
      { title: "FinSight",                   time: "Deployed System",        sub: "14,584 transcripts · IC +0.31 in Energy" },
      { title: "ARIA Assistant",             time: "Local-First Voice AI",   sub: "Zero cloud LLM calls · one RTX 4060" },
      { title: "CATE-HMDA",                  time: "JREFE · submitted",      sub: "42.3M applications · 9.4 pp approval gap" },
      { title: "Federated Diabetes",         time: "JBI · under review",     sub: "1.28M BRFSS · −40% generalisation gap" },
      { title: "ICGDF Deployment Gate",      time: "QFE · under review",     sub: "0.0% false deploy across 12 folds" }
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
    /* hero entrance */
    gsap.to(".hero .reveal", { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "power3.out", delay: 0.2 });
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
          { cx: 780, cy: 88, val: "~97%",   sub: "AUROC A Federated Diabetes * FedAvg/SCAFFOLD",     desc: "FedAvg/SCAFFOLD across heterogeneous NHANES nodes \u2014 validated on 1.28M BRFSS records." },
          { cx: 960, cy: 78, val: "0.98",   sub: "AUC A Mental Health NLP * CPFE / IEEE TNNLS",      desc: "Within-platform on Reddit & CLPsych \u2014 collapses 30\u201339% off-platform under domain shift." },
          { cx: 840, cy: 218, val: "9.4 pp", sub: "Racial Approval Gap A HMDA * CATE-HMDA",           desc: "Black approval penalty net of 33 controls \u2014 largest under manual underwriting, 42.3M apps." },
          { cx: 1000, cy: 188, val: "89.7%",  sub: "Top LLM Score A IndiaFinBench * Gemini 2.5 Flash", desc: "Best of 12 LLMs on SEBI/RBI regulatory text \u2014 zero-shot closed-book evaluation." },
          { cx: 900, cy: 248, val: "#1 LLM", sub: "Gemini Rank A IndiaFinBench * vs. GPT-4o",         desc: "Gemini 2.5 Flash ranks first of 12 models including GPT-4o on Indian regulatory zero-shot QA." }
        ]},
        { label: "DATA SCALE", cx: 1110, cy: 320, color: "#38bdf8", nodes: [
          { cx: 1020, cy: 240, val: "42.3M",    sub: "Mortgage Records A CATE-HMDA * 2020\u20132024",          desc: "Every U.S. mortgage application \u2014 Causal Forest Double ML on the full HMDA dataset." },
          { cx: 1210, cy: 260, val: "1.28M",    sub: "BRFSS Validation Set * Federated Diabetes",         desc: "Never trained on \u2014 pure external generalisation test for the federated diabetes model." },
          { cx: 990, cy: 360, val: "14,584",   sub: "S&P 500 Earnings Transcripts * FinSight",           desc: "Earnings calls from 601 S&P 500 firms, 2018\u20132024 \u2014 strict walk-forward backtest." },
          { cx: 1190, cy: 410, val: "601",      sub: "S&P 500 Firms A FinSight * 6-Year Corpus",          desc: "601 S&P 500 constituents \u2014 6-year earnings corpus with sector-level walk-forward isolation." },
          { cx: 1080, cy: 440, val: "192 docs", sub: "Regulatory Documents * IndiaFinBench / SEBI & RBI", desc: "192 SEBI & RBI source documents annotated into 406 expert QA pairs, four task types." }
        ]},
        { label: "SYSTEMS BUILT", cx: 880, cy: 502, color: "#c084fc", nodes: [
          { cx: 800, cy: 412, val: "0",        sub: "Cloud LLM Calls A ARIA * Fully Local Pipeline",  desc: "Entire voice-to-voice pipeline on a single RTX 4060 \u2014 faster-whisper + Qwen3-8B + TTS." },
          { cx: 990, cy: 452, val: "16",       sub: "Local Tool Registry A ARIA * Offline Routing",   desc: "Web search, calendar, code exec, system control \u2014 all routed through local LLM, offline." },
          { cx: 770, cy: 522, val: "12 LLMs",  sub: "Models Benchmarked * IndiaFinBench / Zero-Shot", desc: "GPT-4o to Gemini 2.5 Flash \u2014 zero-shot closed-book on Indian financial regulatory text." },
          { cx: 950, cy: 582, val: "1 GPU",   sub: "Consumer Hardware A ARIA * RTX 4060",            desc: "~ 7.1 GB VRAM \u2014 single consumer GPU runs the entire ARIA multi-tool voice assistant." },
          { cx: 860, cy: 602, val: "~ 7.1 GB",  sub: "Peak VRAM A ARIA * RTX 4060 / 8 GB Card",       desc: "Entire faster-whisper + Qwen3-8B + TTS pipeline fits in 7.1 GB VRAM \u2014 consumer GPU only." }
        ]},
        { label: "RESEARCH OUTPUT", cx: 420, cy: 502, color: "#fcd34d", nodes: [
          { cx: 320, cy: 442, val: "6",      sub: "Manuscripts in Pipeline * Q1 Venues",                desc: "JREFE, JBI, IEEE TNNLS, QFE, EMNLP 2026, arXiv \u2014 submitted or under review." },
          { cx: 510, cy: 422, val: "3 Q1",   sub: "Top-Tier Journal Targets * JREFE, JBI, IEEE TNNLS",  desc: "J. Real Estate Finance & Economics A J. Biomedical Informatics A IEEE TNNLS." },
          { cx: 360, cy: 572, val: "50/250", sub: "SIH 2025 A SereneSpace * Smart India Hackathon",     desc: "Top 50 of 250 teams \u2014 Smart India Hackathon, anonymous student mental-health platform." },
          { cx: 540, cy: 552, val: "5+",     sub: "Live Deployments * HuggingFace A Vercel A Render",   desc: "HuggingFace Spaces A Vercel A Render A PyPI package \u2014 all publicly accessible." },
          { cx: 440, cy: 612, val: "EMNLP",  sub: "NLP Conference Target A 2026 * IndiaFinBench Paper", desc: "Empirical Methods in NLP 2026 \u2014 top-tier venue submission for the IndiaFinBench paper." }
        ]},
        { label: "FAIRNESS & IMPACT", cx: 190, cy: 320, color: "#34d399", nodes: [
          { cx: 80, cy: 250, val: "-40%",   sub: "Generalisation Gap Reduction * Federated Diabetes", desc: "Federated vs. matched centralised model \u2014 40% smaller generalisation gap on 1.28M BRFSS." },
          { cx: 280, cy: 280, val: "0.0%",   sub: "False Deploy Rate A ICGDF Gate * 12 Folds",         desc: "Gate stayed closed across 12 folds and 1,512 OOS days \u2014 was 11.8% with naive deployment." },
          { cx: 120, cy: 400, val: "33-39%", sub: "Bias Caught by Equity Axis * ARIA Audit",           desc: "Failures caught by ARIA's equity axis that calibration, faithfulness, and consistency missed." },
          { cx: 270, cy: 410, val: "~35%",   sub: "AUC Collapse Under Domain Shift * CPFE Audit",      desc: "Mental-health classifiers scoring 0.98 in-domain collapse off-platform \u2014 fairness doesn't transfer." },
          { cx: 40, cy: 330, val: "4 axes", sub: "Audit Dimensions A ARIA * Cal, Faith, Consist, Equity", desc: "Calibration, faithfulness, consistency, equity \u2014 four independent axes expose LLM blind spots." }
        ]},
        { label: "BENCHMARKS", cx: 420, cy: 138, color: "#22d3ee", nodes: [
          { cx: 340, cy: 78, val: "0.785",   sub: "Recall@5 A RAG Hybrid * BM25+FAISS+RRF",        desc: "BM25 + FAISS + RRF retrieval \u2014 +9.7 pp over dense-only on IndiaFinBench." },
          { cx: 510, cy: 118, val: "IC+0.31", sub: "Alpha Signal A FinSight Energy * Walk-Forward",  desc: "Cross-sectional information coefficient in Energy sector under strict walk-forward discipline." },
          { cx: 370, cy: 228, val: "1,512",   sub: "OOS Trading Days A ICGDF Gate * 2018\u20132024",      desc: "12 walk-forward folds \u2014 gate stayed closed across every market regime, zero false deploys." },
          { cx: 530, cy: 208, val: "12X",     sub: "Walk-Forward Folds A ICGDF * HAC Conjunctive",   desc: "HAC + permutation conjunctive test held closed across every market regime tested." },
          { cx: 290, cy: 148, val: "+9.7 pp", sub: "RAG Recall@5 Gain * Hybrid vs. Dense-Only",      desc: "Hybrid BM25+FAISS+RRF vs dense-only \u2014 Recall@5 from ~0.688 to 0.785 on regulatory QA." }
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
      val:   "31 Metrics",
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
    var leftCol = document.querySelector('.hero-left');
    var photoCard = document.querySelector('.hero-photo-wrapper');
    
    if (!hero || !leftCol || !photoCard) return;

    // Quick setters for blazing fast performance
    var leftX = gsap.quickTo(leftCol, "x", { duration: 0.8, ease: "power3" });
    var leftY = gsap.quickTo(leftCol, "y", { duration: 0.8, ease: "power3" });
    
    var cardRotX = gsap.quickTo(photoCard, "rotateX", { duration: 0.5, ease: "power3" });
    var cardRotY = gsap.quickTo(photoCard, "rotateY", { duration: 0.5, ease: "power3" });
    var cardX = gsap.quickTo(photoCard, "x", { duration: 0.8, ease: "power3" });
    var cardY = gsap.quickTo(photoCard, "y", { duration: 0.8, ease: "power3" });

    hero.addEventListener("mousemove", function(e) {
      // Calculate normalized cursor position from center of screen (-1 to 1)
      var normX = (e.clientX / window.innerWidth) * 2 - 1;
      var normY = -(e.clientY / window.innerHeight) * 2 + 1; // Invert Y

      // Text column glides opposite to cursor
      leftX(normX * -20);
      leftY(normY * 15);
      
      // Image gently floats
      cardX(normX * 12);
      cardY(normY * -10);
      
      // The crucial 3D Bend/Tilt
      cardRotX(normY * 8); // Tilts up/down
      cardRotY(normX * 12); // Tilts left/right
    });

    hero.addEventListener("mouseleave", function() {
      // Smoothly snap back to origin
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
