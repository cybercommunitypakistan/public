// =============================================================================
// FILE: components/hero/ink/InkEngine.ts
// Framework-agnostic WebGL2 liquid-ink engine.
//  - Ink lives in a GPU float texture (ping-pong), so strokes are smooth at any
//    frame rate: each frame paints a capsule from the last brush position to
//    the new one (no dotted gaps), with a spring-smoothed brush.
//  - Faster moves = thicker ink + flung droplets that merge gooey-style.
//  - `intro` / `scroll` (0..1) flood the whole hero with ink — tween them with
//    GSAP for the "liquid drain" intro and the scroll transition.
//  - `reveal` (0..1, with letterReveal) makes the wordmark letters rise in.
// =============================================================================

import { VERT, SIM_FRAG, RENDER_FRAG } from './shaders';

export type InkEngineOptions = {
  /** Wordmark lines on wide screens (each line is stretched to full width). */
  lines: readonly string[];
  /** Wordmark lines when the hero is taller than wide (phones). */
  compactLines?: readonly string[];
  fontFamily: string;
  fontWeight?: number;
  colors?: { paper?: string; ink?: string };
  /** Optional photo revealed inside the letters instead of the procedural texture. */
  textureSrc?: string;
  /** Seconds a stroke stays visible (default 1.6). */
  lifetime?: number;
  /** Brush size multiplier (default 1). */
  brush?: number;
  /** Ghost cursor when the user is idle (default true). */
  autoplay?: boolean;
  reducedMotion?: boolean;
  onContextLost?: () => void;
  /** Starting flood level (1 = flooded, default). Use 0 for no intro flood. */
  intro?: number;
  /** Wordmark layout inside the canvas. */
  layout?: {
    /** Max wordmark height as a share of the canvas (default 0.5 / 0.44 compact). */
    maxHeight?: number;
    /** Vertical centre 0..1 from the top (default 0.53). */
    centerY?: number;
    /** Side padding as a share of width (default 0.025, min 16px). */
    padX?: number;
    /** 'center' (default) or 'bottom' = sit on the bottom edge of the canvas. */
    anchor?: 'center' | 'bottom';
  };
  /** Draw letters one by one so `engine.reveal` (0..1) can make them rise in. */
  letterReveal?: boolean;
};

type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer };
type Seg = { ax: number; ay: number; bx: number; by: number; ra: number; rb: number };
type Drop = { x: number; y: number; r: number };

