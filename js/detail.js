/* detail.js — chrome for project detail pages
   Canvas constellation from field.js (shared).
   Gold cursor · geolocation clock · scroll rail · Lenis · GSAP reveals · BottomRightHUD */
(function () {
  "use strict";
  var fine    = window.matchMedia("(pointer: fine)").matches;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof gsap !== "undefined";

  /* custom cursor removed — native cursor is used (no cursor:none injection) */

  /* ── Geolocation clock (Haversine nearest-airport) ── */
  (function () {
    /* [code, lat, lng, tz] */
    var AP = [
      ["BLR", 12.97, 77.59, "Asia/Kolkata"],
      ["BOM", 19.09, 72.87, "Asia/Kolkata"],
      ["DEL", 28.57, 77.10, "Asia/Kolkata"],
      ["HYD", 17.24, 78.43, "Asia/Kolkata"],
      ["MAA", 12.99, 80.17, "Asia/Kolkata"],
      ["CCU", 22.65, 88.45, "Asia/Kolkata"],
      ["NAG", 21.09, 79.05, "Asia/Kolkata"],
      ["LHR", 51.48, -0.46, "Europe/London"],
      ["CDG", 49.01,  2.55, "Europe/Paris"],
      ["AMS", 52.31,  4.76, "Europe/Amsterdam"],
      ["FRA", 50.04,  8.56, "Europe/Berlin"],
      ["MAD", 40.47, -3.56, "Europe/Madrid"],
      ["ZRH", 47.46,  8.55, "Europe/Zurich"],
      ["LIS", 38.77, -9.13, "Europe/Lisbon"],
      ["IST", 40.98, 28.81, "Europe/Istanbul"],
      ["MOW", 55.41, 37.90, "Europe/Moscow"],
      ["JFK", 40.64,-73.78, "America/New_York"],
      ["LAX", 33.94,-118.41,"America/Los_Angeles"],
      ["SFO", 37.62,-122.38,"America/Los_Angeles"],
      ["ORD", 41.97, -87.91,"America/Chicago"],
      ["YYZ", 43.68, -79.62,"America/Toronto"],
      ["YVR", 49.20,-123.18,"America/Vancouver"],
      ["GRU",-23.44, -46.47,"America/Sao_Paulo"],
      ["SCL",-33.39, -70.79,"America/Santiago"],
      ["DXB", 25.25,  55.37,"Asia/Dubai"],
      ["DOH", 25.27,  51.61,"Asia/Qatar"],
      ["SIN",  1.36, 103.99,"Asia/Singapore"],
      ["HKG", 22.31, 113.92,"Asia/Hong_Kong"],
      ["NRT", 35.77, 140.39,"Asia/Tokyo"],
      ["ICN", 37.46, 126.44,"Asia/Seoul"],
      ["PVG", 31.14, 121.81,"Asia/Shanghai"],
      ["PEK", 40.08, 116.60,"Asia/Shanghai"],
      ["SYD",-33.94, 151.18,"Australia/Sydney"],
      ["MEL",-37.67, 144.84,"Australia/Melbourne"],
      ["AKL",-37.01, 174.79,"Pacific/Auckland"],
      ["JNB",-26.14,  28.24,"Africa/Johannesburg"],
      ["CAI", 30.12,  31.41,"Africa/Cairo"]
    ];

    function hav(a1, o1, a2, o2) {
      var R = 6371, r = Math.PI / 180;
      var da = (a2 - a1) * r, do_ = (o2 - o1) * r;
      var x = Math.sin(da/2)*Math.sin(da/2) +
              Math.cos(a1*r)*Math.cos(a2*r)*Math.sin(do_/2)*Math.sin(do_/2);
      return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    }

    function nearest(lat, lng) {
      var best = AP[0], bestD = Infinity;
      for (var i = 0; i < AP.length; i++) {
        var d = hav(lat, lng, AP[i][1], AP[i][2]);
        if (d < bestD) { bestD = d; best = AP[i]; }
      }
      return best;
    }

    var el1  = document.getElementById("clockIST");
    var el2  = document.getElementById("clockUTC");
    var lbl2 = document.getElementById("hudVisitorLabel");
    if (!el1) return;

    function fmt(tz) {
      try {
        return new Intl.DateTimeFormat("en-GB", {
          timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
        }).format(new Date());
      } catch (e) { return "--:--:--"; }
    }

    var visTz   = "Asia/Kolkata";
    var visCode = "NAG";

    /* fallback: use browser's reported timezone */
    var IST = ["Asia/Kolkata", "Asia/Calcutta"];
    try {
      var btz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (btz && IST.indexOf(btz) === -1) {
        visTz = btz;
        visCode = "YOU";
        for (var i = 0; i < AP.length; i++) {
          if (AP[i][3] === btz) { visCode = AP[i][0]; break; }
        }
        if (lbl2) lbl2.textContent = visCode;
      }
    } catch (e) {}

    function tick() {
      if (el1) el1.textContent = fmt("Asia/Kolkata");
      if (el2) el2.textContent = fmt(visTz);
    }
    tick();
    setInterval(tick, 1000);

    /* refine with GPS if permitted */
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function (pos) {
        var ap = nearest(pos.coords.latitude, pos.coords.longitude);
        visTz   = ap[3];
        visCode = ap[0];
        if (lbl2) lbl2.textContent = visCode;
      }, null, { timeout: 5000, maximumAge: 3600000 });
    }
  })();

  /* ── Scroll rail ── */
  var railFill = document.getElementById("scrollRailFill");
  if (railFill) {
    (function raf() {
      var scrollMax = document.documentElement.scrollHeight - window.innerHeight;
      var p = scrollMax > 0 ? window.scrollY / scrollMax : 0;
      var h = Math.max(0.08, 0.22 * (1 - p * 0.4));
      railFill.style.height = (h * 100) + "%";
      railFill.style.top    = (p * (100 - h * 100)) + "%";
      requestAnimationFrame(raf);
    })();
  }

  /* ── Lenis smooth scroll ── */
  var lenis;
  if (typeof Lenis !== "undefined" && !reduced) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, touchMultiplier: 1.8, smoothWheel: true });
    if (hasGSAP) {
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      /* keep ScrollTrigger in lockstep with Lenis so reveals don't fire late and pop */
      if (typeof ScrollTrigger !== "undefined") lenis.on("scroll", ScrollTrigger.update);
    } else {
      requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
    }
  }

  /* ── GSAP reveal animations ── */
  if (hasGSAP && typeof ScrollTrigger !== "undefined" && !reduced) {
    gsap.registerPlugin(ScrollTrigger);

    gsap.timeline({ delay: 0.15 })
      .from(".back-link",    { opacity: 0, x: -20, duration: 0.5, ease: "power2.out" })
      .from(".th-badge",     { opacity: 0, y: 15,  duration: 0.5, ease: "power2.out" }, "-=0.3")
      .from(".th-title",     { opacity: 0, y: 30,  duration: 0.7, ease: "power3.out" }, "-=0.3")
      .from(".th-subtitle",  { opacity: 0, y: 20,  duration: 0.6, ease: "power2.out" }, "-=0.3")
      .from(".metric-block", { opacity: 0, y: 20,  duration: 0.5, stagger: 0.08, ease: "power2.out" }, "-=0.2");

    gsap.utils.toArray(".th-section").forEach(function (el) {
      gsap.from(el, {
        opacity: 0, y: 30, duration: 0.8, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" }
      });
    });

    gsap.utils.toArray(".method-diagram").forEach(function (el) {
      gsap.from(el, {
        opacity: 0, scale: 0.96, duration: 0.7, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" }
      });
    });

    ScrollTrigger.refresh();
  }

  /* Safety net: never leave content invisible if rAF/GSAP is throttled.
     Only force what's already in/above the viewport; below-fold animates on scroll. */
  setTimeout(function () {
    document.querySelectorAll(".th-section, .method-diagram").forEach(function (el) {
      var inView = el.getBoundingClientRect().top < window.innerHeight * 0.95;
      if (inView && parseFloat(getComputedStyle(el).opacity) < 0.05) { el.style.opacity = "1"; el.style.transform = "none"; }
    });
  }, 1600);

  /* ── Bottom Right HUD ── */
  (function () {
    var brh = document.getElementById("brh");
    if (!brh) return;

    /* session timer */
    var SK = "__portfolio_session_start";
    var start = parseInt(sessionStorage.getItem(SK), 10);
    if (!start || isNaN(start)) { start = Date.now(); sessionStorage.setItem(SK, start); }

    /* exploration tracker (12 project pages) */
    var EK = "__portfolio_explored_v2";
    var PAGES = [
      "index.html", "project-aria.html", "project-aria-audit.html", "project-cate-hmda.html",
      "project-cpfe.html", "project-diabetes-eval.html", "project-disparities.html",
      "project-federated-diabetes.html", "project-finsight.html", "project-finsight-web.html",
      "project-icgdf.html", "project-indiafinbench.html", "project-serenespace.html"
    ];
    var explored = {};
    try { explored = JSON.parse(localStorage.getItem(EK) || "{}"); } catch (e) {}
    var curPage = window.location.pathname.split("/").pop() || "";

    function saveDepth(d) {
      if (d > (explored[curPage] || 0)) explored[curPage] = d;
      try { localStorage.setItem(EK, JSON.stringify(explored)); } catch (e) {}
    }
    function explPct() {
      var s = 0;
      for (var i = 0; i < PAGES.length; i++) s += Math.min(explored[PAGES[i]] || 0, 1);
      return Math.round(s / PAGES.length * 100);
    }
    function arcCls(p) {
      return "brh " + (p >= 90 ? "brh-arc-green" : p >= 60 ? "brh-arc-blue" : p >= 20 ? "brh-arc-yellow" : "brh-arc-red");
    }

    var sessionEl = document.getElementById("brhSession");
    var exploreEl = document.getElementById("brhExplore");
    var xyEl      = document.getElementById("brhXY");
    var ringFill  = document.getElementById("brhRingFill");
    var scrollBtn = document.getElementById("brhScrollBtn");
    var CIRC = 94.25; /* 2 * PI * 15 */

    var mX = "0.00", mY = "0.00";
    document.addEventListener("mousemove", function (e) {
      mX = (e.clientX / window.innerWidth  * 2 - 1).toFixed(2);
      mY = (-(e.clientY / window.innerHeight * 2 - 1)).toFixed(2);
    }, { passive: true });

    if (scrollBtn) {
      scrollBtn.addEventListener("click", function () {
        if (lenis) lenis.scrollTo(0, { duration: 1.2 });
        else window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    function tick() {
      var elapsed = Math.floor((Date.now() - start) / 1000);
      var m = Math.floor(elapsed / 60), s = elapsed % 60;
      if (sessionEl) sessionEl.textContent = (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;

      var scrollMax = document.documentElement.scrollHeight - window.innerHeight;
      saveDepth(scrollMax > 0 ? window.scrollY / scrollMax : 0);

      var p = explPct();
      if (exploreEl) exploreEl.textContent = p + "%";
      brh.className = arcCls(p);

      if (ringFill) {
        var sp = scrollMax > 0 ? window.scrollY / scrollMax : 0;
        ringFill.style.strokeDashoffset = (CIRC * (1 - sp)).toFixed(2);
      }
      if (scrollBtn) scrollBtn.classList.toggle("visible", window.scrollY > 180);
      if (xyEl) xyEl.textContent = mX + ", " + mY;
    }

    tick();
    setInterval(tick, 1000);
    window.addEventListener("scroll", tick, { passive: true });
  })();

})();
