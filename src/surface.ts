import {
  type AnimationClip,
  AnimationMixer,
  Box3,
  DataTexture,
  LinearFilter,
  MirroredRepeatWrapping,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  type WebGLProgramParametersWithUniforms,
  Color,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Scene,
  Vector3,
} from 'three'
import { instanceModel, type InstancedModel } from './instancing.ts'
import { buildAtmosphere } from './atmosphere.ts'
import { SEA_LEVEL, VOLCANO, biomeAt, type Biome } from './biomes.ts'
import { lowestBasin, sampleHeight, type Heightmap } from './terrain.ts'
import { buildVolcano } from './volcano.ts'
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js'
import { buildVillages } from './villages.ts'
import { buildWildlife, type Cast, type ShipSense } from './wildlife.ts'
import type { WorldProfile } from './worlds.ts'
import { asset } from './asset.ts'

export const SURFACE = { ceiling: 150, hoverGap: 4, edge: 950, spawn: new Vector3(0, 110, 650) }

type Placement = { minHeight: number; maxHeight: number; maxSlope: number; scale: [number, number]; sink: number }
type Density = Partial<Record<'forest' | 'meadow' | 'desert' | 'ice', number>>
type Flora = { url: string; count: number; rule: Placement; biomes: Density; volcanoOk?: boolean }

export const FLORA: Flora[] = [
  { url: '/models/pine.glb', count: 500, rule: { minHeight: 14, maxHeight: 85, maxSlope: 0.7, scale: [0.6, 1.0], sink: 0.4 }, biomes: { forest: 1, meadow: 0.35, ice: 0.4 } },
  { url: '/models/tree-night.glb', count: 1500, rule: { minHeight: 14, maxHeight: 88, maxSlope: 0.8, scale: [5, 8], sink: 0.3 }, biomes: { forest: 1, meadow: 0.3 } },
  { url: '/models/tree-night2.glb', count: 700, rule: { minHeight: 12, maxHeight: 92, maxSlope: 1.0, scale: [4, 6], sink: 0.2 }, biomes: { forest: 0.8, meadow: 0.6, desert: 0.15 } },
  { url: '/models/tree-fir.glb', count: 1200, rule: { minHeight: 20, maxHeight: 95, maxSlope: 0.9, scale: [1.6, 2.4], sink: 0.3 }, biomes: { forest: 1, meadow: 0.4, ice: 0.7 } },
  { url: '/models/bush.glb', count: 1200, rule: { minHeight: 12, maxHeight: 95, maxSlope: 1.0, scale: [1.2, 2.2], sink: 0.4 }, biomes: { forest: 0.7, meadow: 0.7, desert: 0.25 } },
  { url: '/models/rocks.glb', count: 300, rule: { minHeight: 12, maxHeight: 180, maxSlope: 1.4, scale: [0.8, 2.6], sink: 0.5 }, biomes: { forest: 0.4, meadow: 0.6, desert: 1, ice: 0.5 }, volcanoOk: true },
]

export type GroundTextures = { dirt: Texture; moss: Texture; rock: Texture; snow: Texture }
export type SurfaceModels = { wildlife: Cast; flora: Object3D[]; ocean: { scene: Object3D; clip: AnimationClip }; ground: GroundTextures }

export async function loadGroundTextures(): Promise<GroundTextures> {
  const loader = new TextureLoader()
  const load = async (name: string) => {
    const texture = await loader.loadAsync(asset(`/textures/ground-${name}.webp`))
    texture.colorSpace = SRGBColorSpace
    texture.wrapS = texture.wrapT = MirroredRepeatWrapping
    texture.anisotropy = 8
    return texture
  }
  const [dirt, moss, rock, snow] = await Promise.all([load('dirt'), load('moss'), load('rock'), load('snow')])
  return { dirt, moss, rock, snow }
}

const LAKE_SIZE = 260
const LAKE_GLOW = new Color(0.1, 0.55, 0.8)
const LAKE_DEPTH_ABOVE_BASIN = 3