const MAX_DROPS = 8;
const LINEAR_DECAY = 0.04;

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export class InkEngine {
  /** 1 = hero flooded with ink (intro start) → 0 = drained. */
  intro = 1;
  /** 0..1 flood driven by scroll. */
  scroll = 0;
  readonly ready: Promise<void>;

  private gl: WebGL2RenderingContext;
  private simProg: WebGLProgram;
  private renderProg: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private vbo: WebGLBuffer;
  private locs = new Map<WebGLProgram, Map<string, WebGLUniformLocation | null>>();
  private fmt: { internal: number; type: number };
  private targets: [Target, Target] | null = null;
  private maskTex: WebGLTexture;
  private photoTex: WebGLTexture;
  private hasPhoto = false;
  private photoAspect = 1;
  private mask = document.createElement('canvas');

  private W = 0;
  private H = 0;
  private simW = 2;
  private simH = 2;

  private lines: readonly string[];
  private compactLines?: readonly string[];
  private fontFamily: string;
  private fontWeight: number;
  private paper: [number, number, number];
  private ink: [number, number, number];
  private decay: number;
  private brush: number;
  private autoplay: boolean;
  private reduced: boolean;
  private onContextLost?: () => void;
  private layout: NonNullable<InkEngineOptions['layout']>;
  private letterReveal: boolean;
  private revealV = 1;
  private maskDirty = false;

  // brush state (CSS px)
  private mode: 'none' | 'user' | 'ghost' = 'none';
  private tx = 0;
  private ty = 0;
  private bx = 0;
  private by = 0;
  private br = 0;
  private sv = 0;
  private lastUser = -1e9;
  private seg: Seg | null = null;
  private drops: Drop[] = [];
  private dropBuf = new Float32Array(MAX_DROPS * 4);

  private raf = 0;
  private t0 = performance.now();
  private prev = performance.now();
  private visible = true;
  private destroyed = false;
  private ro: ResizeObserver;
  private io: IntersectionObserver;

  constructor(private canvas: HTMLCanvasElement, opts: InkEngineOptions) {
    const gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl;

    this.lines = opts.lines;
    this.compactLines = opts.compactLines;
    this.fontFamily = opts.fontFamily;
    this.fontWeight = opts.fontWeight ?? 900;
    this.paper = hexToRgb(opts.colors?.paper ?? '#f3f5f4');
    this.ink = hexToRgb(opts.colors?.ink ?? '#071a2b');
    const life = Math.max(0.4, opts.lifetime ?? 1.6);
    this.decay = -Math.log(0.5 + LINEAR_DECAY * life) / life; // peak hits threshold at `life`
    this.brush = opts.brush ?? 1;
    this.autoplay = opts.autoplay ?? true;
    this.reduced = !!opts.reducedMotion;
    this.onContextLost = opts.onContextLost;
    this.intro = opts.intro ?? 1;
    this.layout = opts.layout ?? {};
    this.letterReveal = !!opts.letterReveal;
    // letters start hidden and wait for `reveal` (unless reduced motion)
    if (this.letterReveal && !opts.reducedMotion) this.revealV = 0;
    if (this.reduced) this.intro = 0;

    // Half-float field if we can render to it (smoothest), else 8-bit
    this.fmt = gl.getExtension('EXT_color_buffer_float')
      ? { internal: gl.RGBA16F, type: gl.HALF_FLOAT }
      : { internal: gl.RGBA8, type: gl.UNSIGNED_BYTE };

    this.simProg = this.program(VERT, SIM_FRAG);
    this.renderProg = this.program(VERT, RENDER_FRAG);

    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    this.vbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.maskTex = this.texture();
    this.photoTex = this.texture();

    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.io = new IntersectionObserver(([e]) => (this.visible = e.isIntersecting));
    this.io.observe(canvas);

    window.addEventListener('pointermove', this.onPointer, { passive: true });
    window.addEventListener('pointerdown', this.onPointer, { passive: true });
    document.documentElement.addEventListener('pointerleave', this.onLeave);
    window.addEventListener('blur', this.onLeave);
    canvas.addEventListener('webglcontextlost', this.onLost);

    if (opts.textureSrc) this.loadPhoto(opts.textureSrc);

    this.ready = this.loadFont().then(() => {
      if (!this.destroyed) this.drawMask();
    });

    this.raf = requestAnimationFrame(this.frame);
  }

  // ---------------------------------------------------------------------------
  // GL helpers
  // ---------------------------------------------------------------------------
  private program(vs: string, fs: string) {
    const gl = this.gl;
    const make = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
      return s;
    };
    const p = gl.createProgram()!;
    const v = make(gl.VERTEX_SHADER, vs);
    const f = make(gl.FRAGMENT_SHADER, fs);
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    gl.deleteShader(v);
    gl.deleteShader(f);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link');
    return p;
  }

  private loc(p: WebGLProgram, name: string) {
    let m = this.locs.get(p);
    if (!m) this.locs.set(p, (m = new Map()));
    if (!m.has(name)) m.set(name, this.gl.getUniformLocation(p, name));
    return m.get(name)!;
  }

  private texture() {
    const gl = this.gl;
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    return t;
  }

  private target(w: number, h: number): Target {
    const gl = this.gl;
    const tex = this.texture();
    gl.texImage2D(gl.TEXTURE_2D, 0, this.fmt.internal, w, h, 0, gl.RGBA, this.fmt.type, null);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE && this.fmt.type !== gl.UNSIGNED_BYTE) {
      gl.deleteFramebuffer(fbo);
      gl.deleteTexture(tex);
      this.fmt = { internal: gl.RGBA8, type: gl.UNSIGNED_BYTE };
      return this.target(w, h);
    }
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { tex, fbo };
  }

  private freeTargets() {
    if (!this.targets) return;
    for (const t of this.targets) {
      this.gl.deleteFramebuffer(t.fbo);
      this.gl.deleteTexture(t.tex);
    }
    this.targets = null;
  }

  // ---------------------------------------------------------------------------
  // Sizing, wordmark, texture
  // ---------------------------------------------------------------------------
  private resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h || this.destroyed) return;
    const sameSize = w === this.W && h === this.H;
    this.W = w;
    this.H = h;
    const dpr = Math.min(window.devicePixelRatio || 1, w < 768 ? 1.5 : 1.75);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);

    if (!sameSize || !this.targets) {
      const s = w > 1400 ? 0.45 : 0.55;
      this.simW = Math.max(2, Math.round(w * s));
      this.simH = Math.max(2, Math.round(h * s));
      this.freeTargets();
      this.targets = [this.target(this.simW, this.simH), this.target(this.simW, this.simH)];
    }
    this.drawMask();
  }

  private async loadFont() {
    if (!('fonts' in document)) return;
    const text = [...this.lines, ...(this.compactLines ?? [])].join('');
    try {
      await Promise.race([
        document.fonts.load(`${this.fontWeight} 100px ${this.fontFamily}`, text),
        new Promise((r) => setTimeout(r, 2500)),
      ]);
    } catch {
      /* fall back to whatever is available */
    }
  }

  private drawMask() {
    const gl = this.gl;
    const dpr = this.canvas.width / Math.max(1, this.W);
    const w = (this.mask.width = this.canvas.width);
    const h = (this.mask.height = this.canvas.height);
    const ctx = this.mask.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);

    const compact = this.W / this.H < 0.9 && this.compactLines?.length;
    const lines = compact ? this.compactLines! : this.lines;
    const pad = Math.max(16, this.W * (this.layout.padX ?? 0.025)) * dpr;
    const targetW = w - pad * 2;

    // fit every line to the full width (justified poster block)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const metrics = lines.map((line) => {
      ctx.font = `${this.fontWeight} 100px ${this.fontFamily}`;
      const m = ctx.measureText(line);
      const size = (targetW / Math.max(1, m.width)) * 100;
      const k = size / 100;
      return {
        line,
        size,
        asc: (m.actualBoundingBoxAscent || 72) * k,
        desc: (m.actualBoundingBoxDescent || 0) * k,
      };
    });
    const gap = (lines.length > 1 ? 0.055 : 0) * Math.min(...metrics.map((m) => m.size));
    let total = metrics.reduce((s, m) => s + m.asc + m.desc, 0) + gap * (lines.length - 1);
    const maxH = h * (this.layout.maxHeight ?? (compact ? 0.44 : 0.5));
    const fit = total > maxH ? maxH / total : 1;
    total *= fit;

    let y =
      this.layout.anchor === 'bottom'
        ? h - total - h * 0.03
        : h * (this.layout.centerY ?? 0.53) - total / 2;
    ctx.fillStyle = '#000';
    for (const m of metrics) {
      ctx.font = `${this.fontWeight} ${m.size * fit}px ${this.fontFamily}`;
      y += m.asc * fit;
      if (this.letterReveal && this.revealV < 1) this.drawLetters(ctx, m.line, w / 2, y, (m.asc + m.desc) * fit);
      else ctx.fillText(m.line, w / 2, y);
      y += m.desc * fit + gap * fit;
    }

    gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.mask);
  }

  /** Letters rise from below one after another, driven by `reveal` (0..1). */
  private drawLetters(ctx: CanvasRenderingContext2D, line: string, cx: number, baseline: number, lineH: number) {
    const chars = [...line];
    const n = chars.length;
    const stagger = n > 1 ? 0.45 / (n - 1) : 0; // spread of start times
    const span = 1 - stagger * (n - 1);
    const full = ctx.measureText(line).width;
    const left = cx - full / 2;
    ctx.save();
    ctx.textAlign = 'left';
    let prefix = '';
    chars.forEach((ch, i) => {
      const x = left + ctx.measureText(prefix).width; // prefix width keeps kerning
      prefix += ch;
      const p = Math.min(1, Math.max(0, (this.revealV - i * stagger) / span));
      const e = 1 - Math.pow(1 - p, 4); // easeOutQuart
      const dy = (1 - e) * lineH * 1.15;
      if (p > 0) ctx.fillText(ch, x, baseline + dy);
    });
    ctx.restore();
  }

  /** 0..1 — letters rise in (only with `letterReveal: true`). Tween it with GSAP. */
  get reveal() {
    return this.revealV;
  }
  set reveal(v: number) {
    const c = Math.min(1, Math.max(0, v));
    if (c === this.revealV) return;
    this.revealV = c;
    this.maskDirty = true;
  }

  private loadPhoto(src: string) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (this.destroyed) return;
      const gl = this.gl;
      try {
        gl.bindTexture(gl.TEXTURE_2D, this.photoTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        this.hasPhoto = true;
        this.photoAspect = img.naturalWidth / img.naturalHeight;
      } catch {
        console.warn('[InkEngine] texture blocked by CORS — using procedural texture');
      }
    };
    img.src = src;
  }

  // ---------------------------------------------------------------------------
  // Input
  // ---------------------------------------------------------------------------
  private onPointer = (e: PointerEvent) => {
    const r = this.canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (x < 0 || y < 0 || x > r.width || y > r.height) {
      if (this.mode === 'user') this.mode = 'none';
      return;
    }
    this.lastUser = performance.now();
    if (this.mode !== 'user') {
      // jump (don't draw a line from the old position) and grow from nothing
      this.mode = 'user';
      this.bx = x;
      this.by = y;
      this.br = 0;
      this.sv = 0;
    }
    this.tx = x;
    this.ty = y;
  };

  private onLeave = () => {
    if (this.mode === 'user') this.mode = 'none';
  };

  private onLost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(this.raf);
    this.onContextLost?.();
  };

  // ---------------------------------------------------------------------------
  // Loop
  // ---------------------------------------------------------------------------
  private frame = (now: number) => {
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(0.05, Math.max(0.001, (now - this.prev) / 1000));
    this.prev = now;
    if (!this.visible || !this.W || !this.targets) return;
    const t = this.reduced ? 0 : (now - this.t0) / 1000;
    if (this.maskDirty) {
      this.maskDirty = false;
      this.drawMask();
    }
    this.updateBrush(now, dt);
    this.simulate(dt, t);
    this.render(t);
  };

  private ghost(now: number) {
    const s = (now - this.t0) / 1000;
    return {
      x: this.W * (0.5 + 0.42 * Math.sin(s * 0.53) * Math.cos(s * 0.21)),
      y: this.H * (0.53 + 0.2 * Math.sin(s * 0.87 + 1.1)),
    };
  }

  private updateBrush(now: number, dt: number) {
    this.seg = null;
    const idle = now - this.lastUser > 2600;
    const calm = this.intro < 0.05 && this.scroll < 0.05;

    if (this.autoplay && !this.reduced && idle && calm) {
      const g = this.ghost(now);
      if (this.mode !== 'ghost') {
        this.mode = 'ghost';
        this.bx = g.x;
        this.by = g.y;
        this.br = 0;
        this.sv = 0;
      }
      this.tx = g.x;
      this.ty = g.y;
    } else if (this.mode === 'ghost') {
      this.mode = 'none';
    }
    if (this.mode === 'none') return;

    // spring-smoothed brush → silky strokes even with jumpy mouse events
    const k = 1 - Math.exp(-dt * (this.mode === 'ghost' ? 5 : 14));
    const nx = this.bx + (this.tx - this.bx) * k;
    const ny = this.by + (this.ty - this.by) * k;
    const dx = nx - this.bx;
    const dy = ny - this.by;
    const dist = Math.hypot(dx, dy);
    this.sv += (dist / dt - this.sv) * Math.min(1, dt * 8);

    const base = Math.max(30, Math.min(this.W, this.H) * 0.075) * this.brush;
    const speedK = Math.min(this.sv / 1500, 1);
    const targetR = base * (0.6 + speedK * 0.9) * (this.mode === 'ghost' ? 0.85 : 1);
    const nr = this.br + (targetR - this.br) * Math.min(1, dt * 10);

    this.seg = { ax: this.bx, ay: this.by, bx: nx, by: ny, ra: this.br, rb: nr };

    // droplets flung sideways on fast strokes
    if (this.mode === 'user' && this.sv > 1100 && dist > 0 && Math.random() < dt * 18) {
      const ux = dx / dist;
      const uy = dy / dist;
      const n = 1 + (Math.random() < 0.4 ? 1 : 0);
      for (let i = 0; i < n && this.drops.length < MAX_DROPS; i++) {
        const side = Math.random() < 0.5 ? 1 : -1;
        const d = nr * (1.3 + Math.random() * 1.6);
        const back = nr * (Math.random() * 1.2);
        this.drops.push({
          x: nx - ux * back - uy * side * d,
          y: ny - uy * back + ux * side * d,
          r: nr * (0.16 + Math.random() * 0.24),
        });
      }
    }

    this.bx = nx;
    this.by = ny;
    this.br = nr;
  }

  private simulate(dt: number, t: number) {
    const gl = this.gl;
    const [read, write] = this.targets!;
    const P = this.simProg;
    const aspect = this.W / this.H;
    const ax = (x: number) => (x / this.W) * aspect;
    const ay = (y: number) => 1 - y / this.H;
    const ar = (r: number) => r / this.H;

    gl.useProgram(P);
    gl.bindVertexArray(this.vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, write.fbo);
    gl.viewport(0, 0, this.simW, this.simH);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, read.tex);
    gl.uniform1i(this.loc(P, 'uPrev'), 0);
    gl.uniform2f(this.loc(P, 'uTexel'), 1 / this.simW, 1 / this.simH);
    gl.uniform1f(this.loc(P, 'uAspect'), aspect);
    gl.uniform1f(this.loc(P, 'uDt'), dt);
    gl.uniform1f(this.loc(P, 'uTime'), t);
    gl.uniform1f(this.loc(P, 'uDecay'), this.decay);
    gl.uniform1f(this.loc(P, 'uLinear'), LINEAR_DECAY);

    const s = this.seg;
    gl.uniform1f(this.loc(P, 'uSegOn'), s ? 1 : 0);
    if (s) {
      gl.uniform4f(this.loc(P, 'uSeg'), ax(s.ax), ay(s.ay), ax(s.bx), ay(s.by));
      gl.uniform2f(this.loc(P, 'uSegR'), ar(s.ra), ar(s.rb));
    }

    const count = Math.min(this.drops.length, MAX_DROPS);
    this.dropBuf.fill(0);
    for (let i = 0; i < count; i++) {
      const d = this.drops[i];
      this.dropBuf.set([ax(d.x), ay(d.y), ar(d.r), 1.0], i * 4);
    }
    this.drops.length = 0;
    gl.uniform4fv(this.loc(P, 'uDrops'), this.dropBuf);
    gl.uniform1i(this.loc(P, 'uDropCount'), count);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.targets = [write, read];
  }

  private render(t: number) {
    const gl = this.gl;
    const P = this.renderProg;
    gl.useProgram(P);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.targets![0].tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.photoTex);
    gl.uniform1i(this.loc(P, 'uField'), 0);
    gl.uniform1i(this.loc(P, 'uMask'), 1);
    gl.uniform1i(this.loc(P, 'uTex'), 2);

    gl.uniform1f(this.loc(P, 'uHasTex'), this.hasPhoto ? 1 : 0);
    gl.uniform1f(this.loc(P, 'uTexAspect'), this.photoAspect);
    gl.uniform1f(this.loc(P, 'uAspect'), this.W / this.H);
    gl.uniform1f(this.loc(P, 'uTime'), t);
    gl.uniform1f(this.loc(P, 'uFlood'), Math.min(1, Math.max(0, this.intro, this.scroll)));
    gl.uniform2f(this.loc(P, 'uRes'), this.canvas.width, this.canvas.height);
    gl.uniform3fv(this.loc(P, 'uPaper'), this.paper);
    gl.uniform3fv(this.loc(P, 'uInk'), this.ink);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // ---------------------------------------------------------------------------
  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
    this.io.disconnect();
    window.removeEventListener('pointermove', this.onPointer);
    window.removeEventListener('pointerdown', this.onPointer);
    document.documentElement.removeEventListener('pointerleave', this.onLeave);
    window.removeEventListener('blur', this.onLeave);
    this.canvas.removeEventListener('webglcontextlost', this.onLost);
    const gl = this.gl;
    this.freeTargets();
    gl.deleteTexture(this.maskTex);
    gl.deleteTexture(this.photoTex);
    gl.deleteBuffer(this.vbo);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.simProg);
    gl.deleteProgram(this.renderProg);
  }
}
