/* ═══════════════════════════════════════════════════════════
   DECISION FIELD — experience engine
   Lenis smooth scroll · GSAP ScrollTrigger choreography ·
   preloader · split-text reveals · thesis illumination ·
   cursor · magnetic · tilt · counters · chapter rail
   Everything degrades: no JS / no GSAP / reduced motion all
   leave a fully readable page.
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var hasGSAP = typeof gsap !== "undefined";

  /* ── Methods toolkit ── */
  var METHODS = [
    { name: "Python", slug: "python" },
    { name: "PyTorch", slug: "pytorch" },
    { name: "scikit-learn", slug: "scikitlearn" },
    { name: "Pandas", slug: "pandas" },
    { name: "NumPy", slug: "numpy" },
    { name: "Jupyter", slug: "jupyter" },
    { name: "Hugging Face", slug: "huggingface" },
    { name: "Ollama", slug: "ollama" },
    { name: "FastAPI", slug: "fastapi" },
    { name: "Flask", slug: "flask" },
    { name: "React", slug: "react" },
    { name: "Next.js", slug: "nextdotjs" },
    { name: "TypeScript", slug: "typescript" },
    { name: "Tailwind", slug: "tailwindcss" },
    { name: "PostgreSQL", slug: "postgresql" },
    { name: "Git", slug: "git" },
    { name: "Chart.js", slug: "chartdotjs" },
    { name: "Vercel", slug: "vercel" }
  ];

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }
  function initials(name) {
    return name.split(/[\s.-]+/).filter(Boolean).slice(0, 2)
      .map(function (w) { return w[0].toUpperCase(); }).join("");
  }

  function renderMethods() {
    var wrap = document.getElementById("methodsGrid");
    if (!wrap) return;
    wrap.innerHTML = METHODS.map(function (m) {
      return '<div class="method" title="' + esc(m.name) + '">' +
        '<div class="method-circle">' +
          '<img src="https://cdn.simpleicons.org/' + m.slug + '" alt="" loading="lazy" ' +
            'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\';">' +
          '<span class="method-fallback">' + esc(initials(m.name)) + '</span>' +
        '</div>' +
        '<span class="method-name">' + esc(m.name) + '</span>' +
      '</div>';
    }).join("");
  }

  /* ── split words into masked spans ── */
  function splitWords(el) {
    function process(node) {
      var children = Array.prototype.slice.call(node.childNodes);
      children.forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          var parts = child.textContent.split(/(\s+)/);
          parts.forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(" "));
            } else {
              var mask = document.createElement("span");
              mask.className = "sw-mask";
              var w = document.createElement("span");
              w.className = "sw";
              w.textContent = part;
              mask.appendChild(w);
              frag.appendChild(mask);
            }
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          process(child);
        }
      });
    }
    process(el);
    return el.querySelectorAll(".sw");
  }

  /* ── thesis word illumination prep ── */
  function prepThesis() {
    var el = document.getElementById("thesisText");
    if (!el) return null;
    var goldWords = ["benefits", "harmed", "fail", "improved", "decision"];
    var raw = el.textContent.trim().split(/\s+/);
    el.innerHTML = raw.map(function (word) {
      var clean = word.replace(/[^a-zA-Z-]/g, "").toLowerCase();
      var isGold = goldWords.some(function (g) { return clean.indexOf(g) === 0; });
      return '<span class="w' + (isGold ? " gold-w" : "") + '">' + esc(word) + "</span>";
    }).join(" ");
    return el.querySelectorAll(".w");
  }

  /* ── cursor ── */
  function initCursor() {
    if (!finePointer || reduced) return;
    var dot = document.getElementById("cursorDot");
    var ring = document.getElementById("cursorRing");
    if (!dot || !ring) return;
    var mx = 0, my = 0, rx = 0, ry = 0, started = false;

    document.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      if (!started) {
        started = true; rx = mx; ry = my;
        document.body.classList.add("cursor-on");
        loop();
      }
      dot.style.transform = "translate(" + (mx - 2.5) + "px," + (my - 2.5) + "px)";
    }, { passive: true });

    function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = "translate(" + (rx - ring.offsetWidth / 2) + "px," + (ry - ring.offsetHeight / 2) + "px)";
      requestAnimationFrame(loop);
    }

    document.addEventListener("mouseover", function (e) {
      if (e.target.closest("a, button, [data-cursor]")) document.body.classList.add("cursor-hover");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest("a, button, [data-cursor]")) document.body.classList.remove("cursor-hover");
    });
  }

  /* ── magnetic buttons ── */
  function initMagnetic() {
    if (!finePointer || reduced || !hasGSAP) return;
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var strength = 14;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        var y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        gsap.to(el, { x: x * strength, y: y * strength, duration: 0.4, ease: "power3.out" });
      });
      el.addEventListener("mouseleave", function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
      });
    });
  }

  /* ── card tilt ── */
  function initTilt() {
    if (!finePointer || reduced || !hasGSAP) return;
    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(el, {
          rotateY: x * 5, rotateX: -y * 5,
          transformPerspective: 900,
          duration: 0.5, ease: "power2.out"
        });
      });
      el.addEventListener("mouseleave", function () {
        gsap.to(el, { rotateY: 0, rotateX: 0, duration: 0.8, ease: "power3.out" });
      });
    });
  }

  /* ── main boot ── */
  function boot() {
    renderMethods();
    initCursor();

    var loaderEl = document.getElementById("loader");

    /* No GSAP (CDN blocked) or reduced motion: show everything plainly. */
    if (!hasGSAP || reduced) {
      if (loaderEl) loaderEl.classList.add("done");
      var words = prepThesis();
      if (words) words.forEach(function (w) { w.classList.add("lit"); });
      initPlainChrome();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    /* Lenis smooth scroll, wired into GSAP's ticker */
    var lenis = null;
    if (typeof Lenis !== "undefined") {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true });
      lenis.on("scroll", function (e) {
        ScrollTrigger.update();
        if (window.FIELD) window.FIELD.setVelocity(Math.abs(e.velocity || 0) / 90);
      });
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    /* split hero + chapter titles */
    var splitEls = document.querySelectorAll("[data-split]");
    splitEls.forEach(function (el) { splitWords(el); });
    document.body.classList.add("anim-ready");

    /* hide entrance states (JS-gated, so no-JS stays visible) */
    gsap.set(".prologue [data-split] .sw", { yPercent: 115 });
    gsap.set(".prologue .rise", { autoAlpha: 0, y: 26 });

    /* ═══ Preloader ═══ */
    var num = document.getElementById("loaderNum");
    var bar = document.getElementById("loaderBar");
    var counter = { v: 0 };
    var introPlayed = false;

    function playIntro() {
      if (introPlayed) return;
      introPlayed = true;
      var tl = gsap.timeline();
      tl.to(loaderEl, { autoAlpha: 0, duration: 0.8, ease: "power2.inOut" }, 0)
        .to(".prologue [data-split] .sw", {
          yPercent: 0, duration: 1.1, ease: "power4.out",
          stagger: { each: 0.045, from: "start" }
        }, 0.25)
        .to(".prologue .rise", {
          autoAlpha: 1, y: 0, duration: 1.0, ease: "power3.out", stagger: 0.14
        }, 0.7)
        .add(function () { if (loaderEl) loaderEl.classList.add("done"); });
    }

    gsap.timeline()
      .to(counter, {
        v: 100, duration: 1.5, ease: "power2.inOut",
        onUpdate: function () {
          if (num) num.textContent = (counter.v < 10 ? "0" : "") + Math.round(counter.v);
        }
      })
      .to(bar, { scaleX: 1, duration: 1.5, ease: "power2.inOut" }, 0)
      .add(playIntro, "+=0.1");

    /* absolute failsafe: nothing may stay hidden */
    setTimeout(function () {
      playIntro();
      gsap.set(".prologue [data-split] .sw, .prologue .rise", { clearProps: "all", autoAlpha: 1, yPercent: 0 });
      if (loaderEl) loaderEl.classList.add("done");
    }, 5000);

    /* ═══ Field morph choreography ═══ */
    var sectionIds = ["hero", "thesis", "inquiries", "instruments", "methods", "trajectory"];
    sectionIds.slice(1).forEach(function (id, i) {
      ScrollTrigger.create({
        trigger: "#" + id,
        start: "top bottom",
        end: "top 12%",
        scrub: true,
        onUpdate: function (self) {
          if (window.FIELD) window.FIELD.setMorph(i, self.progress);
        }
      });
    });

    /* ═══ Chapter rail + body label + nav active + field dim/clear ═══
       fade = global particle brightness; clear = how far the field
       parts around the reading column (1 = fully parted) */
    var FADE_BY_CHAPTER = {
      "Prologue": 1, "Thesis": 0.85, "Inquiries": 0.7,
      "Instruments": 0.7, "Methods": 0.75, "Trajectory": 0.95
    };
    var CLEAR_BY_CHAPTER = {
      "Prologue": 0, "Thesis": 0.85, "Inquiries": 1,
      "Instruments": 1, "Methods": 0.75, "Trajectory": 0.3
    };
    var rail = document.getElementById("railLabel");
    document.querySelectorAll("[data-label]").forEach(function (sec) {
      ScrollTrigger.create({
        trigger: sec,
        start: "top 45%",
        end: "bottom 45%",
        onToggle: function (self) {
          if (!self.isActive) return;
          var label = sec.getAttribute("data-label");
          if (window.FIELD && window.FIELD.setFade) {
            window.FIELD.setFade(FADE_BY_CHAPTER[label] != null ? FADE_BY_CHAPTER[label] : 1);
          }
          if (window.FIELD && window.FIELD.setClear) {
            window.FIELD.setClear(CLEAR_BY_CHAPTER[label] != null ? CLEAR_BY_CHAPTER[label] : 0);
          }
          if (rail && rail.textContent !== label) {
            gsap.fromTo(rail, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5 });
            rail.textContent = label;
          }
          document.body.setAttribute("data-chapter", label);
        }
      });
    });

    var navLinks = document.querySelectorAll(".nav-links a");
    navLinks.forEach(function (a) {
      var target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      ScrollTrigger.create({
        trigger: target,
        start: "top 45%",
        end: "bottom 45%",
        onToggle: function (self) {
          if (self.isActive) {
            navLinks.forEach(function (x) { x.classList.remove("active"); });
            a.classList.add("active");
          }
        }
      });
      /* smooth anchor via Lenis */
      a.addEventListener("click", function (e) {
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { offset: -40, duration: 1.6 });
        else target.scrollIntoView({ behavior: "smooth" });
      });
    });
    var brand = document.querySelector(".nav-brand");
    if (brand) brand.addEventListener("click", function (e) {
      e.preventDefault();
      if (lenis) lenis.scrollTo(0, { duration: 1.6 });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    });

    /* progress hairline + nav background */
    gsap.to("#progress", {
      scaleX: 1, ease: "none",
      scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 }
    });
    ScrollTrigger.create({
      start: 30, end: "max",
      onToggle: function (self) {
        document.getElementById("nav").classList.toggle("scrolled", self.isActive);
      }
    });

    /* ═══ Section entrances ═══ */
    document.querySelectorAll(".rv").forEach(function (el) {
      gsap.fromTo(el, { autoAlpha: 0, y: 38 }, {
        autoAlpha: 1, y: 0, duration: 1.1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });

    /* chapter-title word reveals (below the fold) */
    document.querySelectorAll(".chapter [data-split]").forEach(function (el) {
      var sws = el.querySelectorAll(".sw");
      gsap.fromTo(sws, { yPercent: 115 }, {
        yPercent: 0, duration: 0.9, ease: "power4.out", stagger: 0.06,
        scrollTrigger: { trigger: el, start: "top 90%", once: true }
      });
    });

    /* ═══ Thesis illumination (scrubbed) ═══ */
    var words = prepThesis();
    if (words && words.length) {
      var lit = -1;
      ScrollTrigger.create({
        trigger: "#thesisText",
        start: "top 85%",
        end: "bottom 42%",
        scrub: true,
        onUpdate: function (self) {
          var count = Math.floor(self.progress * words.length * 1.06);
          if (count === lit) return;
          lit = count;
          for (var i = 0; i < words.length; i++) {
            words[i].classList.toggle("lit", i < count);
          }
        }
      });
    }

    /* ═══ Stat counters ═══ */
    document.querySelectorAll("[data-counter]").forEach(function (el) {
      var end = parseFloat(el.getAttribute("data-counter"));
      var obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 88%", once: true,
        onEnter: function () {
          gsap.to(obj, {
            v: end, duration: 1.8, ease: "power3.out",
            onUpdate: function () { el.textContent = Math.round(obj.v); }
          });
        }
      });
    });

    initMagnetic();
    initTilt();

    /* keep ScrollTrigger honest once fonts/layout settle */
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });

    /* dev hook: /?at=sectionId jumps straight to a chapter with
       everything revealed (used for automated screenshots) */
    var at = new URLSearchParams(location.search).get("at");
    var atEl = at && document.getElementById(at);
    if (atEl) {
      introPlayed = true;
      if (loaderEl) loaderEl.classList.add("done");
      gsap.set(".prologue [data-split] .sw, .prologue .rise, .rv, .chapter [data-split] .sw", {
        clearProps: "all", autoAlpha: 1, yPercent: 0, y: 0
      });
      var jump = function () {
        if (lenis) lenis.stop();
        window.scrollTo(0, atEl.offsetTop + 10);
        ScrollTrigger.refresh();
        window.scrollTo(0, atEl.offsetTop + 10);
        ScrollTrigger.update();
        if (lenis) lenis.start();
      };
      window.addEventListener("load", function () { setTimeout(jump, 60); });
      setTimeout(jump, 800);
    }
  }

  /* minimal chrome for the no-GSAP / reduced-motion path */
  function initPlainChrome() {
    var bar = document.getElementById("progress");
    var nav = document.getElementById("nav");
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
      if (nav) nav.classList.toggle("scrolled", window.scrollY > 30);
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
