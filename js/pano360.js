/* Mengyixing 360° equirectangular panorama viewer (WebGL, data-URL safe) */
(function () {
  'use strict';

  const VS = `
    attribute vec2 aPos;
    varying vec2 vPos;
    void main() {
      vPos = aPos;
      gl_Position = vec4(aPos, 0.0, 1.0);
    }
  `;
  const FS = `
    precision highp float;
    varying vec2 vPos;
    uniform sampler2D uTex;
    uniform float uYaw;
    uniform float uPitch;
    uniform float uAspect;
    const float PI = 3.141592653589793;
    void main() {
      vec3 d = normalize(vec3(vPos.x * uAspect * 0.78, vPos.y * 0.78, -1.0));
      float cp = cos(uPitch), sp = sin(uPitch);
      d = vec3(d.x, d.y * cp - d.z * sp, d.y * sp + d.z * cp);
      float cy = cos(uYaw), sy = sin(uYaw);
      d = vec3(d.x * cy - d.z * sy, d.y, d.x * sy + d.z * cy);
      float lon = atan(d.x, -d.z);
      float lat = asin(clamp(d.y, -1.0, 1.0));
      vec2 uv = vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI);
      gl_FragColor = texture2D(uTex, uv);
    }
  `;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }

  function isPOT(n) {
    return n > 0 && (n & (n - 1)) === 0;
  }

  function create(canvas) {
    const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) return null;
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uYaw = gl.getUniformLocation(program, 'uYaw');
    const uPitch = gl.getUniformLocation(program, 'uPitch');
    const uAspect = gl.getUniformLocation(program, 'uAspect');

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    let ready = false, yaw = 0, pitch = 0, aspect = 1, seq = 0;

    function draw() {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.09, 0.16, 0.12, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (!ready) return;
      gl.useProgram(program);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1f(uYaw, yaw);
      gl.uniform1f(uPitch, pitch);
      gl.uniform1f(uAspect, aspect);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    /* 支持「先低清后超清」：后发起的加载会覆盖先前的，避免缩略图把高清图顶掉 */
    function setSource(src) {
      if (!src) return;
      const my = ++seq;
      const image = new Image();
      image.decoding = 'async';
      image.onload = function () {
        if (my !== seq) return;
        try {
          const pot = isPOT(image.width) && isPOT(image.height);
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, pot ? gl.REPEAT : gl.CLAMP_TO_EDGE);
          if (pot) {
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          }
          ready = true;
          draw();
        } catch (e) {
          if (my !== seq) return;
          window.__panoDiag = { error: String(e && e.message || e), w: image.width, h: image.height };
          if (window.console && console.warn) console.warn('[pano] texture upload failed:', e);
          draw();
        }
      };
      image.onerror = function () {
        if (my !== seq) return;
        window.__panoDiag = { error: 'image load failed', src: src };
        if (window.console && console.warn) console.warn('[pano] image load failed:', src);
      };
      image.src = src;
    }

    return {
      resize(w, h) {
        if (!w || !h) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.max(2, Math.round(w * dpr));
        canvas.height = Math.max(2, Math.round(h * dpr));
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        aspect = canvas.width / canvas.height;
        draw();
      },
      setYaw(deg) {
        yaw = (deg % 360) * Math.PI / 180;
        draw();
      },
      setPitch(rad) {
        pitch = Math.max(-0.85, Math.min(0.85, rad));
        draw();
      },
      getPitch() { return pitch; },
      setSource,
      redraw: draw,
      isReady() { return ready; }
    };
  }

  window.Pano360 = { create };
})();
