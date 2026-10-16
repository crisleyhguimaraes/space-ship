// Simplex noise by Ian McEwan, Ashima Arts (MIT). https://github.com/ashima/webgl-noise
export const simplex = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float fbm(vec3 p) {
  float amplitude = 0.5;
  float sum = 0.0;
  for (int i = 0; i < 5; i++) {
    sum += amplitude * snoise(p);
    p *= 2.03;
    amplitude *= 0.5;
  }
  return sum;
}
`

const planetVertex = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorld;
varying vec3 vObject;
void main() {
  vObject = position;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const planetFragment = /* glsl */ `
uniform vec3 uSunPos;
uniform float uTime;
uniform vec3 uLow;
uniform vec3 uMid;
uniform vec3 uHigh;
uniform vec3 uAtmosphere;
uniform vec3 uGlow;
uniform float uClouds;
uniform float uBands;
varying vec3 vNormal;
varying vec3 vWorld;
varying vec3 vObject;
${simplex}
void main() {
  vec3 p = normalize(vObject);
  float height;
  if (uBands > 0.5) {
    float warp = fbm(p * 2.0 + vec3(uTime * 0.01, 0.0, 0.0)) * 0.35;
    height = fbm(vec3(p.y * 9.0 + warp * 3.0, p.x * 0.6, p.z * 0.6)) * 0.5 + 0.5;
  } else {
    height = fbm(p * 2.5) * 0.5 + 0.5;
  }
  float ridges = 1.0 - abs(snoise(p * 6.0));
  vec3 ground = mix(uLow, uMid, smoothstep(0.38, 0.52, height));
  ground = mix(ground, uHigh, smoothstep(0.62, 0.8, height) * ridges);
  float clouds = smoothstep(0.5, 0.75, fbm(p * 3.0 + vec3(uTime * 0.012, 0.0, 0.0)) * 0.5 + 0.5) * uClouds;
  vec3 albedo = mix(ground, vec3(1.0), clouds * 0.75);

  vec3 N = normalize(vNormal);
  vec3 L = normalize(uSunPos - vWorld);
  vec3 V = normalize(cameraPosition - vWorld);
  float diffuse = max(dot(N, L), 0.0);
  float dayside = smoothstep(-0.15, 0.35, dot(N, L));
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 color = albedo * (0.025 + diffuse * 1.6) + uAtmosphere * rim * (0.15 + 0.85 * dayside);
  color += uGlow * smoothstep(0.5, 0.3, height) * (1.0 - clouds);
  gl_FragColor = vec4(color, 1.0);
}
`

const atmosphereFragment = /* glsl */ `
uniform vec3 uSunPos;
uniform vec3 uAtmosphere;
varying vec3 vNormal;
varying vec3 vWorld;
void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 L = normalize(uSunPos - vWorld);
  float halo = pow(clamp(-dot(N, V) / 0.33, 0.0, 1.0), 1.6);
  float dayside = smoothstep(-0.4, 0.4, dot(N, L));
  gl_FragColor = vec4(uAtmosphere * halo * (0.1 + 0.9 * dayside) * 1.4, 1.0);
}
`

export const planetShader = { vertexShader: planetVertex, fragmentShader: planetFragment }
export const atmosphereShader = { vertexShader: planetVertex, fragmentShader: atmosphereFragment }
