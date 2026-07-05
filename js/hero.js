/* hero.js — native hero visual (replaces Spline). One engine, three field presets.
   Same perf discipline as field.js: no deps, DPR capped, no shadowBlur in the loop. */
(function () {
  "use strict";
  var cv = document.getElementById("heroVisual");
  if (!cv) return;
  var fine    = matchMedia("(pointer: fine)").matches;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var m = /[?&]hero=(\w+)/.exec(location.search);   /* override kept for testing */
  var PRESET = (m && m[1]) || "meridian";           /* shipped preset: meridian */

  var ctx = cv.getContext("2d");
  var W = 0, H = 0, DPR = 1, CX = 0, CY = 0;
  var px = 0, py = 0, tx = 0, ty = 0;          /* pointer parallax (lerped) */
  var running = false, raf = 0, t0 = performance.now();

  /* pre-rendered radial glow sprite — the cheap stand-in for shadowBlur */
  var glow = document.createElement("canvas");
  (function () {
    glow.width = glow.height = 64;
    var g = glow.getContext("2d");
    var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(214,178,110,0.55)");
    grad.addColorStop(0.4, "rgba(201,162,90,0.18)");
    grad.addColorStop(1, "rgba(201,162,90,0)");
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
  })();

  /* field functions: given (x, y, t) return flow angle */
  var FIELDS = {
    meridian: function (x, y, t) {           /* filaments streaming around a calm centre */
      var dx = x - CX, dy = y - CY;
      var r = Math.sqrt(dx * dx + dy * dy) + 1;
      return Math.atan2(dy, dx) + Math.PI / 2 + 0.5 * Math.sin(r * 0.004 - t * 0.00022);
    },
    orbit: function (x, y, t) {              /* elliptical orbits echoing the line-art rings */
      var dx = (x - CX) * 0.8, dy = (y - CY) * 1.25;
      return Math.atan2(dy, dx) + Math.PI / 2 + 0.08 * Math.sin(t * 0.0004);
    },
    signal: function (x, y, t) {             /* horizontal signal ridgelines */
      return 0.28 * Math.sin(y * 0.012 + t * 0.00035) + 0.12 * Math.sin(x * 0.006 - t * 0.0002);
    }
  };
  var field = FIELDS[PRESET] || FIELDS.meridian;

  var N = 140, P = [];
  function seed(i) {
    P[i] = { x: Math.random() * W, y: Math.random() * H,
             s: 0.35 + Math.random() * 0.65,               /* speed factor */
             life: 60 + Math.random() * 180, age: Math.random() * 180,
             glint: Math.random() < 0.12 };
  }
  function size() {
    DPR = Math.min(devicePixelRatio || 1, 1.5);
    W = cv.clientWidth; H = cv.clientHeight;
    if (!W || !H) return false;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    CX = W * 0.62; CY = H * 0.46;                          /* visual centre sits right-of-centre, behind the name */
    for (var i = 0; i < N; i++) seed(i);
    ctx.fillStyle = "rgba(6,8,12,1)"; ctx.fillRect(0, 0, W, H);
    return true;
  }

  function frameStep(t) {
    /* motion-trail fade instead of full clear — gives filaments without per-point history */
    ctx.fillStyle = "rgba(6,8,12,0.05)"; ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(201,162,90,0.34)";
    ctx.beginPath();
    for (var i = 0; i < N; i++) {
      var p = P[i];
      var a = field(p.x, p.y, t);
      var nx = p.x + Math.cos(a) * p.s * 2.2;
      var ny = p.y + Math.sin(a) * p.s * 2.2;
      ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny);
      p.x = nx; p.y = ny;
      if (++p.age > p.life || nx < -20 || nx > W + 20 || ny < -20 || ny > H + 20) seed(i);
    }
    ctx.stroke();
  }

  function frame(now) {
    var t = now - t0;
    px += (tx - px) * 0.04; py += (ty - py) * 0.04;
    ctx.save(); ctx.translate(px * 14, py * 10);
    frameStep(t);
    for (var j = 0; j < N; j++) {
      var q = P[j];
      if (q.glint) ctx.drawImage(glow, q.x - 7, q.y - 7, 14, 14);
    }
    ctx.restore();
    if (running) raf = requestAnimationFrame(frame);
  }

  function staticFrame() {                                  /* reduced-motion: one settled composition */
    for (var k = 0; k < 240; k++) frameStep(k * 16);
  }

  function start() { if (running || reduced) return; running = true; raf = requestAnimationFrame(frame); }
  function stop()  { running = false; cancelAnimationFrame(raf); }

  /* pause off-screen + when tab hidden */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }, { threshold: 0.02 })
      .observe(cv);
  }
  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  if (fine) addEventListener("pointermove", function (e) {
    tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5;
  }, { passive: true });

  var lastW = 0;
  addEventListener("resize", function () {
    if (innerWidth === lastW) return;                       /* ignore address-bar height-only resizes */
    lastW = innerWidth;
    if (size() && reduced) staticFrame();
  });

  function boot() {
    lastW = innerWidth;
    if (!size()) { setTimeout(boot, 120); return; }         /* harness can report 0 width at script time */
    if (reduced) { staticFrame(); return; }
    start();
  }
  boot();
})();
