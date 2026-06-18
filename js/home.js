/* home.js — homepage chrome + interactions
   Constellation comes from field.js. Gold dot+ring cursor (distinct from reference). */
(function () {
  "use strict";
  var fine    = window.matchMedia("(pointer: fine)").matches;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof gsap !== "undefined";

  /* ── Gold dot + ring cursor ── */
  if (fine) {
    var dot = document.getElementById("cursorDot");
    var ring = document.getElementById("cursorRing");
    if (dot && ring) {
      var mx = -100, my = -100, rx = -100, ry = -100, on = false;
      document.addEventListener("mousemove", function (e) {
        mx = e.clientX; my = e.clientY;
        dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
        if (!on) { on = true; dot.style.opacity = "1"; ring.style.opacity = "1"; }
      }, { passive: true });
      (function loop() {
        rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
        ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
        requestAnimationFrame(loop);
      })();
      var SEL = 'a, button, [data-cursor], [role="button"]';
      document.addEventListener("mouseover", function (e) { if (e.target.closest && e.target.closest(SEL)) ring.classList.add("is-hover"); }, { passive: true });
      document.addEventListener("mouseout",  function (e) { if (e.target.closest && e.target.closest(SEL)) ring.classList.remove("is-hover"); }, { passive: true });
      document.addEventListener("mousedown", function () { ring.classList.add("is-click"); }, { passive: true });
      document.addEventListener("mouseup",   function () { ring.classList.remove("is-click"); }, { passive: true });
      document.addEventListener("mouseleave", function () { dot.style.opacity = "0"; ring.style.opacity = "0"; }, { passive: true });
    }
  }

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
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ── Spline 3D scene: lazy, gated injection ──
     Deferred until idle so it never blocks first paint; desktop + motion only;
     ?nospline=1 skips it (useful for headless perf checks). */
  (function () {
    var host = document.getElementById("heroSpline");
    var sk = document.getElementById("splineSkeleton");
    if (!host) return;
    var skip = /[?&]nospline=1/.test(window.location.search);
    var ok = fine && !reduced && window.innerWidth > 768 && !skip;
    if (!ok) { if (sk) sk.classList.add("gone"); return; }   /* mobile/reduced: constellation is the fallback */

    function inject() {
      var s = document.createElement("script");
      s.type = "module";
      s.src = "https://unpkg.com/@splinetool/viewer/build/spline-viewer.js";
      s.onload = function () {
        var v = document.createElement("spline-viewer");
        v.id = "splineViewer";
        v.setAttribute("url", host.getAttribute("data-spline"));
        v.addEventListener("load", function () { v.classList.add("loaded"); if (sk) sk.classList.add("gone"); });
        host.appendChild(v);
        setTimeout(function () { v.classList.add("loaded"); if (sk) sk.classList.add("gone"); }, 6000);
      };
      s.onerror = function () { if (sk) sk.classList.add("gone"); };
      document.head.appendChild(s);
    }
    function go() { ("requestIdleCallback" in window) ? requestIdleCallback(inject, { timeout: 2000 }) : setTimeout(inject, 1200); }
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go);
  })();

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
    function chip(name, logo) {
      return '<span class="stack-chip">' + (logo ? '<img src="'+L+logo+'" alt="" loading="lazy">' : "") + name + "</span>";
    }
    var groups = [
      ["Languages", [["Python","python.svg"],["C++","cplusplus.svg"],["C","c.svg"],["TypeScript","typescript.svg"],["Bash","gnubash.svg"]]],
      ["ML &amp; Deep Learning", [["PyTorch","pytorch.svg"],["scikit-learn","scikitlearn.svg"],["XGBoost","xgboost.png"],["LightGBM","lightgbm.svg"],["CatBoost","catboost.png"],["SHAP","shap.png"],["Unsloth","unsloth.png"],["Weights & Biases","weightsandbiases.svg"]]],
      ["Causal, Stats &amp; Data", [["pandas","pandas.svg"],["NumPy","numpy.svg"],["Polars",null],["statsmodels",null],["EconML",null]]],
      ["LLM, NLP &amp; RAG", [["Transformers","huggingface.svg"],["LangChain","langchain.svg"],["LangGraph","langgraph.svg"],["FAISS","faiss.svg"],["ChromaDB","chroma.svg"],["Ollama","ollama.svg"]]],
      ["Federated &amp; Privacy", [["Flower",null],["Opacus",null],["FedAvg / SCAFFOLD",null]]],
      ["Deployment &amp; Infra", [["FastAPI","fastapi.svg"],["Flask",null],["Next.js","nextjs.svg"],["React","react.svg"],["Three.js","threejs.svg"],["GSAP","gsap.svg"],["Docker","docker.svg"],["GCP","gcp-compute-engine.svg"],["Vercel","vercel.svg"],["GitHub Actions","githubactions.svg"]]]
    ];
    host.innerHTML = groups.map(function (g) {
      return '<div class="stack-group"><h3>' + g[0] + '</h3><div class="stack-items">' +
        g[1].map(function (it) { return chip(it[0], it[1]); }).join("") + "</div></div>";
    }).join("");
  })();

  /* ── Lenis smooth scroll ── */
  if (typeof Lenis !== "undefined" && !reduced) {
    var lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    if (hasGSAP) gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    else requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length > 1) { var t = document.querySelector(id); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -20 }); } }
      });
    });
  }

  /* ── GSAP reveals ── */
  if (hasGSAP && typeof ScrollTrigger !== "undefined" && !reduced) {
    gsap.registerPlugin(ScrollTrigger);
    /* hero entrance */
    gsap.to(".hero .reveal", { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "power3.out", delay: 0.2 });
    /* sections on scroll */
    gsap.utils.toArray(".section .reveal").forEach(function (el) {
      gsap.to(el, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" } });
    });
    ScrollTrigger.refresh();
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.style.opacity = "1"; el.style.transform = "none"; });
  }

  /* Safety net: content must never stay invisible if rAF/GSAP is throttled or fails.
     setTimeout fires independent of requestAnimationFrame. */
  setTimeout(function () {
    document.querySelectorAll(".reveal").forEach(function (el) {
      if (parseFloat(getComputedStyle(el).opacity) < 0.05) { el.style.opacity = "1"; el.style.transform = "none"; }
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
      { label: "MODEL PERFORMANCE", cx: 650, cy: 110, color: "#c9a25a", nodes: [
        { cx: 598, cy: 175, val: "~97%",   sub: "AUROC · Federated Diabetes * FedAvg/SCAFFOLD",     desc: "FedAvg/SCAFFOLD across heterogeneous NHANES nodes — validated on 1.28M BRFSS records." },
        { cx: 695, cy: 168, val: "0.98",   sub: "AUC · Mental Health NLP * CPFE / IEEE TNNLS",      desc: "Within-platform on Reddit & CLPsych — collapses 30–39% off-platform under domain shift." },
        { cx: 730, cy: 128, val: "9.4 pp", sub: "Racial Approval Gap · HMDA * CATE-HMDA",           desc: "Black approval penalty net of 33 controls — largest under manual underwriting, 42.3M apps." },
        { cx: 568, cy: 142, val: "89.7%",  sub: "Top LLM Score · IndiaFinBench * Gemini 2.5 Flash", desc: "Best of 12 LLMs on SEBI/RBI regulatory text — zero-shot closed-book evaluation." },
        { cx: 640, cy: 212, val: "#1 LLM", sub: "Gemini Rank · IndiaFinBench * vs. GPT-4o",         desc: "Gemini 2.5 Flash ranks first of 12 models including GPT-4o on Indian regulatory zero-shot QA." }
      ]},
      { label: "DATA SCALE", cx: 1010, cy: 189, color: "#38bdf8", nodes: [
        { cx: 895,  cy: 140, val: "42.3M",    sub: "Mortgage Records · CATE-HMDA * 2020–2024",          desc: "Every U.S. mortgage application — Causal Forest Double ML on the full HMDA dataset." },
        { cx: 958,  cy: 248, val: "1.28M",    sub: "BRFSS Validation Set * Federated Diabetes",         desc: "Never trained on — pure external generalisation test for the federated diabetes model." },
        { cx: 1062, cy: 262, val: "14,584",   sub: "S&P 500 Earnings Transcripts * FinSight",           desc: "Earnings calls from 601 S&P 500 firms, 2018–2024 — strict walk-forward backtest." },
        { cx: 1108, cy: 208, val: "406 QA",   sub: "Expert-Annotated Items * IndiaFinBench",            desc: "Expert-annotated across 192 SEBI/RBI documents — four task types, three difficulty tiers." },
        { cx: 1118, cy: 142, val: "601",      sub: "S&P 500 Firms · FinSight * 6-Year Corpus",          desc: "601 S&P 500 constituents — 6-year earnings corpus with sector-level walk-forward isolation." },
        { cx: 872,  cy: 238, val: "192 docs", sub: "Regulatory Documents * IndiaFinBench / SEBI & RBI", desc: "192 SEBI & RBI source documents annotated into 406 expert QA pairs, four task types." }
      ]},
      { label: "SYSTEMS BUILT", cx: 1098, cy: 367, color: "#c084fc", nodes: [
        { cx: 1158, cy: 312, val: "0",        sub: "Cloud LLM Calls · ARIA * Fully Local Pipeline",  desc: "Entire voice-to-voice pipeline on a single RTX 4060 — faster-whisper → Qwen3-8B → TTS." },
        { cx: 1185, cy: 400, val: "16",       sub: "Local Tool Registry · ARIA * Offline Routing",   desc: "Web search, calendar, code exec, system control — all routed through local LLM, offline." },
        { cx: 1175, cy: 448, val: "12 LLMs",  sub: "Models Benchmarked * IndiaFinBench / Zero-Shot", desc: "GPT-4o to Gemini 2.5 Flash — zero-shot closed-book on Indian financial regulatory text." },
        { cx: 1072, cy: 452, val: "1× GPU",   sub: "Consumer Hardware · ARIA * RTX 4060",            desc: "≤7.1 GB VRAM — single consumer GPU runs the entire ARIA multi-tool voice assistant." },
        { cx: 1028, cy: 418, val: "≤7.1 GB",  sub: "Peak VRAM · ARIA * RTX 4060 / 8 GB Card",       desc: "Entire faster-whisper → Qwen3-8B → TTS pipeline fits in 7.1 GB VRAM — consumer GPU only." }
      ]},
      { label: "RESEARCH OUTPUT", cx: 450, cy: 509, color: "#fcd34d", nodes: [
        { cx: 452, cy: 442, val: "6",      sub: "Manuscripts in Pipeline * Q1 Venues",                desc: "JREFE, JBI, IEEE TNNLS, QFE, EMNLP 2026, arXiv — submitted or under review." },
        { cx: 538, cy: 470, val: "3 Q1",   sub: "Top-Tier Journal Targets * JREFE, JBI, IEEE TNNLS",  desc: "J. Real Estate Finance & Economics · J. Biomedical Informatics · IEEE TNNLS." },
        { cx: 542, cy: 560, val: "50/250", sub: "SIH 2025 · SereneSpace * Smart India Hackathon",     desc: "Top 50 of 250 teams — Smart India Hackathon, anonymous student mental-health platform." },
        { cx: 428, cy: 582, val: "5+",     sub: "Live Deployments * HuggingFace · Vercel · Render",   desc: "HuggingFace Spaces · Vercel · Render · PyPI package — all publicly accessible." },
        { cx: 355, cy: 558, val: "EMNLP",  sub: "NLP Conference Target · 2026 * IndiaFinBench Paper", desc: "Empirical Methods in NLP 2026 — top-tier venue submission for the IndiaFinBench paper." }
      ]},
      { label: "FAIRNESS & IMPACT", cx: 202, cy: 367, color: "#34d399", nodes: [
        { cx: 132, cy: 318, val: "−40%",   sub: "Generalisation Gap Reduction * Federated Diabetes", desc: "Federated vs. matched centralised model — 40% smaller generalisation gap on 1.28M BRFSS." },
        { cx: 265, cy: 352, val: "0.0%",   sub: "False Deploy Rate · ICGDF Gate * 12 Folds",         desc: "Gate stayed closed across 12 folds and 1,512 OOS days — was 11.8% with naive deployment." },
        { cx: 118, cy: 420, val: "33–39%", sub: "Bias Caught by Equity Axis * ARIA Audit",           desc: "Failures caught by ARIA's equity axis that calibration, faithfulness, and consistency missed." },
        { cx: 172, cy: 448, val: "~35%",   sub: "AUC Collapse Under Domain Shift * CPFE Audit",      desc: "Mental-health classifiers scoring 0.98 in-domain collapse off-platform — fairness doesn't transfer." },
        { cx: 308, cy: 415, val: "4 axes", sub: "Audit Dimensions · ARIA * Cal, Faith, Consist, Equity", desc: "Calibration, faithfulness, consistency, equity — four independent axes expose LLM blind spots." }
      ]},
      { label: "BENCHMARKS", cx: 290, cy: 189, color: "#22d3ee", nodes: [
        { cx: 278, cy: 125, val: "0.785",   sub: "Recall@5 · RAG Hybrid * BM25+FAISS+RRF",        desc: "BM25 + FAISS + RRF retrieval — +9.7 pp over dense-only on IndiaFinBench." },
        { cx: 345, cy: 138, val: "IC+0.31", sub: "Alpha Signal · FinSight Energy * Walk-Forward",  desc: "Cross-sectional information coefficient in Energy sector under strict walk-forward discipline." },
        { cx: 198, cy: 205, val: "1,512",   sub: "OOS Trading Days · ICGDF Gate * 2018–2024",      desc: "12 walk-forward folds — gate stayed closed across every market regime, zero false deploys." },
        { cx: 358, cy: 242, val: "12×",     sub: "Walk-Forward Folds · ICGDF * HAC Conjunctive",   desc: "HAC + permutation conjunctive test held closed across every market regime tested." },
        { cx: 395, cy: 215, val: "+9.7 pp", sub: "RAG Recall@5 Gain * Hybrid vs. Dense-Only",      desc: "Hybrid BM25+FAISS+RRF vs dense-only — Recall@5 from ~0.688 to 0.785 on regulatory QA." }
      ]}
    ];

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
  })();

})();
