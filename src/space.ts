import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PointLight,
  Points,
  PointsMaterial,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  Vector3,
} from 'three'
import { atmosphereShader, planetShader, simplex } from './planet-shader.ts'
import { buildStars } from './stars.ts'
import { ASTEROID_BELT, BLACK_HOLE, COMETS, SUN_RADIUS, SYSTEM, cometPosition, orbitPosition, type MoonSpec, type PlanetSpec, type Rgb, type ShaderLook } from './system.ts'

export type Body = { key: string; name: string; radius: number; position: Vector3; landable: boolean }

const STAR_DISTANCE = 20000
const SUN_POSITION = new Vector3(0, 0, 0)
const COMET_TAIL_POINTS = 400
const COMET_TAIL_LENGTH = 600

export async function loadSpaceTextures(): Promise<Map<string, Texture>> {
  const loader = new TextureLoader()
  const urls = SYSTEM.flatMap((p) => (p.look.kind === 'textured' ? [p.look.color, p.look.normal] : []))
  const textures = await Promise.all(urls.map((url) => loader.loadAsync(url)))
  const map = new Map<string, Texture>()
  urls.forEach((url, i) => map.set(url, textures[i]))
  for (const p of SYSTEM) if (p.look.kind === 'textured') map.get(p.look.color)!.colorSpace = SRGBColorSpace
  return map
}

export function buildSpace(textures: Map<string, Texture>, random = Math.random) {
  const scene = new Scene()
  const bodies: Body[] = []
  const planets = SYSTEM.map((spec) => buildPlanet(spec, textures, bodies))
  const sun = buildSun()
  const stars = buildStars(random, STAR_DISTANCE)
  const belt = buildAsteroidBelt(random)
  const comets = COMETS.map(() => buildComet(random))
  const hole = buildBlackHole()
  const light = new PointLight(0xfff1dc, 3, 0, 0)
  light.position.copy(SUN_POSITION)
  scene.add(sun.group, stars, belt, hole.group, light, new HemisphereLight(0x3a4a7a, 0x101018, 1.2), ...planets.map((p) => p.group), ...comets.map((c) => c.group))
  const holeBody: Body = { key: 'buraco', name: 'Buraco negro', radius: BLACK_HOLE.radius, position: BLACK_HOLE.position, landable: false }
  const sunBody: Body = { key: 'sol', name: 'Sol', radius: SUN_RADIUS, position: SUN_POSITION, landable: false }
  bodies.push(sunBody, holeBody)

  const update = (dt: number, time: number, cameraPosition: Vector3) => {
    sun.material.uniforms.uTime.value = time
    hole.material.uniforms.uTime.value = time
    stars.position.copy(cameraPosition)
    belt.rotation.y = (time / ASTEROID_BELT.period) * Math.PI * 2
    for (const planet of planets) planet.update(dt, time)
    comets.forEach((comet, i) => comet.update(time, COMETS[i]))
  }
  update(0, 0, new Vector3())
  return { scene, bodies, targets: [sunBody, ...bodies.filter((b) => SYSTEM.some((p) => p.key === b.key)), holeBody], update }
}

function toColor(rgb: Rgb): Color {
  return new Color(rgb[0], rgb[1], rgb[2])
}

function shaderPlanetMaterial(look: ShaderLook): ShaderMaterial {
  return new ShaderMaterial({
    ...planetShader,
    uniforms: {
      uSunPos: { value: SUN_POSITION },
      uTime: { value: 0 },
      uLow: { value: toColor(look.low) },
      uMid: { value: toColor(look.mid) },
      uHigh: { value: toColor(look.high) },
      uAtmosphere: { value: toColor(look.atmosphere) },
      uGlow: { value: toColor(look.glow) },
      uClouds: { value: look.clouds },
      uBands: { value: look.bands ? 1 : 0 },
    },
  })
}

