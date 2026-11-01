// =============================================================================
// FILE: components/InkHero.tsx
// Liquid "ink" hero (inspired by noth.in).
//  - Giant black wordmark on white
//  - Cursor paints a gooey black ink trail (faster = thicker, with droplets)
//  - Where ink overlaps the letters, it reveals a glossy texture
//    (your image via `textureSrc`, or a built-in procedural "wet stones" look)
//  - Ink slowly dissolves; an idle "ghost cursor" keeps the hero alive
// Pure WebGL — no extra npm packages. Tailwind for the layout/UI.
// =============================================================================

'use client';

import { useEffect, useRef } from 'react';

type Link = { label: string; href: string };

export type InkHeroProps = {
  /** The giant word drawn on the canvas. */
  word?: string;
  /** Two-line tagline, top-left. */
  tagline?: [string, string];
  ctaLabel?: string;
  ctaHref?: string;
  /** Bottom-left caption. */
  caption?: string;
  links?: Link[];
  /** Optional photo revealed inside the letters (cover-fit). Same-origin or CORS-enabled. */
  textureSrc?: string;
  /** CSS font-family used for the wordmark (pass next/font's style.fontFamily). */
  fontFamily?: string;
  /** Wordmark font weight. */
  fontWeight?: number;
  /** Wander automatically when the user is idle. */
  autoplay?: boolean;
  /** 0.5 – 2: how fast the ink dissolves. */
  fade?: number;
  /** Brush size multiplier. */
  brush?: number;
  onMenuClick?: () => void;
  className?: string;
};

// -----------------------------------------------------------------------------
// Shaders
// -----------------------------------------------------------------------------

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 vUv;

uniform sampler2D uField;   // ink density (red channel)
uniform sampler2D uMask;    // wordmark (alpha)
uniform sampler2D uTex;     // optional photo
uniform float uHasTex;
uniform float uTexAspect;   // photo width / height
uniform float uAspect;      // canvas width / height
uniform float uTime;
uniform vec2  uPx;          // 1.0 / resolution

// ---- noise ----------------------------------------------------------------
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

