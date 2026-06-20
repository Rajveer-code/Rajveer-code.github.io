import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  data — ordered by impressiveness, most impressive first            */
/* ------------------------------------------------------------------ */

export const RESEARCH_PAPERS = [
  {
    "url": "project-diabetes-eval.html",
    "color": "#10b981",
    "title": "Comprehensive Evaluation of Machine Learning for Type 2 Diabetes Risk Prediction",
    "sub": "XGBoost leads at 0.794 AUC internally but falls to 0.717 on an external population 83× larger — a 9.7% deployment gap. Age and BMI dominate SHAP; race/ethnicity ranks 4th, requiring explicit fairness audit.",
    "tags": ["XGBoost", "SHAP", "Fairness", "External validation"],
    "venue": "IEEE",
    "status": "Accepted · 2025"
  },
  {
    "url": "project-disparities.html",
    "color": "#f59e0b",
    "title": "Persistent Racial Disparities in U.S. Mortgage Approval: Evidence from 42 Million Applications, 2020–2024",
    "sub": "Five identification strategies — DFL, within-lender FE, RDD, DiD, Manski bounds — all confirm a 14.95 pp Black–White approval gap, ≥44% of which survives maximally adversarial selection assumptions.",
    "tags": ["Causal inference", "HMDA", "Partial identification", "RDD"],
    "venue": "J. Housing Economics",
    "status": "Submitted · March 2026"
  },
  {
    "url": "project-cpfe.html",
    "color": "#2dd4bf",
    "title": "Cross-Platform Generalisation Failure in Mental-Health NLP: A Five-Axis Fairness Audit",
    "sub": "Transformer classifiers that score AUC 0.98 within-platform collapse 30–39% off-platform, with calibration and equity failing in lockstep — fairness that doesn't transfer.",
    "tags": ["NLP", "Fairness", "Transformers", "Calibration"],
    "venue": "IEEE TNNLS",
    "status": "Submitted · 2026"
  },
  {
    "url": "project-cate-hmda.html",
    "color": "#60a5fa",
    "title": "Who Bears the Burden? Heterogeneous Racial Approval Differentials in U.S. Mortgage Lending",
    "sub": "Causal Forest Double Machine Learning on 42.3M HMDA applications, 2020–2024 — a 9.4 pp Black approval penalty net of 33 controls, largest under manual underwriting.",
    "tags": ["Causal inference", "EconML", "DML", "HMDA"],
    "venue": "J. Real Estate Finance & Economics",
    "status": "Submitted · 2026"
  },
  {
    "url": "project-federated-diabetes.html",
    "color": "#10b981",
    "title": "Privacy-Preserving Federated Learning for Diabetes Risk Across Demographically Heterogeneous Nodes",
    "sub": "FedAvg / FedProx / FedNova / SCAFFOLD on partitioned NHANES, externally validated on 1.28M BRFSS records — a 40% smaller generalisation gap than a matched centralised model.",
    "tags": ["Federated learning", "PyTorch", "Flower", "Differential privacy"],
    "venue": "J. Biomedical Informatics",
    "status": "Under review · 2026"
  },
  {
    "url": "project-icgdf.html",
    "color": "#a78bfa",
    "title": "When the Gate Stays Closed: Near-Zero Cross-Sectional Predictability in Large-Cap NASDAQ Equities",
    "sub": "An IC-gated deployment framework with a conjunctive HAC + permutation test — the gate never opened across 12 folds and 1,512 OOS days, cutting false deployment from 11.8% to 0.0%.",
    "tags": ["Quant ML", "Walk-forward", "CatBoost", "Permutation tests"],
    "venue": "Quantitative Finance & Economics",
    "status": "Under review · 2025"
  },
  {
    "url": "project-indiafinbench.html",
    "color": "#22d3ee",
    "title": "IndiaFinBench: Evaluating LLM Performance on Indian Financial Regulatory Text",
    "sub": "The first benchmark over SEBI and RBI regulation — 406 expert QA items, 192 documents, 12 LLMs scored zero-shot, plus a hybrid-RAG demo lifting Recall@5 to 0.785.",
    "tags": ["LLM evaluation", "RAG", "FAISS", "Benchmark"],
    "venue": "Target: EMNLP 2026",
    "status": "In preparation"
  },
  {
    "url": "project-aria-audit.html",
    "color": "#f5ca40",
    "title": "ARIA: Runtime 5-Axis Fairness Audit for Free-Form LLM Output",
    "sub": "Inline counterfactual disparate-impact and equalized-odds scoring on a model's actual generated text, not a fixed offline benchmark. Catches 33–39% of failures other guardrails miss, in ~1.2s, with zero cloud calls.",
    "tags": ["LLM fairness", "Runtime audit", "Counterfactual testing"],
    "venue": "arXiv preprint",
    "status": "Sep 2026"
  }
];