function buildAtmosphere(radius: number, color: Rgb, shell: number): Mesh {
  return new Mesh(
    new SphereGeometry(radius * shell, 64, 48),
    new ShaderMaterial({
      ...atmosphereShader,
      uniforms: { uSunPos: { value: SUN_POSITION }, uAtmosphere: { value: toColor(color) } },
      side: BackSide,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  )
}

function buildGlobe(radius: number, look: PlanetSpec['look'], textures: Map<string, Texture>, segments: number) {
  if (look.kind === 'textured') {
    const material = new MeshStandardMaterial({ map: textures.get(look.color), normalMap: textures.get(look.normal), roughness: 1, metalness: 0 })
    return { mesh: new Mesh(new SphereGeometry(radius, segments, segments / 1.5), material), uniforms: null, atmosphere: buildAtmosphere(radius, look.atmosphere, 1.03) }
  }
  const material = shaderPlanetMaterial(look)
  return { mesh: new Mesh(new SphereGeometry(radius, segments, segments / 1.5), material), uniforms: material.uniforms, atmosphere: buildAtmosphere(radius, look.atmosphere, 1.06) }
}

function buildPlanet(spec: PlanetSpec, textures: Map<string, Texture>, bodies: Body[]) {
  const group = new Group()
  const globe = buildGlobe(spec.radius, spec.look, textures, 96)
  group.add(globe.mesh, globe.atmosphere)
  if (spec.rings) group.add(buildRings(spec.rings.inner, spec.rings.outer, spec.rings.color, spec.rings.tilt))
  const body: Body = { key: spec.key, name: spec.name, radius: spec.radius, position: group.position, landable: spec.landable ?? false }
  bodies.push(body)
  const moons = (spec.moons ?? []).map((moon) => buildMoon(moon, textures, bodies))
  for (const moon of moons) group.add(moon.group)
  const spin = 0.02 * (60 / spec.radius)
  return {
    group,
    update(dt: number, time: number) {
      orbitPosition(spec.orbit, time, group.position)
      globe.mesh.rotation.y += spin * dt
      if (globe.uniforms) globe.uniforms.uTime.value = time
      for (const moon of moons) moon.update(dt, time, group.position)
    },
  }
}

function buildMoon(spec: MoonSpec, textures: Map<string, Texture>, bodies: Body[]) {
  const group = new Group()
  const globe = buildGlobe(spec.radius, spec.look, textures, 48)
  group.add(globe.mesh, globe.atmosphere)
  const body: Body = { key: spec.name.toLowerCase(), name: spec.name, radius: spec.radius, position: new Vector3(), landable: false }
  bodies.push(body)
  return {
    group,
    update(dt: number, time: number, planetPosition: Vector3) {
      orbitPosition(spec.orbit, time, group.position)
      body.position.copy(group.position).add(planetPosition)
      globe.mesh.rotation.y += 0.05 * dt
      if (globe.uniforms) globe.uniforms.uTime.value = time
    },
  }
}

function buildRings(inner: number, outer: number, color: Rgb, tilt: number): Mesh {
  const material = new ShaderMaterial({
    uniforms: { uColor: { value: toColor(color) }, uSunPos: { value: SUN_POSITION }, uInner: { value: inner / outer } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorld;
      varying vec3 vNormal;
      void main() {
        vUv = uv;
        vNormal = normalize(mat3(modelMatrix) * normal);
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform vec3 uSunPos;
      uniform float uInner;
      varying vec2 vUv;
      varying vec3 vWorld;
      varying vec3 vNormal;
      ${simplex}
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        float bands = 0.5 + 0.5 * snoise(vec3(r * 26.0, 0.0, 0.0));
        float gaps = smoothstep(0.25, 0.45, 0.5 + 0.5 * snoise(vec3(r * 9.0 + 3.0, 1.0, 0.0)));
        float alpha = smoothstep(uInner, uInner + 0.02, r) * (1.0 - smoothstep(0.97, 1.0, r)) * (0.25 + 0.75 * bands) * gaps;
        vec3 L = normalize(uSunPos - vWorld);
        float light = 0.25 + 0.75 * abs(dot(normalize(vNormal), L));
        gl_FragColor = vec4(uColor * light * (0.6 + 0.4 * bands), alpha);
      }`,
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
  })
  const mesh = new Mesh(new RingGeometry(inner, outer, 160, 1), material)
  mesh.rotation.set(Math.PI / 2 + tilt, 0.2, 0)
  return mesh
}

function buildSun() {
  const material = new ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vObject;
      void main() {
        vObject = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vObject;
      ${simplex}
      void main() {
        vec3 p = normalize(vObject);
        float n = fbm(p * 4.0 + vec3(uTime * 0.03));
        float cells = fbm(p * 9.0 - vec3(uTime * 0.02));
        vec3 color = mix(vec3(5.0, 1.8, 0.4), vec3(8.0, 6.0, 3.0), smoothstep(-0.2, 0.5, n + cells * 0.5));
        gl_FragColor = vec4(color, 1.0);
      }`,
  })
  const group = new Group()
  group.add(new Mesh(new SphereGeometry(SUN_RADIUS, 64, 48), material))
  const corona = new Sprite(new SpriteMaterial({ map: glowTexture('rgba(255,190,110,'), blending: AdditiveBlending, transparent: true, depthWrite: false, color: new Color(1.6, 1.2, 0.8) }))
  corona.scale.setScalar(SUN_RADIUS * 4.2)
  group.add(corona)
  group.position.copy(SUN_POSITION)
  return { group, material }
}

function glowTexture(rgbaPrefix: string): CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, rgbaPrefix + '0.9)')
  gradient.addColorStop(0.25, rgbaPrefix + '0.35)')
  gradient.addColorStop(0.6, rgbaPrefix + '0.08)')
  gradient.addColorStop(1, rgbaPrefix + '0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  return new CanvasTexture(canvas)
}

function buildAsteroidBelt(random: () => number): InstancedMesh {
  const geometry = new IcosahedronGeometry(1, 1)
  const position = geometry.getAttribute('position')
  for (let i = 0; i < position.count; i++) {
    const bump = 0.75 + random() * 0.5
    position.setXYZ(i, position.getX(i) * bump, position.getY(i) * bump, position.getZ(i) * bump)
  }
  geometry.computeVertexNormals()
  const mesh = new InstancedMesh(geometry, new MeshStandardMaterial({ color: 0x7a7570, roughness: 1 }), ASTEROID_BELT.count)
  const dummy = new Object3D()
  for (let i = 0; i < ASTEROID_BELT.count; i++) {
    const radius = ASTEROID_BELT.inner + random() * (ASTEROID_BELT.outer - ASTEROID_BELT.inner)
    const angle = random() * Math.PI * 2
    dummy.position.set(Math.cos(angle) * radius, (random() - 0.5) * ASTEROID_BELT.thickness, Math.sin(angle) * radius)
    dummy.rotation.set(random() * 6, random() * 6, random() * 6)
    dummy.scale.setScalar(2 + random() * random() * 9)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  }
  return mesh
}

function buildComet(random: () => number) {
  const group = new Group()
  const nucleus = new Mesh(new IcosahedronGeometry(6, 1), new MeshBasicMaterial({ color: new Color(2.2, 2.6, 3.2) }))
  const positions = new Float32Array(COMET_TAIL_POINTS * 3)
  const colors = new Float32Array(COMET_TAIL_POINTS * 3)
  for (let i = 0; i < COMET_TAIL_POINTS; i++) {
    const t = random()
    const spread = t * 40
    positions.set([(random() - 0.5) * spread, (random() - 0.5) * spread, t * COMET_TAIL_LENGTH], i * 3)
    const fade = (1 - t) * (0.7 + random() * 0.3)
    colors.set([0.6 * fade, 0.8 * fade, fade], i * 3)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  const tail = new Points(geometry, new PointsMaterial({ size: 5, vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false }))
  group.add(nucleus, tail)
  const away = new Vector3()
  return {
    group,
    update(time: number, orbit: (typeof COMETS)[number]) {
      cometPosition(orbit, time, group.position)
      away.copy(group.position).normalize().add(group.position)
      group.lookAt(away)
      const closeness = Math.min(Math.max(1800 / group.position.length(), 0.3), 2.5)
      group.scale.set(1, 1, closeness)
    },
  }
}

function buildBlackHole() {
  const group = new Group()
  group.position.copy(BLACK_HOLE.position)
  group.add(new Mesh(new SphereGeometry(BLACK_HOLE.radius, 48, 32), new MeshBasicMaterial({ color: 0x000000 })))
  const material = new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uInner: { value: (BLACK_HOLE.radius * 1.15) / BLACK_HOLE.diskOuter } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uInner;
      varying vec2 vUv;
      ${simplex}
      void main() {
        vec2 c = vUv - 0.5;
        float r = length(c) * 2.0;
        float angle = atan(c.y, c.x);
        float swirl = fbm(vec3(angle * 2.0 + r * 10.0 - uTime * 0.6, r * 6.0, uTime * 0.05));
        float heat = pow(clamp(uInner / r, 0.0, 1.0), 2.2);
        float edge = smoothstep(uInner, uInner + 0.03, r) * (1.0 - smoothstep(0.85, 1.0, r));
        vec3 color = mix(vec3(3.0, 0.6, 0.1), vec3(9.0, 7.0, 5.0), heat) * (0.55 + 0.45 * swirl);
        gl_FragColor = vec4(color * edge, edge * (0.5 + 0.5 * heat));
      }`,
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  const disk = new Mesh(new RingGeometry(BLACK_HOLE.radius * 1.15, BLACK_HOLE.diskOuter, 160, 1), material)
  disk.rotation.set(Math.PI / 2 + 1.15, 0, 0.3)
  const halo = new Sprite(new SpriteMaterial({ map: glowTexture('rgba(255,140,60,'), blending: AdditiveBlending, transparent: true, depthWrite: false }))
  halo.scale.setScalar(BLACK_HOLE.diskOuter * 2.4)
  group.add(disk, halo)
  return { group, material }
}
