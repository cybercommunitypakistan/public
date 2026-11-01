// =============================================================================
// FILE: components/hero/ink/shaders.ts
// GLSL (WebGL2) for the liquid ink hero.
//   SIM_FRAG    — ink density field on the GPU (ping-pong): drift, diffusion,
//                 decay + smooth capsule brush strokes and droplets.
//   RENDER_FRAG — composites paper / ink / wordmark and reveals the glossy
//                 "cyber liquid" texture where ink overlaps the letters.
// =============================================================================

export const VERT = /* glsl */ `#version 300 es
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const NOISE = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
             mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) { v += a * vnoise(p); p = m * p; a *= 0.5; }
  return v;
}`;

// -----------------------------------------------------------------------------
// Simulation
// -----------------------------------------------------------------------------
export const SIM_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uPrev;
uniform vec2  uTexel;
uniform float uAspect;
uniform float uDt;
uniform float uTime;
uniform float uDecay;    // exponential decay / second
uniform float uLinear;   // linear decay / second (clears leftovers)
uniform vec4  uSeg;      // brush segment a.xy -> b.xy (aspect space)
uniform vec2  uSegR;     // radius at a, b
uniform float uSegOn;
uniform vec4  uDrops[8]; // x, y, radius, strength
uniform int   uDropCount;
${NOISE}

float segDist(vec2 p, vec2 a, vec2 b, out float h) {
  vec2 pa = p - a, ba = b - a;
  h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
  return length(pa - ba * h);
}
// smooth falloff: 1 at centre, 0.5 exactly at radius r
float blob(float d, float r) {
  float x = d / max(r, 1e-5);
  return exp(-x * x * 0.6931);
}