export function buildSurface(heightmap: Heightmap, models: SurfaceModels, profile: WorldProfile, random = Math.random) {
  const scene = new Scene()
  const layout = profile.layout
  const atmosphere = buildAtmosphere(profile.startDay, profile.sky, random)
  scene.background = atmosphere.background
  scene.fog = atmosphere.fog
  scene.add(...atmosphere.objects)
  const lake = profile.lake ? buildLake(models.ocean, heightmap, layout, profile.volcano) : shoreline(heightmap, layout, random)
  const villages = buildVillages(heightmap, layout, profile.villages ?? 0, random)
  const blocked = (x: number, z: number) => lake.contains(x, z) || villages.contains(x, z)
  scene.add(buildTerrain(heightmap, models.ground, profile))
  for (const object of villages.objects) scene.add(object)
  if (lake.object) scene.add(lake.object)
  const sea = profile.sea ? buildSea(models.ocean.scene) : null
  if (sea) scene.add(sea.mesh)
  FLORA.forEach((flora, i) => {
    const weight = profile.flora[floraName(flora.url)] ?? 0
    if (weight <= 0) return
    const model = instanceModel(models.flora[i].clone(), flora.count)
    for (const part of scatter(model, flora, weight, heightmap, random, blocked, layout, profile.volcano)) scene.add(part)
  })

  const floor = profile.sea ? SEA_LEVEL : -Infinity
  const ground = (x: number, z: number) => Math.max(sampleHeight(heightmap, x, z), floor, lake.contains(x, z) ? lake.level : -Infinity)
  const volcano = profile.volcano ? buildVolcano(ground) : null
  if (volcano) scene.add(...volcano.objects)
  const wildlife = buildWildlife(models.wildlife, heightmap, ground, lake, { layout, volcano: profile.volcano, villages: villages.centres }, random)
  for (const object of wildlife.objects) scene.add(object)

  return {
    scene,
    ground,
    update(dt: number, time: number, ship: ShipSense | null, cameraPosition: Vector3) {
      const air = atmosphere.update(dt, cameraPosition)
      lake.mixer?.update(dt)
      if (sea) sea.material.uniforms.uTime.value = time
      volcano?.update(dt, time, air.wind)
      return { ...wildlife.update(dt, time, ship), flash: air.flash }
    },
  }
}

function buildTerrain(h: Heightmap, ground: GroundTextures, profile: WorldProfile) {
  const geometry = new PlaneGeometry(h.worldSize, h.worldSize, h.size - 1, h.size - 1)
  geometry.rotateX(-Math.PI / 2)
  const position = geometry.getAttribute('position')
  for (let i = 0; i < position.count; i++) position.setY(i, h.data[i])
  geometry.computeVertexNormals()
  const material = new MeshStandardMaterial({ roughness: 0.95, metalness: 0 })
  const biomeMap = buildBiomeMap(h.worldSize, profile.layout)
  material.onBeforeCompile = (shader) => splatGround(shader, ground, biomeMap, profile)
  return new Mesh(geometry, material)
}

