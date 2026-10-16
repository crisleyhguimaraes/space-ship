import { AdditiveBlending, BufferGeometry, CircleGeometry, Float32BufferAttribute, Mesh, PointLight, Points, ShaderMaterial, UniformsLib, UniformsUtils } from 'three'
import { VOLCANO } from './biomes.ts'
import { simplex } from './planet-shader.ts'

export type Wind = { x: number; z: number }
type Ground = (x: number, z: number) => number

const SMOKE_COUNT = 400
const SMOKE_LIFE_SECONDS = 14
const SMOKE_RISE = 9

export function buildVolcano(ground: Ground) {
  const floor = ground(VOLCANO.x, VOLCANO.z)
  const lava = buildLava(floor)
  const light = new PointLight(0xff6a20, 3, 420, 1.6)
  light.position.set(VOLCANO.x, floor + 30, VOLCANO.z)
  const smoke = buildSmoke(VOLCANO.x, floor + 4, VOLCANO.z)
  return {
    objects: [lava.mesh, light, smoke.points],
    update(dt: number, time: number, wind: Wind) {
      lava.material.uniforms.uTime.value = time
      light.intensity = 2.5 + Math.sin(time * 2.1) * 0.8 + Math.sin(time * 5.3) * 0.4
      smoke.update(dt, wind)
    },
  }
}

function buildLava(floor: number) {
  const material = new ShaderMaterial({
    uniforms: UniformsUtils.merge([UniformsLib.fog, { uTime: { value: 0 } }]),
    fog: true,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      #include <fog_pars_vertex>
      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      #include <fog_pars_fragment>
      ${simplex}
      void main() {
        float n = fbm(vec3(vUv * 6.0, uTime * 0.15));
        float crust = smoothstep(0.1, 0.5, n);
        vec3 hot = mix(vec3(6.0, 1.2, 0.1), vec3(8.0, 5.0, 0.8), smoothstep(0.4, 0.8, n));
        vec3 color = mix(hot, vec3(0.12, 0.02, 0.0), crust * 0.85);
        gl_FragColor = vec4(color, 1.0);
        #include <fog_fragment>
      }`,
  })
  const mesh = new Mesh(new CircleGeometry(VOLCANO.crater * 0.9, 48).rotateX(-Math.PI / 2), material)
  mesh.position.set(VOLCANO.x, floor + 2, VOLCANO.z)
  return { mesh, material }
}

function buildSmoke(x: number, y: number, z: number) {
  const positions = new Float32Array(SMOKE_COUNT * 3)
  const life = new Float32Array(SMOKE_COUNT)
  const drift = new Float32Array(SMOKE_COUNT * 2)
  for (let i = 0; i < SMOKE_COUNT; i++) {
    life[i] = Math.random()
    seed(i)
  }
  function seed(i: number) {
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * VOLCANO.crater * 0.6
    positions[i * 3] = x + Math.cos(angle) * radius
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z + Math.sin(angle) * radius
    drift[i * 2] = (Math.random() - 0.5) * 2
    drift[i * 2 + 1] = (Math.random() - 0.5) * 2
  }
  for (let i = 0; i < SMOKE_COUNT; i++) positions[i * 3 + 1] = y + life[i] * SMOKE_LIFE_SECONDS * SMOKE_RISE

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('aLife', new Float32BufferAttribute(life, 1))
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float aLife;
      varying float vLife;
      void main() {
        vLife = aLife;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = (14.0 + aLife * 70.0) * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }`,
    fragmentShader: /* glsl */ `
      varying float vLife;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float soft = smoothstep(0.5, 0.1, d);
        float alpha = sin(vLife * 3.14159) * 0.22;
        vec3 color = mix(vec3(0.35, 0.18, 0.1), vec3(0.42, 0.42, 0.46), vLife);
        gl_FragColor = vec4(color * soft, soft * alpha);
      }`,
  })
  const points = new Points(geometry, material)
  points.frustumCulled = false
  return {
    points,
    update(dt: number, wind: Wind) {
      const step = dt / SMOKE_LIFE_SECONDS
      for (let i = 0; i < SMOKE_COUNT; i++) {
        life[i] += step
        if (life[i] >= 1) {
          life[i] -= 1
          seed(i)
        }
        positions[i * 3] += (wind.x * 6 + drift[i * 2]) * dt * (0.5 + life[i])
        positions[i * 3 + 1] += SMOKE_RISE * dt * (1.2 - life[i] * 0.6)
        positions[i * 3 + 2] += (wind.z * 6 + drift[i * 2 + 1]) * dt * (0.5 + life[i])
      }
      geometry.getAttribute('position').needsUpdate = true
      geometry.getAttribute('aLife').needsUpdate = true
    },
  }
}