void main() {
  vec2 p = vec2(vUv.x * uAspect, vUv.y);

  // slow liquid drift so old ink keeps moving a little
  vec2 drift = vec2(vnoise(p * 2.5 + uTime * 0.12), vnoise(p * 2.5 + 17.3 - uTime * 0.1)) - 0.5;
  vec2 uv = vUv - drift * 0.05 * uDt;

  float c = texture(uPrev, uv).r;
  float n = texture(uPrev, uv + vec2(uTexel.x, 0.0)).r
          + texture(uPrev, uv - vec2(uTexel.x, 0.0)).r
          + texture(uPrev, uv + vec2(0.0, uTexel.y)).r
          + texture(uPrev, uv - vec2(0.0, uTexel.y)).r;
  float f = mix(c, n * 0.25, clamp(uDt * 5.0, 0.0, 0.4));   // soft diffusion
  f = max(f * exp(-uDecay * uDt) - uLinear * uDt, 0.0);

  if (uSegOn > 0.5) {
    float h;
    float d = segDist(p, uSeg.xy, uSeg.zw, h);
    f = max(f, blob(d, mix(uSegR.x, uSegR.y, h)));
  }
  for (int i = 0; i < 8; i++) {
    if (i >= uDropCount) break;
    vec4 dr = uDrops[i];
    f += blob(length(p - dr.xy), dr.z) * dr.w;              // additive = gooey merge
  }
  outColor = vec4(min(f, 1.6), 0.0, 0.0, 1.0);
}`;

// -----------------------------------------------------------------------------
// Composite
// -----------------------------------------------------------------------------
export const RENDER_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uField;
uniform sampler2D uMask;
uniform sampler2D uTex;
uniform float uHasTex;
uniform float uTexAspect;
uniform float uAspect;
uniform float uTime;
uniform float uFlood;   // 0 = no flood, 1 = whole hero filled with ink
uniform vec2  uRes;
uniform vec3  uPaper;
uniform vec3  uInk;
${NOISE}

vec4 hexCoords(vec2 uv) {
  const vec2 r = vec2(1.0, 1.7320508);
  vec2 h = r * 0.5;
  vec2 a = mod(uv, r) - h;
  vec2 b = mod(uv - h, r) - h;
  vec2 gv = dot(a, a) < dot(b, b) ? a : b;
  return vec4(gv, uv - gv);
}
float hexDist(vec2 p) {
  p = abs(p);
  return max(dot(p, normalize(vec2(1.0, 1.7320508))), p.x);
}

// Glossy emerald liquid-metal with a hex grid underneath and a scan band
vec3 cyberTex(vec2 p, float t) {
  vec2 q = p * 1.5;
  vec2 w = vec2(fbm(q + vec2(0.0, t * 0.06)), fbm(q + vec2(5.2, 1.3) - t * 0.05));
  float h = fbm(q * 1.3 + w * 1.9);

  vec2 g = vec2(dFdx(h), dFdy(h)) * uRes.y * 0.2;
  vec3 n = normalize(vec3(-g, 1.0));
  vec3 L = normalize(vec3(-0.45, 0.55, 0.7));
  float diff = max(dot(n, L), 0.0);
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 48.0);
  float fres = pow(1.0 - clamp(n.z, 0.0, 1.0), 1.5);

  vec3 deep = vec3(0.008, 0.06, 0.07);
  vec3 mid  = vec3(0.03, 0.50, 0.36);
  vec3 hi   = vec3(0.62, 1.0, 0.86);
  vec3 col = mix(deep, mid, smoothstep(0.30, 0.78, h));
  col *= 0.35 + 0.95 * diff;
  col += hi * fres * 0.9 + vec3(spec) * 1.3;

  vec2 hp = (p + n.xy * 0.04) * 16.0;
  vec4 hc = hexCoords(hp);
  float e = 0.5 - hexDist(hc.xy);
  float line = 1.0 - smoothstep(0.0, fwidth(e) * 1.5 + 0.015, e);
  float pulse = 0.5 + 0.5 * sin(t * 1.4 + hash12(hc.zw) * 6.2831);
  col += vec3(0.25, 1.0, 0.72) * line * (0.10 + 0.25 * pulse * pulse);

  float band = exp(-pow((fract(p.y * 0.55 - t * 0.09) - 0.5) * 14.0, 2.0));
  col += vec3(0.2, 0.9, 0.65) * band * 0.22;
  return col;
}

vec3 photo(vec2 uv) {
  vec2 st = uv;
  if (uAspect > uTexAspect) st.y = (st.y - 0.5) * (uTexAspect / uAspect) + 0.5;
  else                      st.x = (st.x - 0.5) * (uAspect / uTexAspect) + 0.5;
  return texture(uTex, vec2(st.x, 1.0 - st.y)).rgb;
}

void main() {
  vec2 uv = vUv;
  vec2 p = vec2(uv.x * uAspect, uv.y);

  // ink from the simulation — crisp threshold, AA from screen derivatives
  float f = texture(uField, uv).r;
  float w = fwidth(f) * 0.75 + 1e-4;
  float ink = smoothstep(0.5 - w, 0.5 + w, f);

  // flood: a liquid surface that drains (intro) or rises (scroll)
  float wave = sin(p.x * 7.0 + uTime * 1.6) * 0.012 + (fbm(vec2(p.x * 3.0, uTime * 0.3)) - 0.5) * 0.05;
  float level = uFlood * 1.3 - 0.15 + wave;
  float fw = fwidth(uv.y) * 1.5;
  float flood = 1.0 - smoothstep(level - fw, level + fw, uv.y);
  ink = max(ink, flood);

  float letter = texture(uMask, vec2(uv.x, 1.0 - uv.y)).a;
  float both = ink * letter;
  float dark = clamp(ink + letter - 2.0 * both, 0.0, 1.0);
  vec3 col = mix(uPaper, uInk, dark);

  vec3 tex = uHasTex > 0.5 ? photo(uv) : cyberTex(p, uTime);
  float rim = (1.0 - smoothstep(0.0, 0.12, abs(f - 0.5))) * (1.0 - flood);
  tex += rim * vec3(0.55, 1.0, 0.8) * 0.35;
  col = mix(col, tex, both);

  outColor = vec4(col, 1.0);
}`;