// four tiled albedos blended by height and slope, each sampled at two scales to hide repetition
function splatGround(shader: WebGLProgramParametersWithUniforms, ground: GroundTextures, biomeMap: DataTexture, profile: WorldProfile) {
  Object.assign(shader.uniforms, {
    biomeMap: { value: biomeMap },
    uVolcano: { value: new Vector3(VOLCANO.x, VOLCANO.z, profile.volcano ? VOLCANO.radius : 0.001) },
    uTint: { value: new Color(...profile.ground.tint) },
    uSnowLine: { value: profile.ground.snowLine },
    dirtMap: { value: ground.dirt },
    mossMap: { value: ground.moss },
    rockMap: { value: ground.rock },
    snowMap: { value: ground.snow },
  })
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vGroundPos;\nvarying float vGroundUp;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGroundPos = position;\nvGroundUp = normal.y;')
  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      /* glsl */ `#include <common>
      varying vec3 vGroundPos;
      varying float vGroundUp;
      uniform sampler2D dirtMap;
      uniform sampler2D mossMap;
      uniform sampler2D rockMap;
      uniform sampler2D snowMap;
      uniform sampler2D biomeMap;
      uniform vec3 uVolcano;
      uniform vec3 uTint;
      uniform float uSnowLine;
      vec3 groundTile(sampler2D map, vec2 uv, float scale) {
        return mix(texture2D(map, uv / scale).rgb, texture2D(map, uv / (scale * 3.7) + 0.37).rgb, 0.4);
      }`,
    )
    .replace(
      '#include <map_fragment>',
      /* glsl */ `
      vec2 guv = vGroundPos.xz;
      float groundHeight = vGroundPos.y;
      float slope = 1.0 - vGroundUp;
      vec4 bio = texture2D(biomeMap, (guv + 1000.0) / 2000.0);
      float volcano = 1.0 - smoothstep(uVolcano.z * 0.5, uVolcano.z * 1.1, distance(guv, uVolcano.xy));
      vec3 rockTex = groundTile(rockMap, guv, 16.0);
      vec3 ground = mix(groundTile(dirtMap, guv, 22.0), groundTile(mossMap, guv, 30.0), smoothstep(9.0, 20.0, groundHeight));
      ground = mix(ground, ground * vec3(0.72, 0.86, 0.66), bio.g * 0.6);
      vec3 sand = vec3(0.80, 0.70, 0.52) * (0.7 + 0.6 * dot(rockTex, vec3(0.333)));
      ground = mix(ground, sand, clamp(bio.r + bio.b, 0.0, 1.0));
      float snowy = max(smoothstep(uSnowLine, uSnowLine + 18.0, groundHeight), bio.a);
      ground = mix(ground, groundTile(snowMap, guv, 24.0), snowy * (1.0 - volcano) * (1.0 - bio.r));
      ground = mix(ground, rockTex, smoothstep(0.3, 0.55, slope));
      ground = mix(ground, vec3(0.16, 0.13, 0.12) * (0.6 + 0.8 * dot(rockTex, vec3(0.333))), volcano * 0.85);
      diffuseColor.rgb *= ground * uTint;`,
    )
}

function scatter(model: InstancedModel, flora: Flora, weight: number, h: Heightmap, random: () => number, blocked: (x: number, z: number) => boolean, layout: WorldProfile['layout'], volcano: boolean) {
  const { count, rule } = flora
  const dummy = new Object3D()
  let placed = 0
  while (placed < count) {
    const x = (random() * 2 - 1) * SURFACE.edge
    const z = (random() * 2 - 1) * SURFACE.edge
    const y = sampleHeight(h, x, z)
    if (y < rule.minHeight || y > rule.maxHeight || slopeAt(h, x, z) > rule.maxSlope || blocked(x, z)) continue
    const biome = biomeAt(x, z, layout)
    if (biome.ocean > 0.4 || random() >= density(flora.biomes, biome) * weight) continue
    if (volcano && !flora.volcanoOk && Math.hypot(x - VOLCANO.x, z - VOLCANO.z) < VOLCANO.radius * 0.95) continue
    dummy.position.set(x, y - rule.sink, z)
    dummy.rotation.y = random() * Math.PI * 2
    dummy.scale.setScalar(rule.scale[0] + random() * (rule.scale[1] - rule.scale[0]))
    dummy.updateMatrix()
    model.setMatrixAt(placed, dummy.matrix)
    placed++
  }
  return model.parts
}

function density(weights: Density, biome: Biome): number {
  return (weights.forest ?? 0) * biome.forest + (weights.meadow ?? 0) * biome.meadow + (weights.desert ?? 0) * biome.desert + (weights.ice ?? 0) * biome.ice
}

function floraName(url: string): string {
  return url.replace('/models/', '').replace('.glb', '')
}

function buildBiomeMap(worldSize: number, layout: WorldProfile['layout']): DataTexture {
  const size = 128
  const data = new Uint8Array(size * size * 4)
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const b = biomeAt((i / (size - 1) - 0.5) * worldSize, (j / (size - 1) - 0.5) * worldSize, layout)
      data.set([b.desert * 255, b.forest * 255, b.ocean * 255, b.ice * 255], (j * size + i) * 4)
    }
  }
  const texture = new DataTexture(data, size, size, RGBAFormat)
  texture.magFilter = texture.minFilter = LinearFilter
  texture.needsUpdate = true
  return texture
}