/* ------------------------------------------------------------------ */
/*  dom                                                                 */
/* ------------------------------------------------------------------ */

const track       = document.getElementById('researchTrack');
const glRoot       = document.getElementById('gl-research');
const workIndexEl  = document.getElementById('workIndex');
const workTitleEl  = document.getElementById('workTitle');
const pubList      = document.getElementById('pubList');
const viewToggle   = document.getElementById('researchViewToggle');
const cursorRing   = document.getElementById('cursorRing');

if (track && glRoot && pubList) {

  const isTouch = matchMedia('(pointer: coarse)').matches || innerWidth <= 768;

  function showListOnly() {
    track.classList.add('is-hidden');
    if (viewToggle) viewToggle.style.display = 'none';
    pubList.classList.remove('is-hidden');
  }

  /* must exist before initSpiral() runs — tick() reads it on its very first call */
  let trackVisible = true;

  if (isTouch) {
    showListOnly();
  } else {
    try { initSpiral(); } catch (err) { console.error('[spiral] init failed, falling back to list:', err); showListOnly(); }
  }

  /* ── view toggle (spiral / list) ── */
  if (viewToggle && !isTouch) {
    viewToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-view]');
      if (!btn) return;
      const view = btn.dataset.view;
      viewToggle.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('is-active', b === btn));
      if (view === 'list') {
        trackVisible = false;
        track.classList.add('is-hidden');
        pubList.classList.remove('is-hidden');
      } else {
        trackVisible = true;
        track.classList.remove('is-hidden');
        pubList.classList.add('is-hidden');
      }
    });
  }

  function initSpiral() {
    const N = RESEARCH_PAPERS.length;
    const ANGLE_STEP = 0.62;
    const TOTAL = N * ANGLE_STEP;
    const HALF = TOTAL / 2;
    const RADIUS = 6.2;
    const PITCH = 1.05;
    const PLANE_W = 3.4;
    const PLANE_H = 4.5;

    /* three.js setup */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, glRoot.clientWidth / glRoot.clientHeight, 0.1, 60);
    camera.position.set(0, 0, 8.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(glRoot.clientWidth, glRoot.clientHeight);
    renderer.setClearColor(0x000000, 0);
    glRoot.appendChild(renderer.domElement);

    /* shaders — motion blur + hover brighten + depth dim + rounded-corner mask */
    const VERT = `
      uniform float uVel;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 pos = position;
        float w = sin(uv.y * 3.14159265);
        pos.z -= w * uVel * 1.35;
        pos.x += w * uVel * 0.4;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;
    const FRAG = `
      uniform sampler2D uMap;
      uniform float uVel;
      uniform float uHover;
      uniform float uDim;
      varying vec2 vUv;
      void main() {
        float blur = clamp(abs(uVel), 0.0, 1.0) * 0.06;
        vec3 acc = vec3(0.0);
        for (int i = 0; i < 5; i++) {
          float t = float(i) / 4.0 - 0.5;
          acc += texture2D(uMap, vUv + vec2(uVel * 0.012, t * blur)).rgb;
        }
        acc /= 5.0;
        vec3 col = acc + vec3(uHover * 0.06);
        col *= uDim;
        vec2 r = vec2(0.05, 0.0375);
        vec2 q = abs(vUv - 0.5) - (vec2(0.5) - r);
        float d = length(max(q / r, 0.0));
        float alpha = 1.0 - step(1.0, d);
        gl_FragColor = vec4(col, alpha);
      }
    `;

    /* card texture — editorial data card: accent bar, venue, title, finding, tags, status, index */
    function createCardTexture(paper, index) {
      const c = document.createElement('canvas');
      c.width = 720; c.height = 960;
      const ctx = c.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 0, 960);
      grad.addColorStop(0, '#14151a');
      grad.addColorStop(1, '#070809');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 720, 960);

      ctx.fillStyle = paper.color;
      ctx.fillRect(0, 0, 720, 8);

      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, 719, 959);

      ctx.textBaseline = 'top';

      /* venue (top-left) + status (top-right) */
      ctx.font = '600 22px "Space Grotesk", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = paper.color;
      ctx.fillText(paper.venue.toUpperCase(), 48, 56);

      ctx.font = '500 18px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText(paper.status.toUpperCase(), 672, 60);

      function wrapText(text, x, y, maxWidth, lineHeight, maxLines) {
        const words = text.split(' ');
        let line = '', lines = 0;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          if (ctx.measureText(testLine).width > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
            lines++;
            if (maxLines && lines >= maxLines - 1) {
              let rest = words.slice(n + 1).join(' ');
              let last = line + rest;
              while (ctx.measureText(last + '…').width > maxWidth && last.length > 0) {
                last = last.slice(0, -1);
              }
              ctx.fillText(last.trimEnd() + (rest ? '…' : ''), x, y);
              return y + lineHeight;
            }
          } else { line = testLine; }
        }
        ctx.fillText(line, x, y);
        return y + lineHeight;
      }

      /* title */
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = '500 42px "Space Grotesk", sans-serif';
      let y = wrapText(paper.title, 48, 130, 624, 50, 4);

      /* finding */
      y += 28;
      ctx.font = '400 25px "DM Sans", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.58)';
      y = wrapText(paper.sub, 48, y, 624, 36, 5);

      /* tags as pills, bottom-anchored */
      const tagY = 800;
      let tx = 48;
      ctx.font = '500 18px "JetBrains Mono", monospace';
      paper.tags.forEach((tag) => {
        const w = ctx.measureText(tag).width + 28;
        if (tx + w > 690) return;
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(tx, tagY, w, 34, 17);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.textAlign = 'left';
        ctx.fillText(tag, tx + 14, tagY + 8);
        tx += w + 10;
      });

      /* big index, bottom-right */
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.font = '300 230px Georgia, serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(index + 1).padStart(2, '0'), 678, 925);

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    const items = [];
    RESEARCH_PAPERS.forEach((paper, i) => {
      const material = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uMap:   { value: createCardTexture(paper, i) },
          uVel:   { value: 0 },
          uHover: { value: 0 },
          uDim:   { value: 1 },
        },
        side: THREE.DoubleSide,
        transparent: true,
      });
      const geometry = new THREE.PlaneGeometry(PLANE_W, PLANE_H, 24, 32);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = { index: i, hover: 0, hoverTarget: 0, intro: 0, theta: 0, url: paper.url };
      mesh.scale.setScalar(0.0001);
      scene.add(mesh);
      items.push(mesh);
    });

    /* intro bloom-in once the section enters view */
    let intrPlayed = false;
    function playIntro() {
      if (intrPlayed) return;
      intrPlayed = true;
      items.forEach((mesh, i) => {
        if (typeof gsap !== 'undefined') {
          gsap.to(mesh.userData, { intro: 1, duration: 1.1, delay: i * 0.06, ease: 'expo.out' });
        } else { mesh.userData.intro = 1; }
      });
    }
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) playIntro(); });
      }, { threshold: 0.08 });
      io.observe(track);
    } else { playIntro(); }

    /* scroll-driven progress (page scroll through the 300vh track) */
    let scrollProgress = 0;
    function updateScroll() {
      const rect = track.getBoundingClientRect();
      const trackHeight = rect.height - innerHeight;
      if (trackHeight <= 0) return;
      scrollProgress = THREE.MathUtils.clamp(-rect.top / trackHeight, 0, 1);
    }
    addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();

    /* raycast hover / click */
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(0, 0);
    /* separate from `pointer` — pointer goes off-screen (-10,-10) on mouseleave so the
       raycaster never false-hits, but reusing that for camera parallax dragged the whole
       spiral off-center whenever the mouse wasn't actively over the canvas (e.g. while
       scrolling). This one eases back to (0,0) instead. */
    const parallax = new THREE.Vector2(0, 0);
    let hovered = null;

    function updateHover() {
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(items);
      const next = hits.length ? hits[0].object : null;
      if (hovered === next) return;
      if (hovered) hovered.userData.hoverTarget = 0;
      hovered = next;
      if (hovered) hovered.userData.hoverTarget = 1;
      glRoot.style.cursor = hovered ? 'pointer' : 'default';
      if (cursorRing) cursorRing.classList.toggle('is-hover', !!hovered);
    }

    glRoot.addEventListener('mousemove', (e) => {
      const rect = glRoot.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      parallax.copy(pointer);
    });
    glRoot.addEventListener('mouseleave', () => {
      pointer.set(-10, -10);
      parallax.set(0, 0);
      if (hovered) { hovered.userData.hoverTarget = 0; hovered = null; }
      if (cursorRing) cursorRing.classList.remove('is-hover');
    });
    glRoot.addEventListener('click', () => {
      if (hovered) location.href = hovered.userData.url;
    });

    /* HUD label */
    let currentWork = -1;
    function updateWorkLabel() {
      let best = 0, bestDist = Infinity;
      for (const mesh of items) {
        const d = Math.abs(mesh.userData.theta);
        if (d < bestDist) { bestDist = d; best = mesh.userData.index; }
      }
      if (best === currentWork) return;
      currentWork = best;
      if (workIndexEl && workTitleEl) {
        workIndexEl.textContent = String(best + 1).padStart(2, '0');
        workTitleEl.textContent = RESEARCH_PAPERS[best].title;
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(workTitleEl, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
        }
      }
    }

    /* render loop */
    let scrollCurrent = 0, velocity = 0, smoothVel = 0;
    const clock = new THREE.Clock();
    const camTarget = new THREE.Vector2(0, 0);

    function tick() {
      requestAnimationFrame(tick);
      if (!trackVisible) return;
      const dt = Math.min(clock.getDelta(), 0.05);

      const targetScroll = scrollProgress * TOTAL;
      scrollCurrent += (targetScroll - scrollCurrent) * (1 - Math.pow(0.0015, dt));
      velocity = targetScroll - scrollCurrent;
      smoothVel += (velocity - smoothVel) * 0.08;
      const velClamped = THREE.MathUtils.clamp(smoothVel, -0.9, 0.9);

      for (const mesh of items) {
        const u = mesh.userData;
        const theta = ((u.index * ANGLE_STEP - scrollCurrent + HALF) % TOTAL + TOTAL) % TOTAL - HALF;
        u.theta = theta;
        const sx = -Math.sin(theta) * RADIUS;
        const sy = -theta * PITCH;
        const sz = Math.cos(theta) * RADIUS - RADIUS;

        mesh.position.set(sx, sy, sz);
        mesh.rotation.y = -theta;

        u.hover += (u.hoverTarget - u.hover) * 0.1;
        mesh.scale.setScalar(Math.max((u.intro || 0) * (1 + u.hover * 0.05), 0.0001));

        const depthDim = THREE.MathUtils.clamp(THREE.MathUtils.mapLinear(sz, -RADIUS * 2, 0, 0.34, 1), 0.34, 1);
        mesh.material.uniforms.uDim.value = depthDim + u.hover * 0.05;
        mesh.material.uniforms.uVel.value = velClamped;
        mesh.material.uniforms.uHover.value = u.hover;
      }

      camTarget.x = parallax.x * 0.35;
      camTarget.y = parallax.y * 0.25;
      camera.position.x += (camTarget.x - camera.position.x) * 0.04;
      camera.position.y += (camTarget.y - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      updateHover();
      updateWorkLabel();
      renderer.render(scene, camera);
    }
    tick();

    function onResize() {
      camera.aspect = glRoot.clientWidth / glRoot.clientHeight;
      camera.position.z = camera.aspect < 0.9 ? 12 : 8.6;
      camera.updateProjectionMatrix();
      renderer.setSize(glRoot.clientWidth, glRoot.clientHeight);
    }
    addEventListener('resize', onResize);
    onResize();
  }
}
