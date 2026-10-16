import {
  BackSide,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Fog,
  HemisphereLight,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Points,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three'
import { DAY_SECONDS, daylightAt } from './daylight.ts'
import { buildStars } from './stars.ts'
import { createWeather, stepWeather, type Wind } from './weather.ts'

export type AtmosphereFrame = { wind: Wind; rain: number; clouds: number; flash: boolean }
export type SkyTint = { horizon: [number, number, number]; zenith: [number, number, number]; fog: [number, number, number] }

const FLASH_SECONDS = 0.12
const CLOUD_COUNT = 60
const CLOUD_SPAN = 1100
const RAIN_COUNT = 3000
const RAIN_BOX = { half: 80, height: 100 }
const RAIN_FALL = 60

export function buildAtmosphere(startDay: number, tint: SkyTint, random = Math.random) {
  const tinted = (rgb: [number, number, number], t: [number, number, number]): [number, number, number] => [rgb[0] * t[0], rgb[1] * t[1], rgb[2] * t[2]]
  const sun = new DirectionalLight(0xffffff, 2)
  const hemisphere = new HemisphereLight(0x6a5aa8, 0x2a5a48, 1.6)
  const fog = new Fog(0x3b2150, 250, 900)
  const background = new Color(0x3b2150)
  const sky = buildSky()
  const stars = buildStars(random, 3800)
  const clouds = buildClouds(random)
  const rain = buildRain(random)
  const weather = createWeather(random)
  const sunDir = new Vector3()
  let dayTime = startDay
  let flashTimer = 0

  return {
    objects: [sun, hemisphere, sky.mesh, stars, clouds.mesh, rain.points] as Object3D[],
    fog,
    background,
    update(dt: number, cameraPosition: Vector3): AtmosphereFrame {
      dayTime = (dayTime + dt / DAY_SECONDS) % 1
      const d = daylightAt(dayTime)
      const w = stepWeather(weather, dt, random)
      if (w.flash) flashTimer = FLASH_SECONDS
      flashTimer = Math.max(0, flashTimer - dt)
      const flash = flashTimer > 0 ? 1 : 0
      const grey = w.clouds * 0.75

      sunDir.set(d.sunDir[0], d.sunDir[1], d.sunDir[2])
      sun.position.copy(sunDir).multiplyScalar(100)
      sun.color.setRGB(...d.sunColor)
      sun.intensity = d.sunIntensity * (1 - 0.7 * w.clouds)
      hemisphere.intensity = d.ambient * (1.6 - 0.5 * w.clouds) + flash * 6
      hemisphere.color.setRGB(...tinted(d.sky, tint.zenith)).lerp(GREY, grey).multiplyScalar(1.6)

      sky.uniforms.uHorizon.value.setRGB(...tinted(d.horizon, tint.horizon)).lerp(GREY, grey)
      sky.uniforms.uZenith.value.setRGB(...tinted(d.sky, tint.zenith)).lerp(GREY, grey * 0.8)
      sky.uniforms.uSunDir.value.copy(sunDir)
      sky.uniforms.uSunColor.value.setRGB(...d.sunColor)
      sky.uniforms.uSunGlow.value = (d.sunIntensity / 3.2) * (1 - w.clouds)
      sky.uniforms.uFlash.value = flash

      background.setRGB(...tinted(d.fog, tint.fog)).lerp(GREY, grey)
      fog.color.copy(background)
      fog.near = 250 * (1 - 0.5 * w.rain)
      fog.far = 900 * (1 - 0.55 * w.rain)
      stars.material.opacity = d.stars * (1 - w.clouds)

      clouds.update(dt, w.wind, w.clouds, background)
      rain.update(dt, w.rain, w.wind, cameraPosition)
      return { wind: w.wind, rain: w.rain, clouds: w.clouds, flash: w.flash }
    },
  }
}

const GREY = new Color(0.42, 0.43, 0.46)

function buildSky() {
  const uniforms = {
    uHorizon: { value: new Color(0x3b2150) },
    uZenith: { value: new Color(0x0a0518) },
    uSunDir: { value: new Vector3(0, 1, 0) },
    uSunColor: { value: new Color(1, 0.69, 0.44) },
    uSunGlow: { value: 1 },
    uFlash: { value: 0 },
  }
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uHorizon;
      uniform vec3 uZenith;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform float uSunGlow;
      uniform float uFlash;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        vec3 sky = mix(uHorizon, uZenith, smoothstep(0.0, 0.45, d.y));
        float s = max(dot(d, uSunDir), 0.0);
        sky += uSunColor * (pow(s, 8.0) * 0.6 + pow(s, 90.0) * 2.5) * uSunGlow;
        sky += vec3(0.7) * uFlash;
        gl_FragColor = vec4(sky, 1.0);
      }`,
    side: BackSide,
    depthWrite: false,
    fog: false,
  })
  return { mesh: new Mesh(new SphereGeometry(4000, 24, 12), material), uniforms }
}

function cloudTexture(): CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,0.9)')
  gradient.addColorStop(0.55, 'rgba(255,255,255,0.35)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  return new CanvasTexture(canvas)
}

function buildClouds(random: () => number) {
  const material = new MeshBasicMaterial({ map: cloudTexture(), transparent: true, depthWrite: false, opacity: 0.5, side: DoubleSide })
  const mesh = new InstancedMesh(new PlaneGeometry(1, 1).rotateX(-Math.PI / 2), material, CLOUD_COUNT)
  mesh.frustumCulled = false
  const puffs = Array.from({ length: CLOUD_COUNT }, () => ({
    x: (random() * 2 - 1) * CLOUD_SPAN,
    z: (random() * 2 - 1) * CLOUD_SPAN,
    y: 170 + random() * 40,
    size: 120 + random() * 160,
    spin: random() * Math.PI * 2,
  }))
  const dummy = new Object3D()
  const place = () => {
    puffs.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z)
      dummy.rotation.set(0, p.spin, 0)
      dummy.scale.set(p.size, 1, p.size * 0.7)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }
  place()
  return {
    mesh,
    update(dt: number, wind: Wind, cover: number, tint: Color) {
      for (const p of puffs) {
        p.x = wrap(p.x + wind.x * 10 * dt)
        p.z = wrap(p.z + wind.z * 10 * dt)
      }
      place()
      material.opacity = 0.3 + 0.55 * cover
      material.color.copy(tint).lerp(WHITE, 0.6 - 0.45 * cover)
    },
  }
}

const WHITE = new Color(1, 1, 1)

function wrap(v: number): number {
  if (v > CLOUD_SPAN) return v - 2 * CLOUD_SPAN
  if (v < -CLOUD_SPAN) return v + 2 * CLOUD_SPAN
  return v
}

function buildRain(random: () => number) {
  const positions = new Float32Array(RAIN_COUNT * 3)
  for (let i = 0; i < RAIN_COUNT; i++) {
    positions[i * 3] = (random() * 2 - 1) * RAIN_BOX.half
    positions[i * 3 + 1] = random() * RAIN_BOX.height
    positions[i * 3 + 2] = (random() * 2 - 1) * RAIN_BOX.half
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  const material = new ShaderMaterial({
    uniforms: { uRain: { value: 0 } },
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      void main() {
        gl_PointSize = 2.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uRain;
      void main() {
        gl_FragColor = vec4(0.72, 0.8, 0.95, 0.55 * uRain);
      }`,
  })
  const points = new Points(geometry, material)
  points.frustumCulled = false
  points.visible = false
  return {
    points,
    update(dt: number, rain: number, wind: Wind, cameraPosition: Vector3) {
      material.uniforms.uRain.value = rain
      points.visible = rain > 0.02
      if (!points.visible) return
      points.position.copy(cameraPosition).setY(cameraPosition.y - RAIN_BOX.height * 0.6)
      for (let i = 0; i < RAIN_COUNT; i++) {
        let y = positions[i * 3 + 1] - RAIN_FALL * dt
        if (y < 0) y += RAIN_BOX.height
        positions[i * 3 + 1] = y
        positions[i * 3] = fold(positions[i * 3] + wind.x * 8 * dt)
        positions[i * 3 + 2] = fold(positions[i * 3 + 2] + wind.z * 8 * dt)
      }
      geometry.getAttribute('position').needsUpdate = true
    },
  }
}

function fold(v: number): number {
  if (v > RAIN_BOX.half) return v - 2 * RAIN_BOX.half
  if (v < -RAIN_BOX.half) return v + 2 * RAIN_BOX.half
  return v
}
