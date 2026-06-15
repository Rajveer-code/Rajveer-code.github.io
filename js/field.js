/* ═══════════════════════════════════════════════════════════
   THE DECISION FIELD — scroll-morphing particle universe
   One continuous WebGL point cloud that travels through six
   formations as the visitor scrolls:

     0 · Galaxy        — the unexamined universe of decisions
     1 · Neural lattice— the model that decides
     2 · Constellation — seven case files, seven clusters
     3 · Cube grid     — engineered order: the systems built
     4 · Torus         — the orbit of methods
     5 · Singularity   — convergence: the next phase

   Exposes window.FIELD = { setMorph, setVelocity, ready }
   Degrades gracefully: if WebGL/THREE fails, page still works.
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Public API stub — main.js can call these even if WebGL never boots */
  var FIELD = {
    setMorph: function () {},
    setVelocity: function () {},
    ready: false,
    onReady: null
  };
  window.FIELD = FIELD;

  function boot() {
    var THREE = window.THREE;
    var canvas = document.getElementById("field");
    if (!THREE || !canvas) return;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: false,
        alpha: true,
        powerPreference: "high-performance"
      });
    } catch (e) {
      console.warn("[field] WebGL unavailable:", e);
      return;
    }

    var isMobile = window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);
    var DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 1.75);
    var COUNT = isMobile ? 7000 : 14000;
    var SEGMENTS = 5; /* transitions between 6 formations */

    renderer.setPixelRatio(DPR);
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 240);

    /* ── seeded helpers ── */
    var seedState = 1337;
    function rand() {
      seedState = (seedState * 16807) % 2147483647;
      return (seedState - 1) / 2147483646;
    }
    function gauss() {
      var u = 0, v = 0;
      while (u === 0) u = rand();
      while (v === 0) v = rand();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    /* ── formation generators (each returns Float32Array COUNT*3) ── */

    function makeGalaxy() {
      var a = new Float32Array(COUNT * 3);
      for (var i = 0; i < COUNT; i++) {
        var j = i * 3;
        if (i < COUNT * 0.08) { /* core bulge */
          a[j] = gauss() * 1.6;
          a[j + 1] = gauss() * 1.0;
          a[j + 2] = gauss() * 1.6;
          continue;
        }
        var arm = i % 3;
        var rT = Math.pow(rand(), 0.62);
        var r = rT * 16;
        var ang = arm * (Math.PI * 2 / 3) + rT * 4.4 + (rand() - 0.5) * 0.4;
        a[j] = Math.cos(ang) * r;
        a[j + 1] = gauss() * 1.15 * (1 - rT * 0.72);
        a[j + 2] = Math.sin(ang) * r;
      }
      return a;
    }

    function makeLattice() {
      var a = new Float32Array(COUNT * 3);
      var LAYERS = 6, PER = 7;
      var nodes = [];
      for (var l = 0; l < LAYERS; l++) {
        for (var n = 0; n < PER; n++) {
          var ny = ((n % 3) - 1) * 5.2 + (rand() - 0.5) * 1.6;
          var nz = (Math.floor(n / 3) - 1) * 5.2 + (rand() - 0.5) * 1.6;
          nodes.push([-13 + l * (26 / (LAYERS - 1)), ny, nz]);
        }
      }
      for (var i = 0; i < COUNT; i++) {
        var j = i * 3;
        if (rand() < 0.5) { /* cluster on a node */
          var nd = nodes[Math.floor(rand() * nodes.length)];
          a[j] = nd[0] + gauss() * 0.55;
          a[j + 1] = nd[1] + gauss() * 0.55;
          a[j + 2] = nd[2] + gauss() * 0.55;
        } else { /* travel along an edge between adjacent layers */
          var la = Math.floor(rand() * (LAYERS - 1));
          var n1 = nodes[la * PER + Math.floor(rand() * PER)];
          var n2 = nodes[(la + 1) * PER + Math.floor(rand() * PER)];
          var t = rand();
          a[j] = n1[0] + (n2[0] - n1[0]) * t + (rand() - 0.5) * 0.24;
          a[j + 1] = n1[1] + (n2[1] - n1[1]) * t + (rand() - 0.5) * 0.24;
          a[j + 2] = n1[2] + (n2[2] - n1[2]) * t + (rand() - 0.5) * 0.24;
        }
      }
      return a;
    }

    function makeConstellation() {
      var a = new Float32Array(COUNT * 3);
      var CL = 7;
      var centers = [];
      for (var c = 0; c < CL; c++) {
        var ang = (c / CL) * Math.PI * 2 + 0.4;
        centers.push([
          Math.cos(ang) * 10.5,
          ((c % 3) - 1) * 3.4 + Math.sin(c * 2.1) * 1.4,
          Math.sin(ang) * 10.5
        ]);
      }
      for (var i = 0; i < COUNT; i++) {
        var j = i * 3;
        if (rand() < 0.78) { /* member of a case cluster */
          var ce = centers[i % CL];
          a[j] = ce[0] + gauss() * 1.7;
          a[j + 1] = ce[1] + gauss() * 1.7;
          a[j + 2] = ce[2] + gauss() * 1.7;
        } else { /* archival dust shell */
          var u = rand() * Math.PI * 2, v = Math.acos(2 * rand() - 1);
          var r = 15 + rand() * 4;
          a[j] = Math.sin(v) * Math.cos(u) * r;
          a[j + 1] = Math.cos(v) * r * 0.6;
          a[j + 2] = Math.sin(v) * Math.sin(u) * r;
        }
      }
      return a;
    }

    function makeCube() {
      var a = new Float32Array(COUNT * 3);
      var side = Math.floor(Math.cbrt(COUNT));
      var spacing = 19 / (side - 1);
      var i = 0;
      for (var x = 0; x < side && i < COUNT; x++)
        for (var y = 0; y < side && i < COUNT; y++)
          for (var z = 0; z < side && i < COUNT; z++) {
            var j = i * 3;
            a[j] = (x - (side - 1) / 2) * spacing + (rand() - 0.5) * 0.16;
            a[j + 1] = (y - (side - 1) / 2) * spacing + (rand() - 0.5) * 0.16;
            a[j + 2] = (z - (side - 1) / 2) * spacing + (rand() - 0.5) * 0.16;
            i++;
          }
      for (; i < COUNT; i++) { /* leftovers drift inside */
        var k = i * 3;
        a[k] = (rand() - 0.5) * 19;
        a[k + 1] = (rand() - 0.5) * 19;
        a[k + 2] = (rand() - 0.5) * 19;
      }
      return a;
    }

    function makeTorus() {
      var a = new Float32Array(COUNT * 3);
      for (var i = 0; i < COUNT; i++) {
        var j = i * 3;
        if (i % 5 === 0) { /* inner counter-ring */
          var u2 = rand() * Math.PI * 2;
          a[j] = Math.cos(u2) * 5.2 + gauss() * 0.3;
          a[j + 1] = Math.sin(u2) * 5.2 * 0.35 + gauss() * 0.3;
          a[j + 2] = Math.sin(u2) * 5.2 + gauss() * 0.3;
        } else {
          var u = rand() * Math.PI * 2;
          var v = rand() * Math.PI * 2;
          var R = 10.5, r = 2.6 * Math.sqrt(rand());
          a[j] = (R + r * Math.cos(v)) * Math.cos(u);
          a[j + 1] = r * Math.sin(v) * 0.9;
          a[j + 2] = (R + r * Math.cos(v)) * Math.sin(u);
        }
      }
      return a;
    }

    function makeSingularity() {
      var a = new Float32Array(COUNT * 3);
      for (var i = 0; i < COUNT; i++) {
        var j = i * 3;
        var p = rand();
        if (p < 0.66) { /* dense core — lifted above the closing copy */
          a[j] = gauss() * 1.0;
          a[j + 1] = 6.5 + gauss() * 1.0;
          a[j + 2] = gauss() * 1.0;
        } else if (p < 0.86) { /* vertical beam */
          a[j] = gauss() * 0.35;
          a[j + 1] = (rand() - 0.5) * 32;
          a[j + 2] = gauss() * 0.35;
        } else { /* far halo */
          var u = rand() * Math.PI * 2, v = Math.acos(2 * rand() - 1);
          var r = 16 + rand() * 6;
          a[j] = Math.sin(v) * Math.cos(u) * r;
          a[j + 1] = Math.cos(v) * r;
          a[j + 2] = Math.sin(v) * Math.sin(u) * r;
        }
      }
      return a;
    }

    var formations = [
      makeGalaxy(),
      makeLattice(),
      makeConstellation(),
      makeCube(),
      makeTorus(),
      makeSingularity()
    ];

    /* ── camera keyframes per formation ── */
    var camKeys = [
      { x: 0, y: 10, z: 26 },
      { x: 0, y: 2, z: 30 },
      { x: 0, y: 5, z: 29 },
      { x: 11, y: 9, z: 26 },
      { x: 0, y: 15, z: 24 },
      { x: 0, y: 0, z: 21 }
    ];

    /* ── geometry + per-particle attributes ── */
    var positions = new Float32Array(formations[0]); /* copy of galaxy */
    var colors = new Float32Array(COUNT * 3);
    var scales = new Float32Array(COUNT);
    var seeds = new Float32Array(COUNT);

    for (var i = 0; i < COUNT; i++) {
      var roll = rand();
      var int_ = 0.45 + rand() * 0.55;
      if (roll < 0.16) { /* gold */
        colors[i * 3] = 0.85 * int_; colors[i * 3 + 1] = 0.68 * int_; colors[i * 3 + 2] = 0.38 * int_;
      } else if (roll < 0.21) { /* ember (the rejected) */
        colors[i * 3] = 0.6 * int_; colors[i * 3 + 1] = 0.3 * int_; colors[i * 3 + 2] = 0.3 * int_;
      } else { /* warm ivory */
        colors[i * 3] = 0.93 * int_; colors[i * 3 + 1] = 0.9 * int_; colors[i * 3 + 2] = 0.84 * int_;
      }
      var s = rand();
      scales[i] = 0.5 + s * s * 2.8 + (rand() < 0.015 ? 2.5 : 0);
      seeds[i] = rand() * 100;
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    var mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 80 * DPR },
        uAgitation: { value: 0 },
        uFade: { value: 1 },
        uClear: { value: 0 }
      },
      vertexShader: [
        "attribute float aScale;",
        "attribute float aSeed;",
        "uniform float uTime;",
        "uniform float uSize;",
        "uniform float uAgitation;",
        "uniform float uClear;",
        "varying vec3 vColor;",
        "varying float vTw;",
        "varying float vClear;",
        "void main() {",
        "  vec3 p = position;",
        "  float amp = 0.14 + uAgitation;",
        "  p.x += sin(uTime * 0.31 + aSeed * 17.0) * amp;",
        "  p.y += cos(uTime * 0.27 + aSeed * 23.0) * amp;",
        "  p.z += sin(uTime * 0.23 + aSeed * 29.0) * amp;",
        "  vec4 mv = modelViewMatrix * vec4(p, 1.0);",
        "  gl_PointSize = uSize * aScale / max(0.001, -mv.z);",
        "  vTw = 0.72 + 0.28 * sin(uTime * 1.6 + aSeed * 51.0);",
        "  vColor = color;",
        "  vec4 clip = projectionMatrix * mv;",
        "  /* the field parts around the reading column: particles whose",
        "     screen-x falls inside the column get pushed to the margins",
        "     and faded, proportional to uClear (set per chapter) */",
        "  float nx = clip.x / max(0.0001, clip.w);",
        "  float inCol = 1.0 - smoothstep(0.5, 1.15, abs(nx));",
        "  float push = uClear * inCol;",
        "  float dir = nx >= 0.0 ? 1.0 : -1.0;",
        "  /* per-particle ease so the curtain feels organic, not mechanical */",
        "  float ease = 0.75 + 0.25 * sin(aSeed * 7.3);",
        "  clip.x += dir * push * ease * 1.05 * clip.w;",
        "  vClear = 1.0 - uClear * inCol * 0.85;",
        "  gl_Position = clip;",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform float uFade;",
        "varying vec3 vColor;",
        "varying float vTw;",
        "varying float vClear;",
        "void main() {",
        "  float d = length(gl_PointCoord - 0.5);",
        "  float a = smoothstep(0.5, 0.04, d);",
        "  a *= a;",
        "  gl_FragColor = vec4(vColor * vTw, a * 0.9 * uFade * vClear);",
        "}"
      ].join("\n")
    });

    var points = new THREE.Points(geo, mat);
    scene.add(points);

    /* ── distant static stars ── */
    var starGeo = new THREE.BufferGeometry();
    var starCount = isMobile ? 400 : 900;
    var starPos = new Float32Array(starCount * 3);
    for (var st = 0; st < starCount; st++) {
      var su = rand() * Math.PI * 2, sv = Math.acos(2 * rand() - 1);
      var sr = 70 + rand() * 50;
      starPos[st * 3] = Math.sin(sv) * Math.cos(su) * sr;
      starPos[st * 3 + 1] = Math.cos(sv) * sr;
      starPos[st * 3 + 2] = Math.sin(sv) * Math.sin(su) * sr;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xece7db,
      size: 1.3,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.38,
      depthWrite: false
    }));
    scene.add(stars);

    /* ── morph state ── */
    var morphTarget = 0;   /* continuous 0..SEGMENTS */
    var morphShown = 0;
    var velocity = 0;
    var mouse = { x: 0, y: 0 };
    var camDrift = { x: 0, y: 0 };
    var needsPos = true;

    FIELD.setMorph = function (segment, t) {
      morphTarget = Math.max(0, Math.min(SEGMENTS, segment + t));
    };
    FIELD.setVelocity = function (v) {
      velocity = Math.min(1, Math.abs(v));
    };
    var fadeTarget = 1;
    FIELD.setFade = function (v) {
      fadeTarget = Math.max(0.2, Math.min(1, v));
    };
    var clearTarget = 0;
    FIELD.setClear = function (v) {
      clearTarget = Math.max(0, Math.min(1, v));
    };

    function smoothstep01(t) { return t * t * (3 - 2 * t); }

    function updatePositions() {
      var g = morphShown;
      var i0 = Math.min(SEGMENTS, Math.floor(g));
      var i1 = Math.min(SEGMENTS, i0 + 1);
      var t = g - i0;
      var A = formations[i0], B = formations[i1];
      var arr = geo.attributes.position.array;
      for (var i = 0; i < COUNT; i++) {
        /* per-particle stagger so morphs ripple instead of snapping */
        var off = (seeds[i] % 10) * 0.022;
        var tp = smoothstep01(Math.max(0, Math.min(1, (t - off) / (1 - 0.22))));
        var j = i * 3;
        arr[j] = A[j] + (B[j] - A[j]) * tp;
        arr[j + 1] = A[j + 1] + (B[j + 1] - A[j + 1]) * tp;
        arr[j + 2] = A[j + 2] + (B[j + 2] - A[j + 2]) * tp;
      }
      geo.attributes.position.needsUpdate = true;
    }

    function updateCamera() {
      var g = morphShown;
      var i0 = Math.min(SEGMENTS, Math.floor(g));
      var i1 = Math.min(SEGMENTS, i0 + 1);
      var t = smoothstep01(g - i0);
      var a = camKeys[i0], b = camKeys[i1];
      camDrift.x += (mouse.x * 1.6 - camDrift.x) * 0.04;
      camDrift.y += (mouse.y * 1.0 - camDrift.y) * 0.04;
      camera.position.set(
        a.x + (b.x - a.x) * t + camDrift.x,
        a.y + (b.y - a.y) * t - camDrift.y,
        a.z + (b.z - a.z) * t
      );
      camera.lookAt(0, 0, 0);
    }

    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", function () { resize(); if (reduced) renderOnce(); });

    if (!isMobile) {
      window.addEventListener("mousemove", function (e) {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
      }, { passive: true });
    }

    /* ── render loop ── */
    var clock = new THREE.Clock();
    var running = true;

    function tick() {
      if (!running) return;
      var t = clock.getElapsedTime();
      mat.uniforms.uTime.value = t;
      mat.uniforms.uAgitation.value += (velocity * 0.9 - mat.uniforms.uAgitation.value) * 0.06;
      mat.uniforms.uFade.value += (fadeTarget - mat.uniforms.uFade.value) * 0.07;
      mat.uniforms.uClear.value += (clearTarget - mat.uniforms.uClear.value) * 0.055;
      velocity *= 0.94;

      var prev = morphShown;
      morphShown += (morphTarget - morphShown) * 0.085;
      if (needsPos || Math.abs(morphShown - prev) > 0.00035) {
        updatePositions();
        needsPos = false;
      }

      points.rotation.y = t * 0.035;
      stars.rotation.y = t * 0.005;
      updateCamera();
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }

    function renderOnce() {
      mat.uniforms.uTime.value = 1.5;
      updatePositions();
      updateCamera();
      renderer.render(scene, camera);
    }

    if (reduced) {
      /* static, dignified galaxy — dimmed so text always wins */
      FIELD.setMorph = function () {};
      mat.uniforms.uFade.value = 0.45;
      renderOnce();
    } else {
      requestAnimationFrame(tick);
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) { running = false; }
        else if (!running) { running = true; clock.start(); requestAnimationFrame(tick); }
      });
    }

    FIELD.ready = true;
    if (typeof FIELD.onReady === "function") FIELD.onReady();
  }

  if (window.THREE) boot();
  else window.addEventListener("three-ready", boot, { once: true });
})();
