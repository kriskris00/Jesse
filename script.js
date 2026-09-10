/* ==========================================================================
   SELAHX — Everywhere & Agentic WebGL Engine
   Features:
   - Original 90,000 Particle Forest (45,000 地面植被 + 28,000 树冠花冠 + 17,000 浮动星尘)
   - Original Dynamic Multi-Palette Color Shifting (翡翠青、星云紫、太阳金色彩流转)
   - Original Diagonal Caustic Light Sweep (全屏对角扫光穿透系统)
   - Dynamic Black & White (Dark / Light) Cohesive Visual Adaptation (黑白无缝双向切换)
   - Audio-Reactive Bass Frequency Resonator (音频低频脉冲律动)
   - Smooth Depth Scroll Progression (多段剧情平滑景深穿梭)
   - Sleek Apple Crystal Audio Capsule Dock & Cinema Lightbox
   ========================================================================== */

(function () {
  'use strict';
  try {

  /* --------------------------------------------------------------------------
     1. 全局播放列表与音频状态
     -------------------------------------------------------------------------- */
  const PLAYLIST = [
    { src: '1.mp3', title: '1', artist: '' },
    { src: 'background-music.mp3', title: 'Atmospheric Drift', artist: '' },
    { src: 'xxx.mp3', title: '2', artist: '' }
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
  let rawMouseX = window.innerWidth * 0.5;
  let rawMouseY = window.innerHeight * 0.5;
  let windowWidth = window.innerWidth;
  let windowHeight = window.innerHeight;

  // 黑白主题状态 (0.0 = 深邃黑夜 Dark, 1.0 = 纯净白昼 Light)
  let currentTheme = 0.0;
  let targetTheme = 0.0;
  const currentClearColor = new THREE.Color(0x000000);
  const targetClearColor = new THREE.Color(0x000000);

  /* --------------------------------------------------------------------------
     2. Three.js 初始化 (Pure Black Void #000000)
     -------------------------------------------------------------------------- */
  const container = document.getElementById('canvas-container');
  let scene, camera, renderer;

  if (container && typeof THREE !== 'undefined') {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.015);

    camera = new THREE.PerspectiveCamera(50, windowWidth / windowHeight, 0.1, 1200);
    camera.position.set(0, 1.4, 26);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(windowWidth, windowHeight);
    const curDpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(curDpr);
    renderer.setClearColor(currentClearColor, 1.0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.appendChild(renderer.domElement);
  }

  /* --------------------------------------------------------------------------
     3. 最初的 90,000 粒子森林 (动态色彩流转 + 原版对角扫光穿透)
     -------------------------------------------------------------------------- */
  const POINT_COUNT = 90000;
  const geometry = new THREE.BufferGeometry();

  const positions = new Float32Array(POINT_COUNT * 3);
  const origins = new Float32Array(POINT_COUNT * 3);
  const colors = new Float32Array(POINT_COUNT * 3);
  const lightColors = new Float32Array(POINT_COUNT * 3);
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

      lightColors[pIdx * 3] = 0.05;
      lightColors[pIdx * 3 + 1] = 0.42;
      lightColors[pIdx * 3 + 2] = 0.32;
    } else if (r < 0.78) {
      colors[pIdx * 3] = 0.12;
      colors[pIdx * 3 + 1] = 0.82;
      colors[pIdx * 3 + 2] = 0.92;

      lightColors[pIdx * 3] = 0.08;
      lightColors[pIdx * 3 + 1] = 0.35;
      lightColors[pIdx * 3 + 2] = 0.75;
    } else {
      colors[pIdx * 3] = 0.92;
      colors[pIdx * 3 + 1] = 0.78;
      colors[pIdx * 3 + 2] = 0.45;

      lightColors[pIdx * 3] = 0.65;
      lightColors[pIdx * 3 + 1] = 0.38;
      lightColors[pIdx * 3 + 2] = 0.12;
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

      lightColors[pIdx * 3] = 0.15;
      lightColors[pIdx * 3 + 1] = 0.20;
      lightColors[pIdx * 3 + 2] = 0.22;

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

        lightColors[pIdx * 3] = 0.45;
        lightColors[pIdx * 3 + 1] = 0.15;
        lightColors[pIdx * 3 + 2] = 0.60;
      } else if (pal < 0.72) {
        colors[pIdx * 3] = 0.15;
        colors[pIdx * 3 + 1] = 0.88;
        colors[pIdx * 3 + 2] = 0.95;

        lightColors[pIdx * 3] = 0.10;
        lightColors[pIdx * 3 + 1] = 0.35;
        lightColors[pIdx * 3 + 2] = 0.80;
      } else {
        colors[pIdx * 3] = 0.98;
        colors[pIdx * 3 + 1] = 0.65;
        colors[pIdx * 3 + 2] = 0.75;

        lightColors[pIdx * 3] = 0.70;
        lightColors[pIdx * 3 + 1] = 0.18;
        lightColors[pIdx * 3 + 2] = 0.36;
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

  // 3.3 浮动星尘与极光粒子 (17,000 点，覆盖视口全域及底部背景)
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

      lightColors[pIdx * 3] = 0.08;
      lightColors[pIdx * 3 + 1] = 0.36;
      lightColors[pIdx * 3 + 2] = 0.80;
    } else if (r < 0.7) {
      colors[pIdx * 3] = 0.88;
      colors[pIdx * 3 + 1] = 0.55;
      colors[pIdx * 3 + 2] = 0.92;

      lightColors[pIdx * 3] = 0.48;
      lightColors[pIdx * 3 + 1] = 0.16;
      lightColors[pIdx * 3 + 2] = 0.58;
    } else {
      colors[pIdx * 3] = 1.0;
      colors[pIdx * 3 + 1] = 0.88;
      colors[pIdx * 3 + 2] = 0.5;

      lightColors[pIdx * 3] = 0.70;
      lightColors[pIdx * 3 + 1] = 0.40;
      lightColors[pIdx * 3 + 2] = 0.12;
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
  geometry.setAttribute('aLightColor', new THREE.BufferAttribute(lightColors, 3));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aType', new THREE.BufferAttribute(types, 1));
  geometry.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3));

  // 3.4 点云着色器 (最初原版色彩流转 + 保留对角扫光穿透)
  const forestShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uTheme: { value: 0.0 },
      uScroll: { value: 0 },
      uWarp: { value: 0 },
      uBass: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uSweepPos: { value: -60.0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uTheme;
      uniform float uScroll;
      uniform float uWarp;
      uniform float uBass;
      uniform vec2 uMouse;
      uniform float uSweepPos;
      uniform float uPixelRatio;

      attribute vec3 aOrigin;
      attribute vec3 aColor;
      attribute vec3 aLightColor;
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

        // 平稳宁静空间粒子微漂移
        pos.z += sin(uTime * 0.4 + aPhase) * 0.35;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // 原版动态对角线扫光判定 (保留 3D 粒子扫光)
        float diagCoord = pos.x * 0.707 + pos.y * 0.707;
        float distToSweep = abs(diagCoord - uSweepPos);
        float sweepHit = smoothstep(14.0, 0.0, distToSweep);
        vSweepHit = sweepHit;

        // 最初原版色彩流转系统 (Color Shifting)
        float colorShiftTime = uTime * 0.22 + pos.x * 0.015 + pos.y * 0.02;
        vec3 shiftA = vec3(0.12, 0.92, 0.82); // 翡翠青
        vec3 shiftB = vec3(0.85, 0.45, 0.95); // 星云紫
        vec3 shiftC = vec3(1.00, 0.78, 0.42); // 太阳金

        float cycle = sin(colorShiftTime) * 0.5 + 0.5;
        float cycle2 = cos(colorShiftTime * 0.75) * 0.5 + 0.5;
        vec3 dynamicCol = mix(mix(shiftA, shiftB, cycle), shiftC, cycle2 * 0.45);

        // 暗夜色彩合成
        vec3 darkColor = mix(aColor, dynamicCol, 0.55);
        darkColor += vec3(0.5, 0.65, 0.9) * sweepHit * 0.85;

        // 白昼模式水墨自适应合成
        vec3 lightColor = mix(aLightColor, vec3(0.12, 0.25, 0.55), cycle * 0.35);
        lightColor += vec3(0.15, 0.35, 0.7) * sweepHit * 0.5;

        vColor = mix(darkColor, lightColor, uTheme);

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
     4. 黑白昼夜主题管理器 (Light / Dark Theme Switcher)
     -------------------------------------------------------------------------- */
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeToggleText = document.getElementById('themeToggleText');

  function applyTheme(mode, save = true) {
    const isLight = (mode === 'light');
    targetTheme = isLight ? 1.0 : 0.0;
    targetClearColor.set(isLight ? 0xf7f8fc : 0x000000);

    document.documentElement.setAttribute('data-color-mode', isLight ? 'light' : 'dark');
    if (themeToggleText) {
      themeToggleText.textContent = isLight ? 'LIGHT' : 'DARK';
    }

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isLight ? '#f7f8fc' : '#000000');
    }

    if (save) {
      try {
        localStorage.setItem('selahx-color-theme', mode);
      } catch (e) {}
    }
  }

  // 初始化主题偏好
  try {
    const savedTheme = localStorage.getItem('selahx-color-theme');
    if (savedTheme === 'light') {
      currentTheme = 1.0;
      targetTheme = 1.0;
      currentClearColor.set(0xf7f8fc);
      targetClearColor.set(0xf7f8fc);
      if (renderer) renderer.setClearColor(0xf7f8fc, 1.0);
      if (scene && scene.fog) scene.fog.color.set(0xf7f8fc);
      applyTheme('light', false);
    } else {
      applyTheme('dark', false);
    }
  } catch (e) {
    applyTheme('dark', false);
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentMode = document.documentElement.getAttribute('data-color-mode') || 'dark';
      const newMode = (currentMode === 'dark') ? 'light' : 'dark';
      applyTheme(newMode, true);
    });
  }

  /* --------------------------------------------------------------------------
     5. 滚动监听与平滑阻尼
     -------------------------------------------------------------------------- */
  function handleScroll() {
    const totalHeight = document.documentElement.scrollHeight - windowHeight;
    const currentY = window.pageYOffset || document.documentElement.scrollTop;
    targetScrollProgress = totalHeight > 0 ? Math.min(Math.max(currentY / totalHeight, 0), 1) : 0;
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  /* --------------------------------------------------------------------------
     6. 鼠标与触控交互
     -------------------------------------------------------------------------- */
  window.addEventListener('mousemove', (e) => {
    rawMouseX = e.clientX;
    rawMouseY = e.clientY;
    targetMouseX = (e.clientX / windowWidth) * 2 - 1;
    targetMouseY = -(e.clientY / windowHeight) * 2 + 1;
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      rawMouseX = e.touches[0].clientX;
      rawMouseY = e.touches[0].clientY;
      targetMouseX = (rawMouseX / windowWidth) * 2 - 1;
      targetMouseY = -(rawMouseY / windowHeight) * 2 + 1;
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    if (camera) {
      camera.aspect = windowWidth / windowHeight;
      camera.updateProjectionMatrix();
    }
    const curDpr = Math.min(window.devicePixelRatio || 1, 2);
    if (renderer) {
      renderer.setSize(windowWidth, windowHeight);
      renderer.setPixelRatio(curDpr);
    }
    if (forestShaderMaterial && forestShaderMaterial.uniforms) {
      forestShaderMaterial.uniforms.uPixelRatio.value = curDpr;
    }
  });

  /* --------------------------------------------------------------------------
     7. SelahX 灵动岛药丸播放器 (Apple Frosted Glass Capsule Dock)
     - 底部药丸的小部分扫光已在 CSS 中彻底取消，保持纯粹静谧
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
        console.warn('Audio element source notice:', mediaErr);
      }

      dataArray = new Uint8Array(analyser.frequencyBinCount);
    } catch (err) {
      console.warn('Web Audio API restricted:', err);
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
        console.warn('Audio play notice:', err);
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

  // 控制按钮绑定
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
     8. 典藏画廊与大图影院弹窗 (Cinema Lightbox)
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
     9. 核心动画渲染循环 (Render Animation Loop)
     - 保留原版对角扫光持续前进 (-60.0 -> +55.0)
     - 还原最初粒子森林微风摇曳与音频共振
     - 支持黑白模式无缝渐变
     -------------------------------------------------------------------------- */
  let clock = new THREE.Clock();
  let sweepPosition = -60.0;

  function animate() {
    requestAnimationFrame(animate);
    try {
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // 原版 3D 扫光位置递增循环 (保留其它扫光)
      sweepPosition += delta * 22.0;
      if (sweepPosition > 55.0) {
        sweepPosition = -55.0;
      }

      scrollProgress += (targetScrollProgress - scrollProgress) * 0.08;
      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;

      // 黑白主题平滑插值过渡
      currentTheme += (targetTheme - currentTheme) * 0.07;
      currentClearColor.lerp(targetClearColor, 0.07);
      if (renderer) {
        renderer.setClearColor(currentClearColor, 1.0);
      }
      if (scene && scene.fog) {
        scene.fog.color.copy(currentClearColor);
      }

      // 音频动态频响
      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        let bassSum = 0;
        for (let i = 0; i < 4; i++) bassSum += dataArray[i];
        const currentBass = (bassSum / 4.0) / 255.0;
        audioBass += (currentBass - audioBass) * 0.25;

        if (eqBars.length >= 4) {
          eqBars[0].style.height = `${4 + dataArray[2] * 0.05}px`;
          eqBars[1].style.height = `${4 + dataArray[6] * 0.06}px`;
          eqBars[2].style.height = `${4 + dataArray[10] * 0.05}px`;
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

      // 粒子材质 Uniforms 动态更新
      if (forestShaderMaterial && forestShaderMaterial.uniforms) {
        forestShaderMaterial.uniforms.uTime.value = elapsedTime;
        forestShaderMaterial.uniforms.uTheme.value = currentTheme;
        forestShaderMaterial.uniforms.uScroll.value = scrollProgress;
        forestShaderMaterial.uniforms.uWarp.value = 0.0;
        forestShaderMaterial.uniforms.uBass.value = audioBass;
        forestShaderMaterial.uniforms.uMouse.value.set(mouseX, mouseY);
        forestShaderMaterial.uniforms.uSweepPos.value = sweepPosition;
      }

      // 运镜控制
      if (camera) {
        camera.position.z = 26.0 - scrollProgress * 6.0;
        camera.position.x = mouseX * 2.0;
        camera.position.y = 1.4 + mouseY * 1.5 - scrollProgress * 2.0;
        camera.lookAt(0, -scrollProgress * 1.0, 0);
      }

      if (forestPoints) {
        forestPoints.rotation.y = elapsedTime * 0.015 + mouseX * 0.04;
      }

      // 最终帧渲染
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    } catch (err) {
      window.__script_err = (err && err.stack) ? err.stack : String(err);
    }
  }

  animate();
  } catch (err) {
    window.__script_init_err = (err && err.stack) ? err.stack : String(err);
    console.error('SCRIPT INIT ERR:', err);
  }
})();