// the whole map at sea level: visible wherever the shaped terrain dips below it
function buildSea(ocean: Object3D) {
  let map: Texture | null = null
  ocean.traverse((child) => {
    if (child instanceof Mesh && child.material instanceof MeshStandardMaterial && child.material.map) map = child.material.map
  })
  if (map) (map as Texture).wrapS = (map as Texture).wrapT = RepeatWrapping
  const material = new MeshStandardMaterial({ map, color: 0x5f8ea8, roughness: 0.5, metalness: 0.05, emissive: LAKE_GLOW, emissiveIntensity: 0.2 })
  const uniforms = { uTime: { value: 0 } }
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.y += sin(transformed.x * 0.03 + uTime * 0.9) * 0.6 + sin(transformed.z * 0.04 + uTime * 0.7) * 0.5;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <map_fragment>', 'diffuseColor *= texture2D(map, vMapUv * 14.0 + vec2(uTime * 0.012, uTime * 0.008));')
  }
  const mesh = new Mesh(new PlaneGeometry(2200, 2200, 64, 64).rotateX(-Math.PI / 2), material)
  mesh.position.y = SEA_LEVEL
  return { mesh, material: { uniforms } }
}

function slopeAt(h: Heightmap, x: number, z: number) {
  const step = 4
  const dx = sampleHeight(h, x + step, z) - sampleHeight(h, x - step, z)
  const dz = sampleHeight(h, x, z + step) - sampleHeight(h, x, z - step)
  return Math.hypot(dx, dz) / (2 * step)
}

type Shore = { object: Object3D | null; mixer: AnimationMixer | null; level: number; x: number; z: number; radius: number; contains(x: number, z: number): boolean }

// worlds without a lake still need a watering spot for ducks and flies
function shoreline(h: Heightmap, layout: WorldProfile['layout'], random: () => number): Shore {
  for (let tries = 0; tries < 400; tries++) {
    const x = (random() * 2 - 1) * 800
    const z = (random() * 2 - 1) * 800
    const ocean = biomeAt(x, z, layout).ocean
    if (ocean > 0.35 && ocean < 0.65 && sampleHeight(h, x, z) < SEA_LEVEL + 4) return { object: null, mixer: null, level: SEA_LEVEL, x, z, radius: 60, contains: () => false }
  }
  return { object: null, mixer: null, level: SEA_LEVEL, x: 300, z: 300, radius: 60, contains: () => false }
}

function buildLake(ocean: SurfaceModels['ocean'], h: Heightmap, layout: WorldProfile['layout'], volcano: boolean): Shore {
  const basin = lowestBasin(h, LAKE_SIZE, (x, z) => biomeAt(x, z, layout).ocean < 0.05 && (!volcano || Math.hypot(x - VOLCANO.x, z - VOLCANO.z) > VOLCANO.radius + 120))
  const object = cloneSkeleton(ocean.scene)
  const mixer = new AnimationMixer(object)
  mixer.clipAction(ocean.clip).play()
  const box = animatedBounds(object, mixer, ocean.clip.duration)
  const size = box.getSize(new Vector3())
  const scale = LAKE_SIZE / Math.max(size.x, size.z)
  object.scale.multiplyScalar(scale)
  const level = basin.level + LAKE_DEPTH_ABOVE_BASIN
  object.position.set(basin.x, level - box.getCenter(new Vector3()).y * scale, basin.z)
  object.traverse((child) => {
    if (child instanceof Mesh && child.material instanceof MeshStandardMaterial) {
      child.material.metalness = 0.1
      child.material.roughness = 0.35
      child.material.emissive.copy(LAKE_GLOW)
      child.material.emissiveIntensity = 0.7
    }
  })
  const radius = LAKE_SIZE / 2
  return {
    object,
    mixer,
    level,
    x: basin.x,
    z: basin.z,
    radius,
    contains: (x: number, z: number) => (x - basin.x) ** 2 + (z - basin.z) ** 2 < radius * radius,
  }
}

// skinned waves change size over the clip, so one frame under-measures the lake
function animatedBounds(object: Object3D, mixer: AnimationMixer, duration: number): Box3 {
  const box = new Box3()
  const steps = 8
  for (let i = 0; i < steps; i++) {
    mixer.setTime((i / steps) * duration)
    object.updateMatrixWorld(true)
    box.union(new Box3().setFromObject(object, true))
  }
  mixer.setTime(0)
  return box
}
