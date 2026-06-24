/* ═══════════════════════════════════════════════════════════
   SPATIAL FIELD — animated constellation background
   Faithful vanilla port of the reference AIBackground:
   drifting stars + connection lattice + traveling glint-paths
   + activation pulses + mouse repulsion, opaque-black canvas,
   cached scanline texture, paused while the tab is hidden.
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  var canvas = document.getElementById("field");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  function mq(q) { return window.matchMedia(q).matches; }
  var mobile = mq("(max-width: 767px)");
  var touch = mq("(hover: none) and (pointer: coarse)");

  var STAR = mobile ? 40 : 95;
  var SHIM = mobile ? 40 : 58;
  var LINK = mobile ? 80 : 500;
  var LINK2 = LINK * LINK;
  var PATHS = mobile ? 80 : 460;
  var SPAWN = 20, PMIN = 0.001, PMAX = 0.004, SVEL = 0.4;

  /* waypoints for the long glint paths (mx/my = fraction of travel, kx = kink stage) */
  var WP = [
    { t: 0, mx: -0.52, my: -0.52, kx: 0 }, { t: 0.22, mx: -0.22, my: -0.2, kx: 0 },
    { t: 0.36, mx: -0.08, my: -0.06, kx: 1 }, { t: 0.51, mx: 0.1, my: 0.1, kx: 0 },
    { t: 0.67, mx: 0.26, my: 0.24, kx: 2 }, { t: 0.82, mx: 0.42, my: 0.4, kx: 0 },
    { t: 1, mx: 0.56, my: 0.56, kx: 0 }
  ];

  var stars = [], shim = [], paths = [], pulses = [], links = [];
  var frame = 0, mouse = { x: -9999, y: -9999 }, scan = null, raf = 0, running = true;

  function pathPos(p, prog, W, H) {
    var T = prog % 1, b = 0;
    while (b < WP.length - 1 && !(T < WP[b + 1].t)) b++;
    var h = WP[b], q = WP[b + 1] || h, a = q.t === h.t ? 0 : (T - h.t) / (q.t - h.t);
    var ox = h.mx * p.travelX + a * (q.mx * p.travelX - h.mx * p.travelX);
    var oy = h.my * p.travelY + a * (q.my * p.travelY - h.my * p.travelY);
    var kx = 0, ky = 0;
    if (h.kx === 1) { kx = p.k1x * (1 - a); ky = p.k1y * (1 - a); } else if (h.kx === 2) { kx = p.k2x * (1 - a); ky = p.k2y * (1 - a); }
    if (q.kx === 1) { kx += p.k1x * a; ky += p.k1y * a; } else if (q.kx === 2) { kx += p.k2x * a; ky += p.k2y * a; }
    return { x: p.baseX / 100 * W + ox + kx, y: p.baseY / 100 * H + oy + ky };
  }
  function shimO(prog) { var e = prog % 1; return 0.07 + 0.15 * (0.5 - 0.5 * Math.cos(e * Math.PI * 2)); }

  function makeScan(W, H) {
    if (mobile) { scan = null; return; }
    var k = document.createElement("canvas"); k.width = W; k.height = H;
    var m = k.getContext("2d"); m.fillStyle = "rgba(255,255,255,0.015)";
    for (var v = 0; v < H; v += 4) m.fillRect(0, v, W, 1);
    scan = k;
  }
  function genStars(W, H) {
    stars = [];
    for (var i = 0; i < STAR; i++) {
      var L = Math.floor(Math.random() * 3), vf = SVEL * (0.5 + L * 0.3);
      stars.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * vf, vy: (Math.random() - 0.5) * vf,
        radius: 0.8 + L * 0.4 + Math.random() * 0.3, pulse: Math.random() * Math.PI * 2, pulseSpeed: 0.04 + Math.random() * 0.03,
        layer: L, act: 0, actDur: 30 + Math.floor(Math.random() * 25) });
    }
  }
  function genShim(W, H) {
    shim = [];
    for (var i = 0; i < SHIM; i++) shim.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, radius: 0.5 + Math.random() * 1.5, alpha: 0.1 + Math.random() * 0.3, life: Math.random() });
  }
  function genPaths(W, H) {
    paths = [];
    var kw = W / 100, kh = H / 100;
    for (var i = 0; i < PATHS; i++) {
      var near = Math.random() < 0.42, dir = Math.random() < 0.86 ? 1 : -1;
      paths.push({
        baseX: Math.random() * 100, baseY: Math.random() * 100,
        travelX: dir * (near ? 60 + Math.random() * 58 : 40 + Math.random() * 40) * kw,
        travelY: (near ? -18 + Math.random() * 36 : -12 + Math.random() * 24) * kh,
        k1x: near ? -16 + Math.random() * 32 : -10 + Math.random() * 20, k1y: near ? -12 + Math.random() * 24 : -8 + Math.random() * 16,
        k2x: near ? -14 + Math.random() * 28 : -9 + Math.random() * 18, k2y: near ? -10 + Math.random() * 20 : -7 + Math.random() * 14,
        pathDur: near ? (22 + Math.random() * 16) * 60 : (32 + Math.random() * 22) * 60,
        shimDur: near ? (4.2 + Math.random() * 2.4) * 60 : (6 + Math.random() * 3) * 60,
        phase: Math.random(), size: near ? 2.8 + Math.random() * 4 : 1.5 + Math.random() * 2.6, near: near, offX: 0, offY: 0
      });
    }
  }
  var lastW = -1;
  function size() {
    var W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;
    /* Mobile address-bar show/hide fires resize with the SAME width, only height —
       don't rebuild the whole particle system for that (it janks scroll). Only a
       real width change regenerates; height-only just resizes the canvas. */
    if (W !== lastW) { genStars(W, H); genShim(W, H); genPaths(W, H); makeScan(W, H); lastW = W; }
  }
  function spawn() {
    var f = Math.floor(Math.random() * stars.length), k = stars[f], c = [];
    for (var i = 0; i < stars.length; i++) { if (i === f) continue; var dx = stars[i].x - k.x, dy = stars[i].y - k.y; if (dx * dx + dy * dy < LINK2) c.push(i); }
    if (!c.length) return;
    var to = c[Math.floor(Math.random() * c.length)];
    stars[f].act = stars[f].actDur;
    pulses.push({ from: f, to: to, prog: 0, speed: PMIN + Math.random() * (PMAX - PMIN) });
  }
  function grid(W, H) {
    if (mobile) return;
    var s = 50, off = frame * 0.02 % s;
    ctx.strokeStyle = "rgba(255,255,255,0.03)"; ctx.lineWidth = 0.5;
    for (var i = -off; i < W + s; i += s) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
    for (var j = -off; j < H + s; j += s) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(W, j); ctx.stroke(); }
  }

  function draw() {
    if (!running) return;
    var W = canvas.width, H = canvas.height;
    ctx.fillStyle = "rgba(0,0,0,1)"; ctx.fillRect(0, 0, W, H);
    grid(W, H);
    if (scan) ctx.drawImage(scan, 0, 0);
    frame++;
    if (frame % SPAWN === 0) spawn();

    var i;
    /* traveling glints */
    for (i = 0; i < paths.length; i++) {
      var p = paths[i];
      var d = pathPos(p, (frame + p.phase * p.pathDur) % p.pathDur / p.pathDur, W, H);
      var a = shimO((frame + p.phase * p.shimDur) % p.shimDur / p.shimDur);
      if (!touch) {
        var px = d.x - mouse.x, py = d.y - mouse.y, p2 = px * px + py * py, R = 150;
        if (p2 < R * R && p2 > 0) { var pd = Math.sqrt(p2), pf = (R - pd) / R * 42; p.offX += px / pd * pf; p.offY += py / pd * pf; }
      }
      p.offX *= 0.85; p.offY *= 0.85;
      if (p.offX > 200) p.offX = 200; if (p.offX < -200) p.offX = -200;
      if (p.offY > 200) p.offY = 200; if (p.offY < -200) p.offY = -200;
      var X = d.x + p.offX, Y = d.y + p.offY;
      if (X < -50 || X > W + 50 || Y < -50 || Y > H + 50) continue;
      ctx.save(); ctx.globalAlpha = a;
      /* shadowBlur is the single heaviest per-frame op; keep it only on the
         large "near" glints — far glints are tiny and read fine without a halo. */
      if (p.near) { ctx.shadowBlur = 22; ctx.shadowColor = "rgba(235,242,255,0.56)"; } else { ctx.shadowBlur = 0; }
      ctx.fillStyle = "rgba(248,250,255,0.97)";
      ctx.beginPath(); ctx.arc(X, Y, p.size * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    /* drifting shimmer dust */
    for (i = 0; i < shim.length; i++) {
      var s = shim[i]; s.x += s.vx; s.y += s.vy; s.life += 0.01; s.alpha = 0.2 + Math.sin(s.life) * 0.15;
      if (s.x < 0 || s.x > W) s.vx *= -1; if (s.y < 0 || s.y > H) s.vy *= -1;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255," + s.alpha + ")"; ctx.fill();
    }
    /* nodes move + mouse repulsion */
    for (i = 0; i < stars.length; i++) {
      var t = stars[i]; t.x += t.vx; t.y += t.vy; t.pulse += t.pulseSpeed; if (t.act > 0) t.act--;
      if (!touch) {
        var sx = t.x - mouse.x, sy = t.y - mouse.y, sd = sx * sx + sy * sy;
        if (sd < 32400 && sd > 0) { var sdist = Math.sqrt(sd), sf = (180 - sdist) / 180; t.x += sx / sdist * sf * 5.5; t.y += sy / sdist * sf * 5.5; }
      }
      if (t.x < 0 || t.x > W) { t.vx *= -1; t.x = Math.max(0, Math.min(W, t.x)); }
      if (t.y < 0 || t.y > H) { t.vy *= -1; t.y = Math.max(0, Math.min(H, t.y)); }
    }
    /* recompute connection list every 3 frames */
    if (frame % 3 === 0) {
      links = [];
      for (var u = 0; u < stars.length; u++) for (var w2 = u + 1; w2 < stars.length; w2++) {
        var ddx = stars[w2].x - stars[u].x, ddy = stars[w2].y - stars[u].y, dd = ddx * ddx + ddy * ddy;
        if (dd < LINK2) links.push({ i: u, j: w2, fade: 1 - Math.sqrt(dd) / LINK });
      }
    }
    ctx.lineWidth = 0.3;
    for (i = 0; i < links.length; i++) {
      var L = links[i];
      var lo = (stars[L.i].act > 0 || stars[L.j].act > 0) ? L.fade * 0.18 : L.fade * 0.05;
      ctx.beginPath(); ctx.moveTo(stars[L.i].x, stars[L.i].y); ctx.lineTo(stars[L.j].x, stars[L.j].y);
      ctx.strokeStyle = "rgba(255,255,255," + lo.toFixed(3) + ")"; ctx.stroke();
    }
    /* node dots */
    for (i = 0; i < stars.length; i++) {
      var t2 = stars[i], sc = 1 + Math.sin(t2.pulse) * 0.25;
      if (t2.act > 0) {
        var aa = t2.act / t2.actDur;
        ctx.beginPath(); ctx.arc(t2.x, t2.y, t2.radius * sc, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255," + (aa * 0.25).toFixed(3) + ")"; ctx.fill();
      } else {
        var yy = 0.08 + t2.layer * 0.04;
        ctx.beginPath(); ctx.arc(t2.x, t2.y, t2.radius * sc, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255," + yy.toFixed(3) + ")"; ctx.fill();
      }
    }
    /* signal pulses traveling between nodes */
    pulses = pulses.filter(function (t) {
      t.prog += t.speed;
      if (t.prog >= 1) { stars[t.to].act = stars[t.to].actDur; return false; }
      var s0 = stars[t.from], s1 = stars[t.to];
      var dx = s0.x + (s1.x - s0.x) * t.prog, dy = s0.y + (s1.y - s0.y) * t.prog;
      var tb = Math.max(0, t.prog - 0.25), X0 = s0.x + (s1.x - s0.x) * tb, Y0 = s0.y + (s1.y - s0.y) * tb;
      var g = ctx.createLinearGradient(X0, Y0, dx, dy);
      g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.6, "rgba(255,255,255,0.06)"); g.addColorStop(1, "rgba(255,255,255,0.12)");
      ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(dx, dy); ctx.strokeStyle = g; ctx.lineWidth = 0.8; ctx.stroke();
      var rg = ctx.createRadialGradient(dx, dy, 0, dx, dy, 3);
      rg.addColorStop(0, "rgba(255,255,255,0.18)"); rg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath(); ctx.arc(dx, dy, 3, 0, Math.PI * 2); ctx.fillStyle = rg; ctx.fill();
      return true;
    });

    raf = requestAnimationFrame(draw);
  }

  if (!touch) window.addEventListener("mousemove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(size, 150); }, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { running = false; cancelAnimationFrame(raf); }
    else if (!running) { running = true; raf = requestAnimationFrame(draw); }
  });

  size();
  raf = requestAnimationFrame(draw);
})();
