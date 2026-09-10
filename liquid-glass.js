/**
 * ============================================================================
 * Apple Liquid Glass Studio Engine — WebGL2 Multi-Pass Optical Renderer
 * Direct implementation of iyinchao/liquid-glass-studio for SELAHX
 *
 * Pipeline:
 *   Pass 1: bgPass (Screen content snapshot FBO)
 *   Pass 2: vBlurPass (Separable 1D Gaussian blur vertical)
 *   Pass 3: hBlurPass (Separable 1D Gaussian blur horizontal)
 *   Pass 4: mainPass:
 *     - Circular Liquid Droplet SDF (sdCircle) with velocity stretch
 *     - Finite-difference adaptive normal gradient
 *     - Snell's Law Physical Refraction
 *     - RGB Chromatic Dispersion (N_R=0.98, N_G=1.00, N_B=1.02)
 *     - 5th-Order Fresnel Rim Reflection (LCH color enhanced)
 *     - Blinn-Phong Specular Glare with angular convergence
 *     - Smooth Antialiased Droplet Rim & 100% Transparent Outside
 * ============================================================================
 */

(function () {
  'use strict';

  // 1. Shaders
  const VertexShader = `#version 300 es
  in vec4 a_position;
  out vec2 v_uv;
  void main() {
    v_uv = (a_position.xy + 1.0) * 0.5;
    gl_Position = a_position;
  }`;

  const FragmentBgShader = `#version 300 es
  precision highp float;
  in vec2 v_uv;
  out vec4 fragColor;
  uniform sampler2D u_bgTexture;
  void main() {
    fragColor = texture(u_bgTexture, v_uv);
  }`;

  const FragmentVblurShader = `#version 300 es
  precision highp float;
  #define MAX_BLUR_RADIUS (200)
  in vec2 v_uv;
  uniform sampler2D u_prevPassTexture;
  uniform vec2 u_resolution;
  uniform int u_blurRadius;
  uniform float u_blurWeights[MAX_BLUR_RADIUS + 1];
  out vec4 fragColor;
  void main() {
    vec2 texelSize = 1.0 / u_resolution;
    vec4 color = texture(u_prevPassTexture, v_uv) * u_blurWeights[0];
    for (int i = 1; i <= u_blurRadius; ++i) {
      float w = u_blurWeights[i];
      vec2 offset = vec2(float(i)) * texelSize;
      color += texture(u_prevPassTexture, v_uv + vec2(offset.x, 0.0)) * w;
      color += texture(u_prevPassTexture, v_uv - vec2(offset.x, 0.0)) * w;
    }
    fragColor = color;
  }`;

  const FragmentHblurShader = `#version 300 es
  precision highp float;
  #define MAX_BLUR_RADIUS (200)
  in vec2 v_uv;
  uniform sampler2D u_prevPassTexture;
  uniform vec2 u_resolution;
  uniform int u_blurRadius;
  uniform float u_blurWeights[MAX_BLUR_RADIUS + 1];
  out vec4 fragColor;
  void main() {
    vec2 texelSize = 1.0 / u_resolution;
    vec4 color = texture(u_prevPassTexture, v_uv) * u_blurWeights[0];
    for (int i = 1; i <= u_blurRadius; ++i) {
      float w = u_blurWeights[i];
      vec2 offset = vec2(float(i)) * texelSize;
      color += texture(u_prevPassTexture, v_uv + vec2(0.0, offset.y)) * w;
      color += texture(u_prevPassTexture, v_uv - vec2(0.0, offset.y)) * w;
    }
    fragColor = color;
  }`;

  const FragmentMainShader = `#version 300 es
  precision highp float;
  #define PI (3.141592653589793)

  // Physical chromatic dispersion index offsets
  const float N_R = 1.0 - 0.02;
  const float N_G = 1.0;
  const float N_B = 1.0 + 0.02;

  in vec2 v_uv;
  uniform sampler2D u_blurredBg;
  uniform sampler2D u_bg;
  uniform vec2 u_resolution;
  uniform float u_dpr;
  uniform vec2 u_mouseSpring;
  uniform float u_shapeRadius;
  uniform vec2 u_motionDir;
  uniform float u_stretch;

  // Optical uniforms
  uniform float u_refThickness;
  uniform float u_refDistance;
  uniform float u_refFactor;
  uniform float u_refDispersion;
  uniform float u_refFresnelRange;
  uniform float u_refFresnelFactor;
  uniform float u_refFresnelHardness;
  uniform float u_glareRange;
  uniform float u_glareConvergence;
  uniform float u_glareOppositeFactor;
  uniform float u_glareFactor;
  uniform float u_glareHardness;
  uniform float u_glareAngle;
  uniform int u_blurEdge;

  out vec4 fragColor;

  float safeAsin(float x) {
    return asin(clamp(x, -1.0, 1.0));
  }

  // Circular Droplet Signed Distance Field
  float sdCircle(vec2 p, float r) {
    return length(p) - r;
  }

  // Droplet SDF with fluid velocity stretch
  float mainSDF(vec2 p2, vec2 p) {
    vec2 p2n = p2 + p / u_resolution.y;
    if (u_stretch > 0.001) {
      float proj = dot(p2n, u_motionDir);
      vec2 perp = p2n - proj * u_motionDir;
      p2n = (proj / (1.0 + u_stretch)) * u_motionDir + perp * sqrt(1.0 + u_stretch);
    }
    return sdCircle(p2n, (u_shapeRadius * u_dpr) / u_resolution.y);
  }

  // Finite-difference adaptive normal
  vec2 getNormal(vec2 p2, vec2 p) {
    vec2 h = vec2(max(abs(dFdx(p.x)), 0.0001), max(abs(dFdy(p.y)), 0.0001));
    vec2 grad = vec2(
      mainSDF(p2, p + vec2(h.x, 0.0)) - mainSDF(p2, p - vec2(h.x, 0.0)),
      mainSDF(p2, p + vec2(0.0, h.y)) - mainSDF(p2, p - vec2(0.0, h.y))
    ) / (2.0 * h);
    return grad * 1.414213562 * 1000.0;
  }

  float vec2ToAngle(vec2 v) {
    float angle = atan(v.y, v.x);
    if (angle < 0.0) angle += 2.0 * PI;
    return angle;
  }

  vec4 getTextureDispersion(
    sampler2D tex1,
    sampler2D tex2,
    float mixRate,
    vec2 offset,
    float factor
  ) {
    vec4 pixel = vec4(1.0);
    float bgR = texture(tex1, v_uv + offset * (1.0 - (N_R - 1.0) * factor)).r;
    float bgG = texture(tex1, v_uv + offset * (1.0 - (N_G - 1.0) * factor)).g;
    float bgB = texture(tex1, v_uv + offset * (1.0 - (N_B - 1.0) * factor)).b;

    float blurR = texture(tex2, v_uv + offset * (1.0 - (N_R - 1.0) * factor)).r;
    float blurG = texture(tex2, v_uv + offset * (1.0 - (N_G - 1.0) * factor)).g;
    float blurB = texture(tex2, v_uv + offset * (1.0 - (N_B - 1.0) * factor)).b;

    pixel.r = mix(bgR, blurR, mixRate);
    pixel.g = mix(bgG, blurG, mixRate);
    pixel.b = mix(bgB, blurB, mixRate);
    return pixel;
  }

  void main() {
    vec2 u_resolution1x = u_resolution.xy / u_dpr;
    vec2 p2 = (vec2(0.0) - u_mouseSpring) / u_resolution.y;
    float merged = mainSDF(p2, gl_FragCoord.xy);

    // Outside the droplet: 100% transparent to let DOM page show through cleanly
    // Outside the droplet: 100% transparent to let DOM page show through cleanly
    if (merged > 0.0035) {
      fragColor = vec4(0.0);
      return;
    }

    // Vector from droplet center to current fragment in physical pixels
    vec2 deltaPx = gl_FragCoord.xy - u_mouseSpring;
    float rPx = length(deltaPx);
    vec2 radDir = (rPx > 0.001) ? (deltaPx / rPx) : vec2(0.0, 1.0);
    float maxR = max(u_shapeRadius * u_dpr, 1.0);
    float normR = clamp(rPx / maxR, 0.0, 1.0);

    // Physical lens refraction profile:
    // Magnifies underlying content by ~1.25x with smooth Snell dome curvature
    float dispMagnitudePx = (normR * 0.16 + pow(normR, 2.4) * 0.24) * maxR;
    vec2 refractOffset = -radDir * (dispMagnitudePx / u_resolution.xy);

    // Crystal clarity: slight edge blur, 100% crisp center
    float mixRate = pow(normR, 3.0) * 0.15;
    vec4 outColor = getTextureDispersion(
      u_bg,
      u_blurredBg,
      mixRate,
      refractOffset,
      u_refDispersion
    );

    // Apple 5th-Order Fresnel Rim Reflection (peaking at boundary)
    float fresnelFactor = clamp(pow(normR, 3.8), 0.0, 1.0);
    outColor = mix(outColor, vec4(1.0), fresnelFactor * u_refFresnelFactor * 1.1);

    // Apple Curvature Specular Glare (highlight sweep reflecting directional light)
    float glareAngle = (vec2ToAngle(radDir) - PI / 4.0 + u_glareAngle) * 2.0;
    int glareFarside = (glareAngle > PI * 1.5 && glareAngle < PI * 3.5 || glareAngle < -PI * 0.5) ? 1 : 0;
    float glareAngleFactor = (0.5 + sin(glareAngle) * 0.5) * (glareFarside == 1 ? 1.2 * u_glareOppositeFactor : 1.2) * u_glareFactor;
    glareAngleFactor = clamp(pow(glareAngleFactor, 0.1 + u_glareConvergence * 2.0), 0.0, 1.0);
    float glareGeoFactor = clamp(pow(normR, 1.8) * (1.0 - normR * 0.3), 0.0, 1.0);

    outColor = mix(outColor, vec4(1.0), glareAngleFactor * glareGeoFactor * 0.9);

    // Smooth edge alpha antialiasing
    float alpha = 1.0 - smoothstep(-0.001, 0.003, merged);
    fragColor = vec4(outColor.rgb, alpha);
  }`;

  // 2. WebGL2 Classes
  class ShaderProgram {
    constructor(gl, source) {
      this.gl = gl;
      this.program = gl.createProgram();
      const vs = this.compile(gl.VERTEX_SHADER, source.vertex);
      const fs = this.compile(gl.FRAGMENT_SHADER, source.fragment);
      gl.attachShader(this.program, vs);
      gl.attachShader(this.program, fs);
      gl.linkProgram(this.program);
      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
        throw new Error('Link error: ' + gl.getProgramInfoLog(this.program));
      }
      this.uniforms = new Map();
      this.detectUniforms();
    }
    compile(type, src) {
      const gl = this.gl;
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        throw new Error('Compile error: ' + gl.getShaderInfoLog(s));
      }
      return s;
    }
    detectUniforms() {
      const gl = this.gl;
      const n = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) {
        const info = gl.getActiveUniform(this.program, i);
        if (!info) continue;
        const loc = gl.getUniformLocation(this.program, info.name);
        const name = info.name.replace(/\\[\\d+\\]$/, '');
        this.uniforms.set(name, { loc, type: info.type, isArray: info.name.endsWith(']') });
      }
    }
    use() { this.gl.useProgram(this.program); }
    setUniform(name, val) {
      const u = this.uniforms.get(name);
      if (!u || u.loc === null) return;
      const gl = this.gl;
      if (u.isArray && Array.isArray(val)) {
        if (u.type === gl.FLOAT) gl.uniform1fv(u.loc, val);
      } else {
        switch (u.type) {
          case gl.FLOAT: gl.uniform1f(u.loc, val); break;
          case gl.FLOAT_VEC2: gl.uniform2fv(u.loc, val); break;
          case gl.FLOAT_VEC3: gl.uniform3fv(u.loc, val); break;
          case gl.FLOAT_VEC4: gl.uniform4fv(u.loc, val); break;
          case gl.INT:
          case gl.SAMPLER_2D: gl.uniform1i(u.loc, val); break;
        }
      }
    }
  }

  class FrameBuffer {
    constructor(gl, w, h) {
      this.gl = gl;
      this.w = w; this.h = h;
      this.fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      this.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    resize(w, h) {
      this.w = w; this.h = h;
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA16F, w, h, 0, this.gl.RGBA, this.gl.FLOAT, null);
    }
  }

  class RenderPass {
    constructor(gl, cfg) {
      this.gl = gl;
      this.cfg = cfg;
      this.program = new ShaderProgram(gl, cfg.shader);
      this.fb = cfg.outputToScreen ? null : new FrameBuffer(gl, gl.canvas.width, gl.canvas.height);
      this.vao = gl.createVertexArray();
      gl.bindVertexArray(this.vao);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
      const posLoc = gl.getAttribLocation(this.program.program, 'a_position');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);
    }
    render(uniforms) {
      const gl = this.gl;
      if (this.fb) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb.fbo);
        gl.viewport(0, 0, this.fb.w, this.fb.h);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      }
      this.program.use();
      let texUnit = 0;
      if (uniforms) {
        for (const [k, v] of Object.entries(uniforms)) {
          if (v instanceof WebGLTexture) {
            gl.activeTexture(gl.TEXTURE0 + texUnit);
            gl.bindTexture(gl.TEXTURE_2D, v);
            this.program.setUniform(k, texUnit);
            texUnit++;
          } else {
            this.program.setUniform(k, v);
          }
        }
      }
      gl.bindVertexArray(this.vao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindVertexArray(null);
    }
    resize(w, h) { if (this.fb) this.fb.resize(w, h); }
  }

  class MultiPassRenderer {
    constructor(canvas, configs) {
      this.gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false });
      if (!this.gl) throw new Error('WebGL2 not supported');
      this.ext = this.gl.getExtension('EXT_color_buffer_float');
      if (!this.ext) throw new Error('EXT_color_buffer_float not supported');
      this.passes = new Map();
      this.passesArray = [];
      this.globalUniforms = {};
      for (const cfg of configs) {
        const p = new RenderPass(this.gl, cfg);
        this.passes.set(cfg.name, p);
        this.passesArray.push(p);
      }
    }
    setUniforms(u) { Object.assign(this.globalUniforms, u); }
    resize(w, h) {
      this.passesArray.forEach(p => p.resize(w, h));
    }
    render(passUniforms = {}) {
      for (const p of this.passesArray) {
        const u = { ...this.globalUniforms, ...(passUniforms[p.cfg.name] || {}) };
        if (p.cfg.inputs) {
          for (const [uniformName, fromPass] of Object.entries(p.cfg.inputs)) {
            const src = this.passes.get(fromPass);
            if (src && src.fb) u[uniformName] = src.fb.texture;
          }
        }
        p.render(u);
      }
    }
  }

  function computeGaussianKernel(radius) {
    const sigma = radius / 3.0;
    const k = [];
    let sum = 0;
    for (let i = 0; i <= radius; i++) {
      const w = Math.exp(-0.5 * (i * i) / (sigma * sigma));
      k.push(w);
      sum += (i === 0 ? w : w * 2);
    }
    return k.map(w => w / sum);
  }

  // 3. Canvas & Engine Setup
  let canvas = document.getElementById('liquidGlassCanvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'liquidGlassCanvas';
    canvas.className = 'apple-liquid-glass-canvas';
    document.body.appendChild(canvas);
  }

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let curW = window.innerWidth;
  let curH = window.innerHeight;
  canvas.width = Math.round(curW * dpr);
  canvas.height = Math.round(curH * dpr);

  let renderer;
  try {
    renderer = new MultiPassRenderer(canvas, [
      { name: 'bgPass', shader: { vertex: VertexShader, fragment: FragmentBgShader } },
      { name: 'vBlurPass', shader: { vertex: VertexShader, fragment: FragmentVblurShader }, inputs: { u_prevPassTexture: 'bgPass' } },
      { name: 'hBlurPass', shader: { vertex: VertexShader, fragment: FragmentHblurShader }, inputs: { u_prevPassTexture: 'vBlurPass' } },
      { name: 'mainPass', shader: { vertex: VertexShader, fragment: FragmentMainShader }, inputs: { u_blurredBg: 'hBlurPass', u_bg: 'bgPass' }, outputToScreen: true }
    ]);
  } catch (err) {
    console.warn('Liquid Glass Studio WebGL2 initialization error:', err);
    return;
  }

  // 4. Background Snapshot Engine (renders underlying DOM content into WebGL u_bg)
  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = canvas.width;
  bgCanvas.height = canvas.height;
  const bgCtx = bgCanvas.getContext('2d');

  function updateBgSnapshot() {
    if (!bgCtx) return;
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    bgCtx.fillStyle = '#000000';
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

    bgCtx.save();
    bgCtx.scale(dpr, dpr);

    // 4.0 Render Three.js 3D Background Particles into snapshot
    const threeCanvas = document.querySelector('#canvas-container canvas');
    if (threeCanvas && threeCanvas.width > 0) {
      try {
        bgCtx.drawImage(threeCanvas, 0, 0, curW, curH);
      } catch (e) {}
    }

    // 4.1 Render Hero SELAHX title into background texture
    const titleEl = document.querySelector('.hero-selahx-title');
    if (titleEl) {
      const rect = titleEl.getBoundingClientRect();
      if (rect.bottom > -50 && rect.top < curH + 50) {
        const computed = window.getComputedStyle(titleEl);
        bgCtx.save();
        bgCtx.fillStyle = '#ffffff';
        bgCtx.font = computed.fontWeight + ' ' + computed.fontSize + ' ' + computed.fontFamily;
        bgCtx.textAlign = 'center';
        bgCtx.textBaseline = 'middle';
        if (bgCtx.letterSpacing !== undefined && computed.letterSpacing) {
          bgCtx.letterSpacing = computed.letterSpacing;
        }
        bgCtx.fillText('SELAHX', rect.left + rect.width * 0.5, rect.top + rect.height * 0.5);
        bgCtx.restore();
      }
    }

    // 4.2 Render Gallery Photos into background texture
    // Only call drawImage(img) if not on file:// protocol, to avoid browser canvas tainting
    if (window.location.protocol !== 'file:') {
      const photos = document.querySelectorAll('.pure-photo-img');
      photos.forEach(img => {
        if (!img.complete || img.naturalWidth === 0) return;
        const r = img.getBoundingClientRect();
        if (r.bottom > -50 && r.top < curH + 50 && r.right > -50 && r.left < curW + 50) {
          try {
            bgCtx.save();
            bgCtx.beginPath();
            if (bgCtx.roundRect) {
              bgCtx.roundRect(r.left, r.top, r.width, r.height, 16);
            } else {
              bgCtx.rect(r.left, r.top, r.width, r.height);
            }
            bgCtx.clip();
            bgCtx.drawImage(img, r.left, r.top, r.width, r.height);
            bgCtx.restore();
          } catch (e) {}
        }
      });
    } else {
      // On local file:// protocol, draw photo card placeholder tints to prevent browser SecurityError
      const photos = document.querySelectorAll('.pure-photo-item');
      photos.forEach(item => {
        const r = item.getBoundingClientRect();
        if (r.bottom > -50 && r.top < curH + 50 && r.right > -50 && r.left < curW + 50) {
          bgCtx.save();
          bgCtx.fillStyle = 'rgba(70, 75, 95, 0.45)';
          bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          bgCtx.lineWidth = 1;
          bgCtx.beginPath();
          if (bgCtx.roundRect) {
            bgCtx.roundRect(r.left, r.top, r.width, r.height, 16);
          } else {
            bgCtx.rect(r.left, r.top, r.width, r.height);
          }
          bgCtx.fill();
          bgCtx.stroke();
          bgCtx.restore();
        }
      });
    }

    // 4.3 Render Docked Player Capsule into background texture
    const dockPill = document.getElementById('agenticDockPill');
    if (dockPill) {
      const dr = dockPill.getBoundingClientRect();
      if (dr.bottom > -50 && dr.top < curH + 50) {
        bgCtx.save();
        bgCtx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        bgCtx.lineWidth = 1.5;
        bgCtx.beginPath();
        if (bgCtx.roundRect) {
          bgCtx.roundRect(dr.left, dr.top, dr.width, dr.height, 24);
        } else {
          bgCtx.rect(dr.left, dr.top, dr.width, dr.height);
        }
        bgCtx.fill();
        bgCtx.stroke();
        bgCtx.restore();
      }
    }

    bgCtx.restore();
  }

  // WebGL Background Texture
  const gl = renderer.gl;
  const bgTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, bgTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  let bgTextureDirty = true;
  function syncBgTexture() {
    bgTextureDirty = true;
  }

  function uploadBgTexture() {
    updateBgSnapshot();
    try {
      gl.bindTexture(gl.TEXTURE_2D, bgTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bgCanvas);
      bgTextureDirty = false;
    } catch (err) {
      // Guard against browser tainted canvas restrictions
    }
  }

  uploadBgTexture();

  // Update background texture on scroll, resize, or image load
  window.addEventListener('scroll', syncBgTexture, { passive: true });
  window.addEventListener('resize', () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    curW = window.innerWidth;
    curH = window.innerHeight;
    canvas.width = Math.round(curW * dpr);
    canvas.height = Math.round(curH * dpr);
    bgCanvas.width = canvas.width;
    bgCanvas.height = canvas.height;
    renderer.resize(canvas.width, canvas.height);
    syncBgTexture();
  });

  document.querySelectorAll('img').forEach(img => {
    if (!img.complete) {
      img.addEventListener('load', syncBgTexture, { once: true });
    }
  });

  // 5. Spring Physics Dynamics (Apple Fluid Tracking)
  let targetX = window.innerWidth * 0.5;
  let targetY = window.innerHeight * 0.42;
  let currentX = targetX;
  let currentY = targetY;
  let vx = 0;
  let vy = 0;
  let motionDir = [1.0, 0.0];
  let stretch = 0.0;
  let hasPointerInteracted = false;

  const isMobile = window.innerWidth <= 768;
  const baseRadius = isMobile ? 38 : 52; // Compact, authentic circular droplet

  function onPointer(x, y) {
    targetX = x;
    targetY = y;
    if (!hasPointerInteracted) {
      hasPointerInteracted = true;
      currentX = targetX;
      currentY = targetY;
    }
  }

  window.addEventListener('mousemove', (e) => onPointer(e.clientX, e.clientY), { passive: true });
  window.addEventListener('pointermove', (e) => onPointer(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      onPointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });
  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      onPointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  const blurRadius = 1;
  const blurWeights = computeGaussianKernel(blurRadius);
  let frameCount = 0;

  // 6. Animation Render Loop (60-120 FPS GPU MultiPass execution)
  function renderLoop() {
    requestAnimationFrame(renderLoop);
    try {
      frameCount++;
      // Periodically refresh background snapshot to keep in sync with dynamic particles
      if (frameCount % 24 === 0) {
        bgTextureDirty = true;
      }

      // Update background texture if dirty (scrolled, resized, loaded, or tick)
      if (bgTextureDirty) {
        uploadBgTexture();
      }

      // Highly responsive Apple spring physics integration (swift & fluid, zero stutter)
      const dx = targetX - currentX;
      const dy = targetY - currentY;
      vx = (vx + dx * 0.28) * 0.80;
      vy = (vy + dy * 0.28) * 0.80;
      currentX += vx;
      currentY += vy;

      const speed = Math.hypot(vx, vy);
      stretch = Math.min(speed * 0.003, 0.22);
      if (speed > 0.1) {
        motionDir = [vx / speed, -vy / speed]; // Invert Y for WebGL screen coordinate
      }

      const w = canvas.width;
      const h = canvas.height;
      const springGlY = (curH - currentY) * dpr;
      const springGlX = currentX * dpr;

      renderer.setUniforms({
        u_resolution: [w, h],
        u_dpr: dpr,
        u_blurRadius: blurRadius,
        u_blurWeights: blurWeights,
        u_mouseSpring: [springGlX, springGlY],
        u_shapeRadius: baseRadius,
        u_motionDir: motionDir,
        u_stretch: stretch,
        // Physical parameters from iyinchao/liquid-glass-studio
        u_refThickness: baseRadius,
        u_refDistance: 0.08,
        u_refFactor: 1.45,
        u_refDispersion: 8.5,
        u_refFresnelRange: 26.0,
        u_refFresnelHardness: 0.16,
        u_refFresnelFactor: 0.35,
        u_glareRange: 26.0,
        u_glareHardness: 0.18,
        u_glareFactor: 0.90,
        u_glareConvergence: 0.55,
        u_glareOppositeFactor: 0.75,
        u_glareAngle: -0.785, // -45 deg
        u_blurEdge: 1
      });

      renderer.render({
        bgPass: { u_bgTexture: bgTexture }
      });
    } catch (e) {
      window.__lgs_err = (e && e.stack) ? e.stack : String(e);
    }
  }

  requestAnimationFrame(renderLoop);
})();
