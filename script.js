/* ==========================================================================
   SELAHX - 自然麦浪原野 3D 舞台 + 全色系流彩烟雾 + 苹果 iOS 27 流光液态玻璃引擎
   ========================================================================== */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
     1. 播放列表与全局状态
     -------------------------------------------------------------------------- */
  const PLAYLIST = [
    { src: '1.mp3', title: 'SelahX Ambient Resonance', artist: 'Jesse / Haikou Golden Wheat' },
    { src: 'background-music.mp3', title: 'Atmospheric Drift', artist: 'Wind & Reeds Acoustic' },
    { src: 'xxx.mp3', title: 'Obsidian Pulse Beat', artist: 'Stadium Sub Frequency' }
  ];

  let currentTrackIdx = 0;
  let isPlaying = false;
  let audioContext = null;
  let analyser = null;
  let dataArray = null;
  let audioBass = 0;

  let globalTime = 0;
  let scrollY = 0;

  /* --------------------------------------------------------------------------
     2. Three.js 3D 自然麦浪原野舞台 (告别生硬小土坡，全麦浪自然延展)
     - 自然微起伏的舒缓大地 (无孤立半圆土丘)
     - 14,000 株真实实体麦穗 (饱满金黄谷粒结构)
     - 全色系绚烂流体烟雾 (在麦浪上方持续变色翻滚)
     - 体育场看台闪光灯繁星星海
     -------------------------------------------------------------------------- */
  let scene, camera, renderer;
  let earthMesh, wheatMesh, wheatShaderUniforms, mistMesh, crowdLights, logoParticles;
  const canvasContainer = document.getElementById('canvas-container');

  function initThreeScene() {
    if (!window.THREE || !canvasContainer) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030305);
    scene.fog = new THREE.FogExp2(0x030305, 0.015);

    camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 22, 48);
    camera.lookAt(0, 4, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    canvasContainer.appendChild(renderer.domElement);

    // 舞台灯光：主聚光灯 + 暖金侧光 + 琥珀补光 (杜绝死白与发灰)
    const mainSpot = new THREE.SpotLight(0xfff5e8, 9.0);
    mainSpot.position.set(0, 55, 18);
    mainSpot.angle = Math.PI / 3.0;
    mainSpot.penumbra = 0.8;
    scene.add(mainSpot);

    const warmGoldenSun = new THREE.DirectionalLight(0xffbf59, 4.2);
    warmGoldenSun.position.set(32, 28, 22);
    scene.add(warmGoldenSun);

    const earthAmberLight = new THREE.PointLight(0xd97e26, 4.5, 95);
    earthAmberLight.position.set(-20, 10, 15);
    scene.add(earthAmberLight);

    const warmAmbient = new THREE.AmbientLight(0x452812, 2.5); // 温暖琥珀基底，阴影绝无死灰
    scene.add(warmAmbient);

    createStadiumFlashlights();     // 看台繁星星海
    createNaturalRollingEarth();    // 宽广舒缓自然大地 (彻底移除生硬半圆土堆)
    createLushRealisticWheatField(); // 14,000 株逼真饱满金黄麦穗
    createFullColorRollingSmoke();  // 全光谱缓慢变色流体翻滚烟雾
    createLuminousLogo('SELAHX');    // 金辉正向徽标

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('scroll', () => {
      scrollY = window.scrollY || document.documentElement.scrollTop;
    }, { passive: true });
  }

  // --- 1. 体育场看台闪光灯繁星 ---
  function createStadiumFlashlights() {
    const count = 3000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = (Math.random() - 0.5) * Math.PI * 1.6;
      const radius = 75 + Math.random() * 85;
      pos[i * 3] = Math.sin(theta) * radius;
      pos[i * 3 + 1] = 14 + Math.random() * 75;
      pos[i * 3 + 2] = -Math.cos(theta) * radius * 0.75;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.32,
      transparent: true,
      opacity: 0.8
    });
    crowdLights = new THREE.Points(geo, mat);
    scene.add(crowdLights);
  }

  // --- 2. 宽广舒缓自然大地 (彻底移除生硬突兀的半圆孤立小土坡) ---
  function createNaturalRollingEarth() {
    const size = 190;
    const segments = 96;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);

      // 自然原野微波起伏：起伏舒缓平顺，绝不突兀拱起生硬半圆
      const gentleWave = Math.sin(x * 0.055) * Math.cos(y * 0.055) * 3.2 + Math.sin(x * 0.1) * 1.2;

      // 广阔边缘平滑下潜沉入深黑虚空
      const maxR = size * 0.46;
      const falloff = Math.max(0, 1.0 - Math.pow(dist / maxR, 2.4));
      const zVal = (gentleWave + 2.0) * falloff - (1.0 - falloff) * 22.0;
      pos.setZ(i, zVal);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x361f0e, // 肥沃深黑褐暖泥土
      roughness: 0.98,
      metalness: 0.02,
      flatShading: true
    });

    earthMesh = new THREE.Mesh(geo, mat);
    earthMesh.rotation.x = -Math.PI / 2;
    earthMesh.position.y = -3;
    scene.add(earthMesh);
  }

  // --- 3. 14,000 株真实实体黄金麦穗 (饱满谷粒纺锤结构 + 金芒，麦海全面覆盖) ---
  function createLushRealisticWheatField() {
    const wheatCount = 14000;
    const fieldRange = 56;

    // 构建一株真实麦穗的多边形实体 (麦秆 + 6层交互饱满谷粒 + 尖端麦芒)
    const positions = [];
    const colors = [];

    // A. 麦秆部分 (深琥珀金)
    const stemSegs = 4;
    const stemHeight = 1.35;
    for (let s = 0; s < stemSegs; s++) {
      const y0 = (s / stemSegs) * stemHeight;
      const y1 = ((s + 1) / stemSegs) * stemHeight;
      const r0 = 0.038 - s * 0.003;
      const r1 = 0.038 - (s + 1) * 0.003;

      for (let a = 0; a < 4; a++) {
        const a0 = (a / 4) * Math.PI * 2;
        const a1 = ((a + 1) / 4) * Math.PI * 2;

        const x00 = Math.cos(a0) * r0, z00 = Math.sin(a0) * r0;
        const x01 = Math.cos(a1) * r0, z01 = Math.sin(a1) * r0;
        const x10 = Math.cos(a0) * r1, z10 = Math.sin(a0) * r1;
        const x11 = Math.cos(a1) * r1, z11 = Math.sin(a1) * r1;

        positions.push(x00, y0, z00, x10, y1, z10, x01, y0, z01);
        positions.push(x01, y0, z01, x10, y1, z10, x11, y1, z11);

        for (let k = 0; k < 6; k++) colors.push(0.88, 0.58, 0.24);
      }
    }

    // B. 麦穗谷粒层 (纺锤形饱满交错谷粒，纯正日照亮暖金)
    const grainTiers = 7;
    for (let t = 0; t < grainTiers; t++) {
      const gy = 1.35 + t * 0.16;
      const taper = Math.sin((t / (grainTiers - 1)) * Math.PI) * 0.12 + 0.06;

      for (let side = -1; side <= 1; side += 2) {
        const gx = side * (taper * 0.9);
        const gz = (side === 1 ? 0.035 : -0.035);
        const topY = gy + 0.18;

        positions.push(0, gy, 0,  gx, gy + 0.08, gz + 0.04,  0, topY, 0);
        positions.push(0, gy, 0,  0, topY, 0,  gx, gy + 0.08, gz - 0.04);

        for (let k = 0; k < 6; k++) colors.push(0.99, 0.82, 0.38);
      }
    }

    // C. 麦穗尖端麦芒
    positions.push(0, 2.45, 0,  0.03, 2.85, 0, -0.03, 2.85, 0);
    for (let k = 0; k < 3; k++) colors.push(1.0, 0.90, 0.48);

    const singleWheatGeo = new THREE.BufferGeometry();
    singleWheatGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    singleWheatGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    singleWheatGeo.computeVertexNormals();

    const wheatMat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      reflectivity: 0.1
    });

    // 麦浪风动 GPU 顶点着色器
    wheatMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uBass = { value: 0 };
      shader.vertexShader = `
        uniform float uTime;
        uniform float uBass;
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        // 真实麦浪翻滚：上层麦穗尖端大幅起伏，根部扎牢
        float sway = pow(clamp(position.y / 2.6, 0.0, 1.0), 1.5);
        float wind = sin(uTime * 2.8 + transformed.x * 0.28 + transformed.z * 0.32);
        float gust = cos(uTime * 1.6 + transformed.x * 0.14) * 0.28;
        float pulse = uBass * 0.4;

        transformed.x += (wind * 0.45 + gust + pulse) * sway;
        transformed.z += (wind * 0.25 + gust * 0.55) * sway;
        `
      );
      wheatShaderUniforms = shader.uniforms;
    };

    wheatMesh = new THREE.InstancedMesh(singleWheatGeo, wheatMat, wheatCount);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < wheatCount; i++) {
      // 在平缓原野内密集分布
      const r = Math.sqrt(Math.random()) * fieldRange;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      // 贴合微波大地高度
      const groundY = (Math.sin(x * 0.055) * Math.cos(z * 0.055) * 3.2 + Math.sin(x * 0.1) * 1.2) + 2.0;
      const y = -3 + groundY + (Math.random() - 0.5) * 0.2;

      dummy.position.set(x, y, z);
      dummy.rotation.x = (Math.random() - 0.5) * 0.26;
      dummy.rotation.z = (Math.random() - 0.5) * 0.26;
      dummy.rotation.y = Math.random() * Math.PI * 2;

      const s = 0.85 + Math.random() * 0.45;
      dummy.scale.set(s, s * 1.15, s);
      dummy.updateMatrix();

      wheatMesh.setMatrixAt(i, dummy.matrix);
    }

    wheatMesh.instanceMatrix.needsUpdate = true;
    scene.add(wheatMesh);
  }

  // --- 4. 麦田上方飘荡的全色系流体翻滚烟雾 (全光谱绚烂流动变色) ---
  function createFullColorRollingSmoke() {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform float uBass;
      uniform vec3 uColor;
      uniform vec3 uColor2;
      varying vec2 vUv;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      float fbm(vec2 p) {
        float v = 0.0; float a = 0.5;
        for(int i=0; i<5; i++){ v += a * noise(p); p *= 2.05; a *= 0.5; }
        return v;
      }

      void main() {
        vec2 uv = vUv;
        float t = uTime * 0.16;

        // 域扭曲制造翻滚气旋
        vec2 q = vec2(fbm(uv + t * 0.4), fbm(uv + vec2(2.5, 1.3)));
        vec2 r = vec2(fbm(uv + 1.2 * q + 0.1 * t), fbm(uv + 1.2 * q + 0.12 * t));
        float f = fbm(uv + 1.4 * r);

        // 双色流动混合，并在全光谱中变换
        vec3 col = mix(uColor, uColor2, clamp(length(q) * 1.2, 0.0, 1.0));
        col += uColor * (f * f * 0.65 + uBass * 0.35);

        float mask = smoothstep(0.65, 0.12, distance(uv, vec2(0.5)));
        gl_FragColor = vec4(col, mask * f * 0.88);
      }
    `;

    const geo = new THREE.PlaneGeometry(130, 130);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uColor: { value: new THREE.Color(0x00f0ff) },
        uColor2: { value: new THREE.Color(0xa855f7) }
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    mistMesh = new THREE.Mesh(geo, mat);
    mistMesh.rotation.x = -Math.PI / 2;
    mistMesh.position.y = 5.5; // 紧贴麦浪上方流动
    scene.add(mistMesh);
  }

  // --- 5. 悬浮在麦田舞台上方的金辉 SELAHX 徽标 (正视镜头) ---
  function createLuminousLogo(text) {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.font = 'bold 125px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 512, 128);

    const data = ctx.getImageData(0, 0, 1024, 256).data;
    const points = [];
    const initials = [];

    for (let y = 0; y < 256; y += 4) {
      for (let x = 0; x < 1024; x += 4) {
        if (data[(y * 1024 + x) * 4] > 128) {
          const px = (x - 512) * 0.045;
          const py = -(y - 128) * 0.045;
          points.push(px, py, 0);
          initials.push(px, py, 0);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    geo.setAttribute('initial', new THREE.Float32BufferAttribute(initials, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffe2a8,
      size: 0.17,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });

    logoParticles = new THREE.Points(geo, mat);
    logoParticles.position.set(0, 10.5, 3);
    logoParticles.rotation.x = -0.28;
    scene.add(logoParticles);
  }

  // --- 3D 渲染主循环 ---
  function animateThree() {
    requestAnimationFrame(animateThree);
    globalTime += 0.015;

    // 音频低音律动分析
    if (isPlaying && analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < 14; i++) sum += dataArray[i];
      audioBass = sum / 14 / 255;
    } else {
      audioBass *= 0.92;
    }

    // 1. 麦浪风动更新
    if (wheatShaderUniforms) {
      wheatShaderUniforms.uTime.value = globalTime;
      wheatShaderUniforms.uBass.value = audioBass;
    }

    // 2. 烟雾全色系绚烂流动变色 (极光青 ➔ 皇家深蓝 ➔ 电光紫 ➔ 玫瑰粉红 ➔ 晚霞暖金 ➔ 翡翠碧绿 ➔ 绯红)
    if (mistMesh) {
      mistMesh.material.uniforms.uTime.value = globalTime;
      mistMesh.material.uniforms.uBass.value = audioBass;

      const cycle = globalTime * 0.06;
      const spectrum = [
        new THREE.Color(0x00f0ff), // 极光青
        new THREE.Color(0x3b82f6), // 皇家深蓝
        new THREE.Color(0xa855f7), // 电光紫
        new THREE.Color(0xec4899), // 玫瑰粉红
        new THREE.Color(0xf59e0b), // 晚霞暖金
        new THREE.Color(0x10b981), // 翡翠绿
        new THREE.Color(0xe11d48)  // 绯红
      ];

      const idx1 = Math.floor(cycle) % spectrum.length;
      const idx2 = (idx1 + 1) % spectrum.length;
      const alpha = cycle - Math.floor(cycle);
      const color1 = spectrum[idx1].clone().lerp(spectrum[idx2], alpha);

      const secIdx = (idx1 + 2) % spectrum.length;
      const secIdxNext = (secIdx + 1) % spectrum.length;
      const color2 = spectrum[secIdx].clone().lerp(spectrum[secIdxNext], alpha);

      mistMesh.material.uniforms.uColor.value = color1;
      mistMesh.material.uniforms.uColor2.value = color2;
      mistMesh.rotation.z = globalTime * 0.018;
    }

    // 3. 看台繁星微动
    if (crowdLights) {
      crowdLights.rotation.y = globalTime * 0.002;
    }

    // 4. SELAHX 徽标跳动呼吸
    if (logoParticles) {
      const posArr = logoParticles.geometry.attributes.position.array;
      const initArr = logoParticles.geometry.attributes.initial.array;
      const jump = audioBass * 1.6;
      for (let i = 0; i < posArr.length / 3; i++) {
        const iy = i * 3 + 1;
        const wave = Math.sin(globalTime * 2.2 + initArr[i * 3] * 0.3) * 0.16;
        posArr[iy] = initArr[iy] + wave + jump * Math.sin(globalTime * 7 + i);
      }
      logoParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 5. 视差下推
    const scrollFactor = Math.min(scrollY / 1400, 1.0);
    const targetY = 22 - scrollFactor * 18;
    const targetZ = 48 - scrollFactor * 26;
    camera.position.y += (targetY - camera.position.y) * 0.06;
    camera.position.z += (targetZ - camera.position.z) * 0.06;
    camera.lookAt(0, scrollFactor * 6, scrollFactor * -10);

    renderer.render(scene, camera);
  }

  function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /* --------------------------------------------------------------------------
     3. 苹果 iOS 27 液态玻璃卡片 3D 物理倾角与交互
     -------------------------------------------------------------------------- */
  function initLiquidGlassInteraction() {
    const cards = document.querySelectorAll('.liquid-glass-card');

    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      });
    });
  }

  /* --------------------------------------------------------------------------
     4. 全屏影院灯箱
     -------------------------------------------------------------------------- */
  const lightbox = document.getElementById('cinemaLightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  function initLightbox() {
    document.querySelectorAll('.liquid-photo-card').forEach((card) => {
      card.addEventListener('click', () => {
        const img = card.querySelector('.photo-inner-img');
        if (img && lightbox && lightboxImg) {
          lightboxImg.src = img.src;
          lightbox.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
    });

    function close() {
      if (!lightbox) return;
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (lightboxClose) lightboxClose.addEventListener('click', close);
    if (lightbox) {
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) close();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  /* --------------------------------------------------------------------------
     5. 苹果 iOS 27 流光液态玻璃灵动岛播放器 (Color-Flowing Liquid Dynamic Island)
     -------------------------------------------------------------------------- */
  const islandPlayer = document.getElementById('liquidDynamicIsland');
  const playBtn = document.getElementById('islandPlayBtn');
  const prevBtn = document.getElementById('islandPrevBtn');
  const nextBtn = document.getElementById('islandNextBtn');
  const trackName = document.getElementById('islandTrackName');
  const artistName = document.getElementById('islandArtistName');
  const eqBars = document.querySelectorAll('.eq-column');
  const audioEl = document.getElementById('bgAudio');

  function setupAudioContext() {
    if (audioContext) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioCtx();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      dataArray = new Uint8Array(analyser.frequencyBinCount);

      const source = audioContext.createMediaElementSource(audioEl);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
    } catch (e) {
      console.warn('Audio Context Notice:', e);
    }
  }

  function updateIslandUI() {
    const t = PLAYLIST[currentTrackIdx];
    if (trackName) trackName.textContent = t.title;
    if (artistName) artistName.textContent = t.artist;

    if (isPlaying) {
      if (islandPlayer) islandPlayer.classList.add('is-playing');
      if (playBtn) {
        playBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1"></rect>
            <rect x="14" y="4" width="4" height="16" rx="1"></rect>
          </svg>
        `;
      }
    } else {
      if (islandPlayer) islandPlayer.classList.remove('is-playing');
      if (playBtn) {
        playBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-left:2px;">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        `;
      }
      eqBars.forEach((bar) => (bar.style.height = '3px'));
    }
  }

  function switchTrack(index) {
    currentTrackIdx = (index + PLAYLIST.length) % PLAYLIST.length;
    audioEl.src = PLAYLIST[currentTrackIdx].src;
    setupAudioContext();
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    audioEl.play().then(() => {
      isPlaying = true;
      updateIslandUI();
    }).catch((e) => console.warn(e));
  }

  function togglePlay() {
    setupAudioContext();
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }

    if (audioEl.paused) {
      if (!audioEl.src || audioEl.src === window.location.href) {
        audioEl.src = PLAYLIST[currentTrackIdx].src;
      }
      audioEl.play().then(() => {
        isPlaying = true;
        updateIslandUI();
      }).catch((e) => console.warn(e));
    } else {
      audioEl.pause();
      isPlaying = false;
      updateIslandUI();
    }
  }

  if (playBtn) playBtn.addEventListener('click', togglePlay);
  if (prevBtn) prevBtn.addEventListener('click', () => switchTrack(currentTrackIdx - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => switchTrack(currentTrackIdx + 1));
  if (audioEl) audioEl.addEventListener('ended', () => switchTrack(currentTrackIdx + 1));

  // 页面初次点击激活音频
  let userClicked = false;
  window.addEventListener('click', () => {
    if (!userClicked) {
      userClicked = true;
      setupAudioContext();
      if (!isPlaying && audioEl.paused) {
        togglePlay();
      }
    }
  }, { once: true });

  // 灵动岛频谱条动态刷新
  function animateEqualizer() {
    requestAnimationFrame(animateEqualizer);
    if (isPlaying && analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);
      eqBars.forEach((bar, idx) => {
        const val = dataArray[idx * 3 + 1] || 0;
        const h = Math.max(3, (val / 255) * 15);
        bar.style.height = `${h}px`;
      });
    }
  }

  /* --------------------------------------------------------------------------
     6. 启动初始化
     -------------------------------------------------------------------------- */
  function init() {
    initThreeScene();
    animateThree();
    initLiquidGlassInteraction();
    initLightbox();
    updateIslandUI();
    animateEqualizer();
  }

  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();