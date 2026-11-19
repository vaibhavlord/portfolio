/* Deform the existing artwork on a small GPU mesh; retain its full texture detail. */
(() => {
  'use strict';
  const image = document.querySelector('.hero-ink');
  const canvas = document.querySelector('.ink-flame');
  const container = document.querySelector('.hero-flow');
  if (!image || !canvas || !container) return;

  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const vertexSource = `
    precision highp float;
    attribute vec2 a_uv;
    uniform float u_time;
    uniform float u_strength;
    varying vec2 v_uv;

    void main() {
      vec2 p = a_uv;
      float t = u_time;
      // Each wave travels upwards; different wavelengths produce curling tongues.
      float rising = sin(p.y * 12.0 - t * 1.6 + sin(p.x * 5.0 + t * 0.27));
      float flicker = sin(p.y * 25.0 - t * 3.2 + p.x * 7.0);
      float curl = sin(p.x * 7.0 + p.y * 11.0 - t * 1.5);
      float pulse = 0.86 + 0.14 * sin(t * 0.73 + p.y * 3.0);
      // Fix the outer edge, so the artwork never exposes a rectangular gap.
      float envelope = sin(p.x * 3.14159265) * sin(p.y * 3.14159265);
      float lift = 0.8 + 0.45 * p.y;
      vec2 flow = vec2(
        (rising * 0.029 + flicker * 0.012) * lift,
        curl * 0.014 + sin(p.y * 8.0 - t * 1.05) * 0.005
      );
      flow *= envelope * pulse * u_strength;
      gl_Position = vec4((p + flow) * 2.0 - 1.0, 0.0, 1.0);
      v_uv = p;
    }
  `;
  const fragmentSource = `
    precision highp float;
    uniform sampler2D u_image;
    uniform vec2 u_cover;
    uniform vec2 u_position;
    varying vec2 v_uv;

    void main() {
      vec2 uv = v_uv * u_cover + (vec2(1.0) - u_cover) * u_position;
      vec3 color = texture2D(u_image, uv).rgb;
      float gray = dot(color, vec3(0.2126, 0.7152, 0.0722));
      gl_FragColor = vec4(vec3(gray), 1.0);
    }
  `;

  let enabled = false;
  let visible = true;
  let ready = false;
  let failed = false;
  let needsResize = true;
  let raf = 0;
  let previousTime = null;
  let elapsed = 0;
  let gl;
  let program;
  let vertices;
  let indices;
  let texture;
  let uniforms;
  let indexCount = 0;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      throw new Error('Ink shader unavailable');
    }
    return shader;
  }

  function release() {
    if (!gl || gl.isContextLost()) return;
    if (vertices) gl.deleteBuffer(vertices);
    if (indices) gl.deleteBuffer(indices);
    if (texture) gl.deleteTexture(texture);
    if (program) gl.deleteProgram(program);
    vertices = indices = texture = program = null;
  }

  function initialize() {
    if (ready) return true;
    if (failed || !image.complete || !image.naturalWidth) return false;
    try {
      gl = canvas.getContext('webgl', {
        alpha: false, antialias: false, depth: false, stencil: false,
        premultipliedAlpha: false, preserveDrawingBuffer: false,
        powerPreference: 'low-power'
      });
      if (!gl) { failed = true; return false; }
      const vertex = compile(gl.VERTEX_SHADER, vertexSource);
      const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
      program = gl.createProgram();
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Ink program unavailable');
      gl.useProgram(program);

      // 7,957 vertices: distortion runs per vertex, not per high-resolution pixel.
      const columns = 72, rows = 108;
      const points = new Float32Array((columns + 1) * (rows + 1) * 2);
      let offset = 0;
      for (let y = 0; y <= rows; y++) {
        for (let x = 0; x <= columns; x++) {
          points[offset++] = x / columns;
          points[offset++] = y / rows;
        }
      }
      const triangles = new Uint16Array(columns * rows * 6);
      offset = 0;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          const a = y * (columns + 1) + x, b = a + columns + 1;
          triangles[offset++] = a; triangles[offset++] = a + 1; triangles[offset++] = b;
          triangles[offset++] = a + 1; triangles[offset++] = b + 1; triangles[offset++] = b;
        }
      }
      indexCount = triangles.length;
      vertices = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
      gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
      const attribute = gl.getAttribLocation(program, 'a_uv');
      gl.enableVertexAttribArray(attribute);
      gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
      indices = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangles, gl.STATIC_DRAW);

      texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      uniforms = {
        time: gl.getUniformLocation(program, 'u_time'),
        strength: gl.getUniformLocation(program, 'u_strength'),
        cover: gl.getUniformLocation(program, 'u_cover'),
        position: gl.getUniformLocation(program, 'u_position')
      };
      gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0);
      ready = true;
      needsResize = true;
      return true;
    } catch (_) {
      release();
      failed = true;
      container.classList.remove('flame-ready');
      return false;
    }
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, bounds.width), height = Math.max(1, bounds.height);
    const ratio = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4000000 / (width * height))));
    const renderWidth = Math.round(width * ratio), renderHeight = Math.round(height * ratio);
    if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
      canvas.width = renderWidth;
      canvas.height = renderHeight;
    }
    gl.viewport(0, 0, renderWidth, renderHeight);
    const aspect = width / height, sourceAspect = image.naturalWidth / image.naturalHeight;
    gl.uniform2f(uniforms.cover, Math.min(1, aspect / sourceAspect), Math.min(1, sourceAspect / aspect));
    const position = (getComputedStyle(image).objectPosition || '55% 47%').split(/\s+/);
    const x = parseFloat(position[0]) / 100, y = parseFloat(position[1]) / 100;
    gl.uniform2f(uniforms.position, Number.isFinite(x) ? x : .55, Number.isFinite(y) ? 1 - y : .53);
    needsResize = false;
  }

  function canPlay() {
    return enabled && visible && !document.hidden && !preference.matches && !failed;
  }

  function tick(timestamp) {
    raf = 0;
    if (!canPlay() || !ready || gl.isContextLost()) return;
    if (previousTime !== null) elapsed += Math.min(50, Math.max(0, timestamp - previousTime)) / 1000;
    previousTime = timestamp;
    if (needsResize) resize();
    gl.uniform1f(uniforms.time, elapsed);
    // Ease in from the unchanged image, avoiding a jump on first load or resume.
    gl.uniform1f(uniforms.strength, Math.min(1, elapsed * .9));
    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
    container.classList.add('flame-ready');
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    previousTime = null;
  }

  function reconcile() {
    if (!canPlay()) { stop(); return; }
    if (initialize() && !raf) raf = requestAnimationFrame(tick);
  }

  window.portfolioInkFlame = {
    setEnabled(value) {
      const next = Boolean(value);
      if (next === enabled) { reconcile(); return; }
      enabled = next;
      if (!enabled) {
        stop();
        container.classList.remove('flame-ready');
      } else {
        elapsed = 0;
        needsResize = true;
        reconcile();
      }
    }
  };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      reconcile();
    }, { rootMargin: '60px', threshold: 0 }).observe(container);
  }
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { needsResize = true; }).observe(container);
  }
  image.addEventListener('load', () => { failed = false; reconcile(); });
  image.addEventListener('error', () => { stop(); container.classList.remove('flame-ready'); });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    stop();
    ready = false;
    container.classList.remove('flame-ready');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    ready = false;
    failed = false;
    elapsed = 0;
    reconcile();
  });
  preference.addEventListener('change', reconcile);
  document.addEventListener('visibilitychange', reconcile);
  addEventListener('resize', () => { needsResize = true; });
  addEventListener('pagehide', stop);
  addEventListener('pageshow', reconcile);
})();
