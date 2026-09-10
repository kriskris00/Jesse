/* ==========================================================================
   SELAHX — Everywhere & Agentic WebGL Engine
   Apple Liquid Glass UI System (Powered by iyinchao/liquid-glass-studio optics)
   Features:
   - Pure Pitch Black (#000000) Atmospheric Void
   - Dynamic Multi-Palette Color Shifting (色彩流转)
   - Real-time Diagonal Caustic Light Sweep (全屏对角扫光穿透)
   - Apple Liquid Glass Studio Lens:
       * SDF Apple Squircle (Superellipse N=5.0) & Liquid Droplet
       * Smooth Minimum Organic Merge (smin)
       * Finite-Difference Surface Normal Vector
       * Snell's Law Physical Refraction
       * RGB Chromatic Dispersion (N_R=0.98, N_G=1.00, N_B=1.02)
       * 5th-Order Apple Fresnel Rim Highlight
       * Specular Glare Highlight with Mouse Angle Sweep
       * 100% Crystal-Clear Ultra-Transparent Interior
   - Liquid Glass Wave with Fresnel & IOR Dispersion
   - Hyperspace Light-speed Particle Warp
   - Ultra-Transparent Apple Liquid Glass Player Capsule
   ========================================================================== */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     1. 全局播放列表
     -------------------------------------------------------------------------- */
  const PLAYLIST = [
    { src: '1.mp3', title: 'SelahX Resonance', artist: 'Jesse / Liquid Glass Experience' },
    { src: 'background-music.mp3', title: 'Atmospheric Drift', artist: 'Wind & Reeds Acoustic' },
    { src: 'xxx.mp3', title: 'Obsidian Pulse Beat', artist: 'Sylva Sub Frequency' }
  ];

  let currentTrackIdx = 0;
  let isPlaying = false;
  let audioCtx = null;
  let analyser = null;
  let dataArray = null;
  let audioBass = 0;

  // 视口与交互状态
  let scrollProgress = 0;
  let targetScrollProgress = 0;
  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;
  let rawMouseX = window.innerWidth * 0.5, rawMouseY = window.innerHeight * 0.5;
  let windowWidth = window.innerWidth;
  let windowHeight = window.innerHeight;

  // Apple Liquid Glass Studio (iyinchao/liquid-glass-studio) 物理弹簧动力学变量
  let mouseSpringX = window.innerWidth * 0.5;
  let mouseSpringY = window.innerHeight * 0.5;
  let mouseSpringSpeedX = 0;
  let mouseSpringSpeedY = 0;
  let lastSpringTime = performance.now();

  /* --------------------------------------------------------------------------
     2. Three.js 初始化 (Pure Black Void #000000)
     -------------------------------------------------------------------------- */
  const container = document.getElementById('canvas-container');
  if (!container) return;

  const scene = new THREE.Scene();
  // 纯黑微雾 (Pure Pitch Black Fog)
  scene.fog = new THREE.FogExp2(0x000000, 0.015);

  const camera = new THREE.PerspectiveCamera(50, windowWidth / windowHeight, 0.1, 1200);
  camera.position.set(0, 1.4, 26);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(windowWidth, windowHeight);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 1.0); // 纯黑背景
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  container.appendChild(renderer.domElement);

  /* --------------------------------------------------------------------------
     3. 90,000 粒子森林 (动态色彩流转 + 扫光系统 + 通透)
     -------------------------------------------------------------------------- */
  const POINT_COUNT = 90000;
  const geometry = new THREE.BufferGeometry();

  const positions = new Float32Array(POINT_COUNT * 3);
  const origins = new Float32Array(POINT_COUNT * 3);
  const colors = new Float32Array(POINT_COUNT * 3);
  const scales = new Float32Array(POINT_COUNT);
  const phases = new Float32Array(POINT_COUNT);
  const types = new Float32Array(POINT_COUNT); // 0: ground, 1: trunk, 2: canopy, 3: stardust
  const velocities = new Float32Array(POINT_COUNT * 3);

  let pIdx = 0;

  // 3.1 地面植被 (45,000 点)
  const GROUND_COUNT = 45000;
  for (let i = 0; i < GROUND_COUNT; i++, pIdx++) {
    const x = (Math.random() - 0.5) * 115;
    const z = (Math.random() - 0.5) * 90 - 5;
    const y = -6.5 + Math.sin(x * 0.06) * Math.cos(z * 0.06) * 2.2 - Math.pow(x / 48.0, 2.0) * 0.9 + Math.sin(x * 0.18 + z * 0.18) * 0.45;

    positions[pIdx * 3] = x;
    positions[pIdx * 3 + 1] = y;
    positions[pIdx * 3 + 2] = z;

    origins[pIdx * 3] = x;
    origins[pIdx * 3 + 1] = y;
    origins[pIdx * 3 + 2] = z;

    const r = Math.random();
    if (r < 0.45) {
      colors[pIdx * 3] = 0.08;
      colors[pIdx * 3 + 1] = 0.78;
      colors[pIdx * 3 + 2] = 0.52;
    } else if (r < 0.78) {
      colors[pIdx * 3] = 0.12;
      colors[pIdx * 3 + 1] = 0.82;
      colors[pIdx * 3 + 2] = 0.92;
    } else {
      colors[pIdx * 3] = 0.92;
      colors[pIdx * 3 + 1] = 0.78;
      colors[pIdx * 3 + 2] = 0.45;
    }

    scales[pIdx] = 1.2 + Math.random() * 2.0;
    phases[pIdx] = Math.random() * Math.PI * 2;
    types[pIdx] = 0.0;
  }

  // 3.2 树干与花冠 (28,000 点)
  const TREE_POINTS = 28000;
  const TREE_COUNT = 24;
  const treeClusters = [];
  for (let t = 0; t < TREE_COUNT; t++) {
    treeClusters.push({
      x: (Math.random() - 0.5) * 95,
      z: (Math.random() - 0.5) * 75 - 10,
      height: 7.5 + Math.random() * 8.5,
      canopyRadius: 4.5 + Math.random() * 5.0
    });
  }

  for (let i = 0; i < TREE_POINTS; i++, pIdx++) {
    const cluster = treeClusters[Math.floor(Math.random() * treeClusters.length)];
    const isCanopy = Math.random() > 0.28;

    let x, y, z;
    if (!isCanopy) {
      const hProg = Math.random();
      x = cluster.x + (Math.random() - 0.5) * 0.95;
      y = -6.5 + hProg * cluster.height;
      z = cluster.z + (Math.random() - 0.5) * 0.95;

      colors[pIdx * 3] = 0.35;
      colors[pIdx * 3 + 1] = 0.48;
      colors[pIdx * 3 + 2] = 0.45;
      scales[pIdx] = 1.3 + Math.random() * 1.5;
      types[pIdx] = 1.0;
    } else {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * cluster.canopyRadius;

      x = cluster.x + r * Math.sin(phi) * Math.cos(theta);
      y = -6.5 + cluster.height + r * Math.cos(phi) * 0.75;
      z = cluster.z + r * Math.sin(phi) * Math.sin(theta);

      const pal = Math.random();
      if (pal < 0.36) {
        colors[pIdx * 3] = 0.65;
        colors[pIdx * 3 + 1] = 0.48;
        colors[pIdx * 3 + 2] = 0.85;
      } else if (pal < 0.72) {
        colors[pIdx * 3] = 0.15;
        colors[pIdx * 3 + 1] = 0.88;
        colors[pIdx * 3 + 2] = 0.95;
      } else {
        colors[pIdx * 3] = 0.98;
        colors[pIdx * 3 + 1] = 0.65;
        colors[pIdx * 3 + 2] = 0.75;
      }

      scales[pIdx] = 1.6 + Math.random() * 2.2;
      types[pIdx] = 2.0;
    }

    positions[pIdx * 3] = x;
    positions[pIdx * 3 + 1] = y;
    positions[pIdx * 3 + 2] = z;

    origins[pIdx * 3] = x;
    origins[pIdx * 3 + 1] = y;
    origins[pIdx * 3 + 2] = z;

    phases[pIdx] = Math.random() * Math.PI * 2;
  }

  // 3.3 浮动星尘与极光粒子 (17,000 点，覆盖视口全域及底部灵动岛背景)
  while (pIdx < POINT_COUNT) {
    const x = (Math.random() - 0.5) * 110;
    const y = -12.0 + Math.random() * 32.0;
    const z = -45.0 + Math.random() * 70.0;

    positions[pIdx * 3] = x;
    positions[pIdx * 3 + 1] = y;
    positions[pIdx * 3 + 2] = z;

    origins[pIdx * 3] = x;
    origins[pIdx * 3 + 1] = y;
    origins[pIdx * 3 + 2] = z;

    const r = Math.random();
    if (r < 0.35) {
      colors[pIdx * 3] = 0.2;
      colors[pIdx * 3 + 1] = 0.95;
      colors[pIdx * 3 + 2] = 1.0;
    } else if (r < 0.7) {
      colors[pIdx * 3] = 0.88;
      colors[pIdx * 3 + 1] = 0.55;
      colors[pIdx * 3 + 2] = 0.92;
    } else {
      colors[pIdx * 3] = 1.0;
      colors[pIdx * 3 + 1] = 0.88;
      colors[pIdx * 3 + 2] = 0.5;
    }

    scales[pIdx] = 1.2 + Math.random() * 2.4;
    phases[pIdx] = Math.random() * Math.PI * 2;
    types[pIdx] = 3.0;

    velocities[pIdx * 3] = (Math.random() - 0.5) * 0.2;
    velocities[pIdx * 3 + 1] = (Math.random() - 0.5) * 0.2;
    velocities[pIdx * 3 + 2] = -40.0 - Math.random() * 80.0;

    pIdx++;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aOrigin', new THREE.BufferAttribute(origins, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aType', new THREE.BufferAttribute(types, 1));
  geometry.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));

  // 3.4 点云着色器 (色彩流转 + 动态扫光穿透)
  const forestShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uWarp: { value: 0 },
      uBass: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uSweepPos: { value: -60.0 },
      uPixelRatio: { value: dpr }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uScroll;
      uniform float uWarp;
      uniform float uBass;
      uniform vec2 uMouse;
      uniform float uSweepPos;
      uniform float uPixelRatio;

      attribute vec3 aOrigin;
      attribute vec3 aColor;
      attribute float aScale;
      attribute float aPhase;
      attribute float aType;
      attribute vec3 aVelocity;

      varying vec3 vColor;
      varying float vAlpha;
      varying float vSweepHit;

      void main() {
        vec3 pos = aOrigin;

        // 微风摇曳与音频共振
        float sway = sin(uTime * 1.5 + aPhase) * (0.12 + uBass * 0.25);
        if (aType > 0.5) {
          pos.x += sway * (pos.y + 7.0) * 0.08;
          pos.z += cos(uTime * 1.2 + aPhase) * 0.1;
        }

        // 鼠标视差位移
        pos.x += uMouse.x * 2.0 * (1.0 + pos.z * 0.02);
        pos.y += uMouse.y * 1.5;

        // 平稳宁静空间粒子微漂移 (彻底移除抖动代码)
        pos.z += sin(uTime * 0.4 + aPhase) * 0.35;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // 动态对角线扫光判定
        float diagCoord = pos.x * 0.707 + pos.y * 0.707;
        float distToSweep = abs(diagCoord - uSweepPos);
        float sweepHit = smoothstep(14.0, 0.0, distToSweep);
        vSweepHit = sweepHit;

        // 色彩流转系统 (Color Shifting)
        float colorShiftTime = uTime * 0.22 + pos.x * 0.015 + pos.y * 0.02;
        vec3 shiftA = vec3(0.12, 0.92, 0.82); // 翡翠青
        vec3 shiftB = vec3(0.85, 0.45, 0.95); // 星云紫
        vec3 shiftC = vec3(1.00, 0.78, 0.42); // 太阳金

        float cycle = sin(colorShiftTime) * 0.5 + 0.5;
        float cycle2 = cos(colorShiftTime * 0.75) * 0.5 + 0.5;
        vec3 dynamicCol = mix(mix(shiftA, shiftB, cycle), shiftC, cycle2 * 0.45);

        vColor = mix(aColor, dynamicCol, 0.55);
        vColor += vec3(0.5, 0.65, 0.9) * sweepHit * 0.85;

        // 点大小与衰减
        float baseSize = aScale * (38.0 / -mvPosition.z) * uPixelRatio;

        gl_PointSize = clamp(baseSize, 1.0, 6.5);

        // 雾气与淡出
        float depthDist = -mvPosition.z;
        float fog = 1.0 - smoothstep(12.0, 95.0, depthDist);
        vAlpha = fog * (0.75 + sweepHit * 0.35);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      varying float vSweepHit;

      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;

        // 核心亮点与柔和高斯辉光边缘
        float core = 1.0 - smoothstep(0.0, 0.45, dist);
        float glow = pow(1.0 - dist * 2.0, 2.2);

        vec3 finalColor = vColor * (0.95 + vSweepHit * 0.6);
        float finalAlpha = (core * 0.7 + glow * 0.3) * vAlpha;

        gl_FragColor = vec4(finalColor, clamp(finalAlpha, 0.0, 1.0));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending
  });

  const forestPoints = new THREE.Points(geometry, forestShaderMaterial);
  scene.add(forestPoints);

  /* --------------------------------------------------------------------------
     5. 阶段 2：3D 液态水滴波纹 (Apple Liquid Glass Wave)
     -------------------------------------------------------------------------- */
  const waveGeo = new THREE.PlaneGeometry(80, 50, 120, 80);
  const waveShaderMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      uniform float uTime;
      uniform float uWaveProgress;
      uniform float uBass;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vUv = uv;
        vec3 pos = position;

        float wave1 = sin(pos.x * 0.16 + uTime * 1.4) * cos(pos.y * 0.14 + uTime * 1.0) * 3.8;
        float wave2 = sin(length(pos.xy) * 0.2 - uTime * 2.2) * 2.0;
        float ripple = sin(pos.x * 0.35 + pos.y * 0.25 + uTime * 2.5) * (0.6 + uBass * 1.2);

        pos.z += (wave1 + wave2 + ripple) * uWaveProgress;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vViewPosition = -mvPosition.xyz;
        vNormal = normalize(normalMatrix * normal);

        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uWaveProgress;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        if (uWaveProgress <= 0.001) discard;

        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);

        float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);

        vec3 colWarmGold = vec3(0.72, 0.50, 0.32);
        vec3 colLilac = vec3(0.65, 0.46, 0.60);
        vec3 colCyan = vec3(0.0, 0.85, 1.0);

        float caustic = pow(sin(vUv.x * 24.0 + vUv.y * 18.0 + uTime * 2.4) * 0.5 + 0.5, 5.0);
        vec3 glassColor = mix(colWarmGold, colLilac, sin(vUv.x * 3.14 + uTime) * 0.5 + 0.5);
        glassColor += colCyan * fresnel * 0.8;
        glassColor += vec3(0.95, 0.95, 1.0) * caustic * 0.5;

        float alpha = (fresnel * 0.6 + caustic * 0.35 + 0.05) * uWaveProgress;
        gl_FragColor = vec4(glassColor, clamp(alpha, 0.0, 0.82));
      }
    `,
    uniforms: {
      uTime: { value: 0 },
      uWaveProgress: { value: 0 },
      uBass: { value: 0 }
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });

  const liquidWaveMesh = new THREE.Mesh(waveGeo, waveShaderMaterial);
  liquidWaveMesh.position.set(0, 0, 4);
  scene.add(liquidWaveMesh);

  /* --------------------------------------------------------------------------
     6. 滚动监听
     -------------------------------------------------------------------------- */
  function handleScroll() {
    const totalHeight = document.documentElement.scrollHeight - windowHeight;
    const currentY = window.pageYOffset || document.documentElement.scrollTop;
    targetScrollProgress = totalHeight > 0 ? Math.min(Math.max(currentY / totalHeight, 0), 1) : 0;
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  /* --------------------------------------------------------------------------
     7. 鼠标交互与平滑阻尼
     -------------------------------------------------------------------------- */
  window.addEventListener('mousemove', (e) => {
    rawMouseX = e.clientX;
    rawMouseY = e.clientY;
    targetMouseX = (e.clientX / windowWidth) * 2 - 1;
    targetMouseY = -(e.clientY / windowHeight) * 2 + 1;
  });

  window.addEventListener('resize', () => {
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    camera.aspect = windowWidth / windowHeight;
    camera.updateProjectionMatrix();

    const curDpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setSize(windowWidth, windowHeight);
    renderer.setPixelRatio(curDpr);

    forestShaderMaterial.uniforms.uPixelRatio.value = curDpr;

  });

  /* --------------------------------------------------------------------------
     8. SelahX 底部药丸 (纯通透 Apple Liquid Glass + 完美音频控制)
     -------------------------------------------------------------------------- */
  const bgAudio = document.getElementById('bgAudio');
  const agenticDockPill = document.getElementById('agenticDockPill');
  const dockTrackTitle = document.getElementById('dockTrackTitle');
  const pillQuickPlayBtn = document.getElementById('pillQuickPlayBtn');
  const pillMenuTrigger = document.getElementById('pillMenuTrigger');
  const dockPlayBtn = document.getElementById('dockPlayBtn');
  const dockPrevBtn = document.getElementById('dockPrevBtn');
  const dockNextBtn = document.getElementById('dockNextBtn');
  const expandedTitle = document.getElementById('expandedTitle');
  const expandedArtist = document.getElementById('expandedArtist');
  const eqBars = document.querySelectorAll('.mini-eq-bar');

  function loadTrack(idx) {
    currentTrackIdx = (idx + PLAYLIST.length) % PLAYLIST.length;
    const track = PLAYLIST[currentTrackIdx];
    if (bgAudio) bgAudio.src = track.src;
    if (dockTrackTitle) dockTrackTitle.textContent = track.title;
    if (expandedTitle) expandedTitle.textContent = track.title;
    if (expandedArtist) expandedArtist.textContent = track.artist;
  }
  loadTrack(0);

  function initAudioContext() {
    if (audioCtx) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.85;

      try {
        const source = audioCtx.createMediaElementSource(bgAudio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
      } catch (mediaErr) {
        console.warn('Media element source restriction fallback:', mediaErr);
      }

      dataArray = new Uint8Array(analyser.frequencyBinCount);
    } catch (err) {
      console.warn('Web Audio API context restricted:', err);
    }
  }

  function togglePlay(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      initAudioContext();
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    } catch (err) {}

    if (!isPlaying) {
      isPlaying = true;
      updatePlayStateUI();
      try {
        const p = bgAudio.play();
        if (p !== undefined) {
          p.catch(err => {
            console.warn('Audio playback notice:', err);
          });
        }
      } catch (err) {
        console.warn('Audio play exception:', err);
      }
    } else {
      bgAudio.pause();
      isPlaying = false;
      updatePlayStateUI();
    }
  }

  function updatePlayStateUI() {
    if (agenticDockPill) {
      agenticDockPill.classList.toggle('is-playing', isPlaying);
    }
    const playSvg = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-left:2px;">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>`;
    const pauseSvg = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
      </svg>`;
    const quickPlaySvg = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-left:1px;">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>`;
    const quickPauseSvg = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
      </svg>`;

    if (dockPlayBtn) {
      dockPlayBtn.innerHTML = isPlaying ? pauseSvg : playSvg;
    }
    if (pillQuickPlayBtn) {
      pillQuickPlayBtn.innerHTML = isPlaying ? quickPauseSvg : quickPlaySvg;
    }
  }

  // 按钮事件监听器 (全部配置 stopPropagation 避免误触收起)
  if (pillQuickPlayBtn) {
    pillQuickPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlay(e);
    });
  }

  if (dockPlayBtn) {
    dockPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlay(e);
    });
  }

  if (dockPrevBtn) {
    dockPrevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      loadTrack(currentTrackIdx - 1);
      if (isPlaying) bgAudio.play().catch(() => {});
      updatePlayStateUI();
    });
  }

  if (dockNextBtn) {
    dockNextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      loadTrack(currentTrackIdx + 1);
      if (isPlaying) bgAudio.play().catch(() => {});
      updatePlayStateUI();
    });
  }

  if (pillMenuTrigger) {
    pillMenuTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (agenticDockPill) agenticDockPill.classList.toggle('is-expanded');
    });
  }

  if (bgAudio) {
    bgAudio.addEventListener('ended', () => {
      loadTrack(currentTrackIdx + 1);
      bgAudio.play().catch(() => {});
    });
  }

  if (agenticDockPill) {
    agenticDockPill.addEventListener('click', (e) => {
      // 若点击的是控制面板内部或按钮则不收起
      if (e.target.closest('button') || e.target.closest('.expanded-controls')) return;
      agenticDockPill.classList.toggle('is-expanded');
    });
  }

  document.addEventListener('click', (e) => {
    if (agenticDockPill && !agenticDockPill.contains(e.target)) {
      agenticDockPill.classList.remove('is-expanded');
    }
  });

  /* --------------------------------------------------------------------------
     9. 典藏卡片与影院画廊
     -------------------------------------------------------------------------- */

  const lightbox = document.getElementById('cinemaLightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  document.querySelectorAll('.pure-photo-item').forEach(photo => {
    photo.addEventListener('click', () => {
      const img = photo.querySelector('.pure-photo-img');
      if (img && lightbox && lightboxImg) {
        lightboxImg.src = img.src;
        lightbox.classList.add('is-active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  function closeLightbox() {
    if (lightbox) {
      lightbox.classList.remove('is-active');
      document.body.style.overflow = '';
    }
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  /* --------------------------------------------------------------------------
     10. 渲染循环 (Render Animation Loop)
     - 两通道离屏渲染管线：
         Pass 1: 背景 90,000 粒子 + 扫光光柱 -> bgRenderTarget
         Pass 2: Apple Liquid Glass Studio 光学折射、色散与菲涅尔镜面合成 -> 屏幕
     -------------------------------------------------------------------------- */
  let clock = new THREE.Clock();
  let sweepPosition = -60.0;

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // 扫光位置递增循环
    sweepPosition += delta * 22.0;
    if (sweepPosition > 55.0) {
      sweepPosition = -55.0;
    }

    scrollProgress += (targetScrollProgress - scrollProgress) * 0.08;
    mouseX += (targetMouseX - mouseX) * 0.08;
    mouseY += (targetMouseY - mouseY) * 0.08;

        // liquid-glass-studio 官方弹簧动力学与速度形变模拟
    const nowTime = performance.now();
    const dt = Math.min((nowTime - (lastSpringTime || nowTime)) / 1000.0, 0.08);
    lastSpringTime = nowTime;

    const curDpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetSpringX = rawMouseX * curDpr;
    const targetSpringY = (windowHeight - rawMouseY) * curDpr;

    // 严谨高精度物理弹簧阻尼模型 (模拟 @react-spring 弹性系数)
    const tension = 160.0;
    const friction = 22.0;
    const ax = (targetSpringX - mouseSpringX) * tension - mouseSpringSpeedX * friction;
    const ay = (targetSpringY - mouseSpringY) * tension - mouseSpringSpeedY * friction;
    mouseSpringSpeedX += ax * dt;
    mouseSpringSpeedY += ay * dt;
    mouseSpringX += mouseSpringSpeedX * dt;
    mouseSpringY += mouseSpringSpeedY * dt;

    // 动态拉伸形变：鼠标高速移动时 Squircle 顺滑拉长，低速时恢复标准圆角矩形
    const speedMagX = Math.abs(mouseSpringSpeedX) / curDpr;
    const speedMagY = Math.abs(mouseSpringSpeedY) / curDpr;
    const springFactor = 0.03;
    const curShapeW = Math.min(110.0 + speedMagX * springFactor, 160.0);
    const curShapeH = Math.min(110.0 + speedMagY * springFactor, 160.0);
    const curShapeRadius = (Math.min(curShapeW, curShapeH) / 2.0) * 0.82;

    // 10.1 音频分析与跳动
    if (analyser && dataArray && isPlaying) {
      analyser.getByteFrequencyData(dataArray);
      let bassSum = 0;
      for (let b = 0; b < 6; b++) bassSum += dataArray[b];
      audioBass = (bassSum / 6) / 255.0;

      if (eqBars.length >= 4) {
        eqBars[0].style.height = `${4 + dataArray[2] * 0.05}px`;
        eqBars[1].style.height = `${4 + dataArray[6] * 0.07}px`;
        eqBars[2].style.height = `${4 + dataArray[10] * 0.06}px`;
        eqBars[3].style.height = `${4 + dataArray[14] * 0.04}px`;
      }
    } else {
      audioBass += (Math.sin(elapsedTime * 2.0) * 0.03 + 0.03 - audioBass) * 0.1;
      if (eqBars.length >= 4) {
        eqBars.forEach((bar, idx) => {
          bar.style.height = `${3 + Math.sin(elapsedTime * 3.0 + idx) * 1.2}px`;
        });
      }
    }

    // 10.2 阶段动态逻辑
    let waveProgress = 0;
    if (scrollProgress >= 0.18 && scrollProgress <= 0.62) {
      waveProgress = Math.sin(((scrollProgress - 0.18) / 0.44) * Math.PI);
    }

    
    

    // 10.3 鼠标交互背景液态玻璃 (全局响应光标，中心无固定遮挡)
    
    
    
    
    // 高光角随时间与鼠标微动偏转
    

    // 10.4 粒子着色器 Uniforms
    forestShaderMaterial.uniforms.uTime.value = elapsedTime;
    forestShaderMaterial.uniforms.uScroll.value = scrollProgress;
    forestShaderMaterial.uniforms.uWarp.value = 0.0;
    forestShaderMaterial.uniforms.uBass.value = audioBass;
    forestShaderMaterial.uniforms.uMouse.value.set(mouseX, mouseY);
    forestShaderMaterial.uniforms.uSweepPos.value = sweepPosition;

    waveShaderMaterial.uniforms.uTime.value = elapsedTime;
    waveShaderMaterial.uniforms.uWaveProgress.value = waveProgress;
    waveShaderMaterial.uniforms.uBass.value = audioBass;

    // 10.5 丝滑宁静电影级运镜 (彻底杜绝任何抖动或突变)
    camera.position.z = 26.0 - scrollProgress * 6.0;
    camera.position.x = mouseX * 2.0;
    camera.position.y = 1.4 + mouseY * 1.5 - scrollProgress * 2.0;
    if (camera.fov !== 50.0) {
      camera.fov = 50.0;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(0, -scrollProgress * 1.0, 0);

    forestPoints.rotation.y = elapsedTime * 0.015 + mouseX * 0.04;

    // 渲染底层 3D 粒子星空 (z-index: 1)
    renderer.render(scene, camera);
  }

  animate();

})();