// ---- procedural "wet stones & droplets" texture ---------------------------
vec3 procTex(vec2 p) {
  vec2 q = p * 5.5;
  vec2 ip = floor(q), fp = fract(q);
  float md = 8.0; vec2 mr = vec2(0.0); float id = 0.0;
  for (int y = -1; y <= 1; y++)
  for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = hash2(ip + g);
    o = 0.5 + 0.38 * sin(uTime * 0.35 + 6.2831 * o);
    vec2 r = g + o - fp;
    float d = dot(r, r);
    if (d < md) { md = d; mr = r; id = hash(ip + g); }
  }
  float d = sqrt(md);
  float size = mix(0.28, 0.5, id);
  float drop = smoothstep(size, size * 0.55, d);

  // stone / mineral base
  float m = fbm(p * 3.0 + vec2(id * 7.0));
  vec3 warm = mix(vec3(0.20, 0.17, 0.15), vec3(0.78, 0.71, 0.63), m);
  vec3 cool = mix(vec3(0.16, 0.18, 0.20), vec3(0.70, 0.73, 0.76), m);
  vec3 base = mix(warm, cool, step(0.55, id));

  // droplet shading
  vec3 n = normalize(vec3(-mr / max(size, 0.001) * 1.4, 1.0));
  vec3 l = normalize(vec3(-0.5, 0.6, 0.65));
  float diff = clamp(dot(n, l), 0.0, 1.0);
  float spec = pow(clamp(dot(reflect(-l, n), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 28.0);
  vec3 col = base * (0.55 + 0.6 * diff * drop + 0.25 * (1.0 - drop));
  col += spec * drop * 1.1;
  col *= 1.0 - 0.35 * smoothstep(size * 0.9, size, d) * drop; // dark rim
  return col;
}

vec3 photoTex(vec2 uv) {
  // cover-fit the photo over the canvas
  vec2 st = uv;
  if (uAspect > uTexAspect) {
    st.y = (st.y - 0.5) * (uTexAspect / uAspect) + 0.5;
  } else {
    st.x = (st.x - 0.5) * (uAspect / uTexAspect) + 0.5;
  }
  return texture2D(uTex, vec2(st.x, 1.0 - st.y)).rgb;
}

void main() {
  vec2 uv = vUv;
  vec2 ap = vec2(uv.x * uAspect, uv.y);

  // organic wobble on the ink edges
  vec2 off = (vec2(fbm(ap * 4.0 + uTime * 0.25), fbm(ap * 4.0 - uTime * 0.25 + 9.0)) - 0.5) * 0.018;
  float f = texture2D(uField, uv + off).r;

  // gooey threshold — a narrow band keeps fading ink crisp (no grey banding)
  float aa = 0.007;
  float ink = smoothstep(0.42 - aa, 0.42 + aa, f);

  float letter = texture2D(uMask, vec2(uv.x, 1.0 - uv.y)).a;

  // Black where (ink XOR letter); texture where both overlap
  float both  = ink * letter;
  float black = clamp(ink + letter - 2.0 * both, 0.0, 1.0);
  vec3 col = mix(vec3(1.0), vec3(0.0), black);

  vec3 tex = uHasTex > 0.5 ? photoTex(uv) : procTex(ap);
  // subtle glossy rim where the ink edge cuts into a letter
  float rim = smoothstep(0.30, 0.42, f) * (1.0 - smoothstep(0.42, 0.55, f));
  tex += rim * 0.25;
  col = mix(col, tex, both);

  gl_FragColor = vec4(col, 1.0);
}`;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(log ?? 'Shader compile error');
  }
  return s;
}

function makeTexture(gl: WebGLRenderingContext) {
  const t = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // 1×1 placeholder
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
  return t;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function InkHero({
  word = 'STUDIO',
  tagline = ['Not a style, a perspective.', 'Because details are everything.'],
  ctaLabel = 'Book a call',
  ctaHref = '#contact',
  caption = 'Creative studio',
  links = [
    { label: 'LinkedIn', href: '#' },
    { label: 'Instagram', href: '#' },
  ],
  textureSrc,
  fontFamily = '"Archivo Black", "Arial Black", Impact, system-ui, sans-serif',
  fontWeight = 900,
  autoplay = true,
  fade = 1,
  brush = 1,
  onMenuClick,
  className = '',
}: InkHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, alpha: false });
    if (!gl) {
      section.dataset.fallback = 'true'; // CSS shows the plain wordmark instead
      return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---- program ----------------------------------------------------------
    let program: WebGLProgram;
    try {
      program = gl.createProgram()!;
      gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'link');
    } catch (e) {
      console.error('[InkHero]', e);
      section.dataset.fallback = 'true';
      return;
    }
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = {
      field: gl.getUniformLocation(program, 'uField'),
      mask: gl.getUniformLocation(program, 'uMask'),
      tex: gl.getUniformLocation(program, 'uTex'),
      hasTex: gl.getUniformLocation(program, 'uHasTex'),
      texAspect: gl.getUniformLocation(program, 'uTexAspect'),
      aspect: gl.getUniformLocation(program, 'uAspect'),
      time: gl.getUniformLocation(program, 'uTime'),
      px: gl.getUniformLocation(program, 'uPx'),
    };

    const fieldTex = makeTexture(gl);
    const maskTex = makeTexture(gl);
    const photoTex = makeTexture(gl);
    gl.uniform1i(u.field, 0);
    gl.uniform1i(u.mask, 1);
    gl.uniform1i(u.tex, 2);
    gl.uniform1f(u.hasTex, 0);

    // ---- offscreen canvases ---------------------------------------------
    const field = document.createElement('canvas'); // low-res ink density
    const fctx = field.getContext('2d')!;
    const mask = document.createElement('canvas'); // wordmark
    const mctx = mask.getContext('2d')!;

    const FIELD_SCALE = 0.35; // field resolution relative to CSS pixels
    let W = 0, H = 0, dpr = 1;

    function drawMask() {
      mask.width = Math.max(1, Math.round(W * dpr));
      mask.height = Math.max(1, Math.round(H * dpr));
      mctx.clearRect(0, 0, mask.width, mask.height);
      mctx.fillStyle = '#000';
      mctx.textAlign = 'center';
      mctx.textBaseline = 'alphabetic';

      // Fit the word to ~96% width and ~42% height
      let size = 100;
      mctx.font = `${fontWeight} ${size}px ${fontFamily}`;
      const m = mctx.measureText(word);
      const wordW = m.width || 1;
      const capH = (m.actualBoundingBoxAscent || size * 0.72) + (m.actualBoundingBoxDescent || 0);
      const scale = Math.min((mask.width * 0.96) / wordW, (mask.height * 0.42) / capH);
      size = Math.floor(size * scale);
      mctx.font = `${fontWeight} ${size}px ${fontFamily}`;
      const m2 = mctx.measureText(word);
      const asc = m2.actualBoundingBoxAscent || size * 0.72;
      const desc = m2.actualBoundingBoxDescent || 0;
      const y = mask.height * 0.53 + (asc - desc) / 2;
      mctx.fillText(word, mask.width / 2, y);

      gl!.activeTexture(gl!.TEXTURE1);
      gl!.bindTexture(gl!.TEXTURE_2D, maskTex);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, mask);
    }

    function resize() {
      const r = section!.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      gl!.viewport(0, 0, canvas!.width, canvas!.height);

      // keep existing ink when resizing
      const old = document.createElement('canvas');
      old.width = field.width; old.height = field.height;
      if (field.width && field.height) old.getContext('2d')!.drawImage(field, 0, 0);
      field.width = Math.max(1, Math.round(W * FIELD_SCALE));
      field.height = Math.max(1, Math.round(H * FIELD_SCALE));
      fctx.fillStyle = '#000';
      fctx.fillRect(0, 0, field.width, field.height);
      if (old.width && old.height) fctx.drawImage(old, 0, 0, field.width, field.height);

      drawMask();
      gl!.uniform1f(u.aspect, W / H);
      gl!.uniform2f(u.px, 1 / canvas!.width, 1 / canvas!.height);
    }

    // ---- ink brush ---------------------------------------------------------
    function stamp(x: number, y: number, r: number, strength = 1) {
      const fx = x * FIELD_SCALE, fy = y * FIELD_SCALE, fr = Math.max(1.5, r * FIELD_SCALE);
      const g = fctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
      g.addColorStop(0, `rgba(255,255,255,${0.9 * strength})`);
      g.addColorStop(0.55, `rgba(255,255,255,${0.55 * strength})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      fctx.globalCompositeOperation = 'lighter';
      fctx.fillStyle = g;
      fctx.beginPath();
      fctx.arc(fx, fy, fr, 0, Math.PI * 2);
      fctx.fill();
      fctx.globalCompositeOperation = 'source-over';
    }

    // brush radius follows the hero size (W/H are set by resize())
    const baseRadius = () => Math.max(34, Math.min(W, H) * 0.075) * brush;
    let last: { x: number; y: number; t: number } | null = null;
    let lastUserMove = -1e9;

    function paint(x: number, y: number, now: number, ghost = false) {
      const base = baseRadius();
      if (!last) { last = { x, y, t: now }; stamp(x, y, base * 0.8); return; }
      const dx = x - last.x, dy = y - last.y;
      const dist = Math.hypot(dx, dy);
      const dt = Math.max(1, now - last.t);
      const speed = dist / dt; // px per ms
      const radius = (base * (0.7 + Math.min(speed, 3) * 0.55)) * (ghost ? 0.75 : 1);
      const steps = Math.max(1, Math.ceil(dist / (radius * 0.25)));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        stamp(last.x + dx * t, last.y + dy * t, radius);
      }
      // droplets flung sideways on fast moves
      if (!ghost && speed > 1.2 && Math.random() < 0.55) {
        const n = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
          const ang = Math.atan2(dy, dx) + (Math.random() < 0.5 ? 1 : -1) * (Math.PI / 2) + (Math.random() - 0.5) * 0.9;
          const d = radius * (1.4 + Math.random() * 2.2);
          stamp(x + Math.cos(ang) * d, y + Math.sin(ang) * d, radius * (0.18 + Math.random() * 0.3), 1.2);
        }
      }
      last = { x, y, t: now };
    }

    // ---- pointer -------------------------------------------------------
    function onMove(e: PointerEvent) {
      const r = section!.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) { last = null; return; }
      lastUserMove = performance.now();
      paint(x, y, lastUserMove);
    }
    function onLeave() { last = null; }
    section.addEventListener('pointermove', onMove, { passive: true });
    section.addEventListener('pointerdown', onMove, { passive: true });
    section.addEventListener('pointerleave', onLeave);

    // ---- optional photo ------------------------------------------------
    let cancelled = false;
    if (textureSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (cancelled) return;
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, photoTex);
        try {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          gl.uniform1f(u.hasTex, 1);
          gl.uniform1f(u.texAspect, img.naturalWidth / img.naturalHeight);
        } catch {
          console.warn('[InkHero] texture blocked by CORS — using procedural texture');
        }
      };
      img.src = textureSrc;
    }

    // ---- loop ------------------------------------------------------------
    const ro = new ResizeObserver(resize);
    ro.observe(section);
    resize();
    // Redraw the wordmark once web fonts are ready
    document.fonts?.ready.then(() => { if (!cancelled) drawMask(); });

    let raf = 0;
    let prev = performance.now();
    const start = prev;
    let visible = true;
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; });
    io.observe(section);

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (!visible) { prev = now; return; }
      const dt = Math.min(64, now - prev);
      prev = now;

      // Idle ghost cursor
      if (autoplay && !reduceMotion && now - lastUserMove > 2200) {
        const t = (now - start) / 1000;
        const gx = W * (0.5 + 0.38 * Math.sin(t * 0.43) * Math.cos(t * 0.17));
        const gy = H * (0.52 + 0.3 * Math.sin(t * 0.71 + 1.3));
        paint(gx, gy, now, true);
      } else if (now - lastUserMove > 120 && now - lastUserMove < 2200) {
        last = null; // lift the brush between gestures
      }

      // Dissolve: multiplicative fade + a tiny linear subtract
      // (the subtract removes 8-bit leftovers so old ink fully disappears)
      const k = Math.min(0.25, 0.006 * fade * (dt / 16.67));
      fctx.globalCompositeOperation = 'source-over';
      fctx.fillStyle = `rgba(0,0,0,${k})`;
      fctx.fillRect(0, 0, field.width, field.height);
      fctx.globalCompositeOperation = 'difference';
      fctx.fillStyle = 'rgb(1,1,1)';
      fctx.fillRect(0, 0, field.width, field.height);
      fctx.globalCompositeOperation = 'source-over';

      gl!.activeTexture(gl!.TEXTURE0);
      gl!.bindTexture(gl!.TEXTURE_2D, fieldTex);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, field);
      gl!.activeTexture(gl!.TEXTURE1);
      gl!.bindTexture(gl!.TEXTURE_2D, maskTex);
      gl!.activeTexture(gl!.TEXTURE2);
      gl!.bindTexture(gl!.TEXTURE_2D, photoTex);

      gl!.uniform1f(u.time, reduceMotion ? 0 : (now - start) / 1000);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerdown', onMove);
      section.removeEventListener('pointerleave', onLeave);
      gl.deleteTexture(fieldTex);
      gl.deleteTexture(maskTex);
      gl.deleteTexture(photoTex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
    };
  }, [word, textureSrc, fontFamily, fontWeight, autoplay, fade, brush]);

  return (
    <section
      ref={sectionRef}
      className={`group relative h-[100svh] min-h-[560px] w-full select-none overflow-hidden bg-white text-black ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* WebGL layer */}
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full group-data-[fallback=true]:hidden" />

      {/* Accessible heading + no-WebGL fallback (visible only if WebGL fails) */}
      <h1
        className="sr-only group-data-[fallback=true]:not-sr-only group-data-[fallback=true]:absolute group-data-[fallback=true]:inset-x-0 group-data-[fallback=true]:top-1/2 group-data-[fallback=true]:-translate-y-1/2 group-data-[fallback=true]:text-center group-data-[fallback=true]:text-[18vw] group-data-[fallback=true]:font-black group-data-[fallback=true]:leading-none"
        style={{ fontFamily }}
      >
        {word}
      </h1>

      {/* UI overlay — no z-index on purpose: `mix-blend-difference` must blend with the canvas,
          so text stays readable over white AND over black ink */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
        {/* Top row */}
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-4 sm:space-y-6">
            <p className="text-white mix-blend-difference text-[clamp(17px,1.6vw,24px)] font-medium leading-[1.12] tracking-[-0.03em]">
              {tagline[0]}
              <br />
              {tagline[1]}
            </p>
            <a
              href={ctaHref}
              className="pointer-events-auto group/cta inline-flex items-center gap-3 rounded-full bg-black px-5 py-3.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white ring-1 ring-white/0 transition-all duration-300 hover:gap-4 hover:bg-white hover:text-black hover:ring-black"
            >
              {ctaLabel}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="transition-transform duration-300 group-hover/cta:translate-x-0.5">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          </div>

          <button
            type="button"
            onClick={onMenuClick}
            className="pointer-events-auto text-white mix-blend-difference inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
          >
            Menu
            <span aria-hidden className="grid grid-cols-2 gap-[2px]">
              <i className="h-[3px] w-[3px] bg-current" /><i className="h-[3px] w-[3px] bg-current" />
              <i className="h-[3px] w-[3px] bg-current" /><i className="h-[3px] w-[3px] bg-current" />
            </span>
          </button>
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between gap-6 text-white mix-blend-difference">
          <p className="text-[12px] font-medium tracking-tight">{caption}</p>
          <nav aria-label="Social" className="pointer-events-auto flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.1em]">
            {links.map((l, i) => (
              <span key={l.href + i} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden>/</span>}
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">
                  {l.label}
                </a>
              </span>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}