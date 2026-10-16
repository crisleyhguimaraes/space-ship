import { type AnimationAction, type AnimationClip, AnimationMixer, Box3, Group, Mesh, Object3D, SkinnedMesh, Vector3 } from 'three'
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js'
import { createFlock, stepFlock, type Flock, type FlockShape } from './flock.ts'
import { HERD, createHerd, stepHerd, type Herd, type Threat } from './herd.ts'
import { instanceModel } from './instancing.ts'
import { PREDATOR, createPredator, pickTarget, stepPredator, type Animal, type Predator, type PredatorKind, type Prey } from './predator.ts'
import { SEA_LEVEL, VOLCANO, biomeAt, type Biome } from './biomes.ts'
import type { Layout } from './worlds.ts'
import { sampleHeight, type Heightmap } from './terrain.ts'

export type HerdModel = { scene: Object3D; clips: AnimationClip[] }
export type Cast = {
  herds: { species: HerdSpecies; model: HerdModel }[]
  flocks: { species: FlockSpecies; model: HerdModel }[]
  predators: { species: PredatorSpecies; model: HerdModel }[]
  fly: Object3D | null
}
export type ShipSense = { x: number; y: number; z: number }
export type Sighting = { label: string; distance: number }
export type WildlifeEvents = { hit: boolean; threat: Sighting | null; nearby: Sighting | null }
export type Ground = (x: number, z: number) => number
export type Lake = { x: number; z: number; radius: number; contains(x: number, z: number): boolean }
export type WildlifeOptions = { layout: Layout; volcano: boolean; villages: [number, number][] }
type Land = { h: Heightmap; blocked: Blocked; layout: Layout; volcano: boolean; villages: [number, number][] }

type Blocked = (x: number, z: number) => boolean
export type Habitat = (b: Biome) => number
export type HerdSpecies = { key: string; label: string; url: string; herds: number; size: number; length: number; habitat: Habitat; clips?: ClipPlan; height?: number; orient?: boolean; village?: boolean; soloMesh?: boolean }
export type FlockSpecies = { label: string; url: string; size: number; length: number; shape: FlockShape; home: 'land' | 'lake' | 'ocean'; clips?: ClipPlan; breach?: { height: number; seconds: number; every: number } }
export type PredatorSpecies = { label: string; url: string; kind: PredatorKind; count: number; length: number; prey: string[]; habitat: Habitat; clips?: ClipPlan; height?: number; orient?: boolean }

export const ANYWHERE: Habitat = () => 1
export const FOREST: Habitat = (b) => b.forest + b.meadow * 0.2
export const MEADOW: Habitat = (b) => b.meadow + b.forest * 0.3
export const DESERT: Habitat = (b) => b.desert + b.meadow * 0.15
export const ICE: Habitat = (b) => b.ice + b.meadow * 0.1

export const HERD_SPECIES: HerdSpecies[] = [
  { key: 'creature', label: 'bestas do gelo', url: '/models/creature.glb', herds: 1, size: 3, length: 4.5, height: 2.4, habitat: ANYWHERE, clips: { idle: 'rig|Idle', walk: 'rig|walk', run: 'rig|Run' }, orient: true },
  { key: 'bunny', label: 'coelhos-rato', url: '/models/bunny.glb', herds: 2, size: 6, length: 4, height: 1.3, habitat: MEADOW },
  { key: 'oryx', label: 'antílopes', url: '/models/oryx.glb', herds: 2, size: 6, length: 2.6, habitat: DESERT, clips: { idle: 'Stand_Breathing_01', walk: 'Walk', run: 'Run' }, orient: true },
  { key: 'stag', label: 'alces', url: '/models/stag.glb', herds: 1, size: 4, length: 3.2, habitat: FOREST, clips: { idle: 'Stand_Breathing_01', walk: 'Walk', run: 'Run' }, orient: true },
  { key: 'elephant', label: 'elefantes', url: '/models/elephant.glb', herds: 1, size: 2, length: 7, habitat: MEADOW, clips: { idle: 'idle', walk: 'walk', run: 'run' }, orient: true },
  { key: 'hippo', label: 'hipopótamos', url: '/models/hippo.glb', herds: 1, size: 3, length: 4, habitat: MEADOW, clips: { idle: 'Iddle', walk: 'Walk' }, orient: true },
  { key: 'penguin', label: 'pinguins', url: '/models/penguin.glb', herds: 2, size: 6, length: 2.2, habitat: MEADOW, clips: { idle: 'Iddle', walk: 'Walk' } },
]

export const FLOCK_SPECIES: FlockSpecies[] = [
  { label: 'águias', url: '/models/eagle.glb', size: 3, length: 6, shape: { restAltitude: 70, alarmAltitude: 110, orbitRadius: 60 }, home: 'land', clips: { walk: 'motion4', alwaysMoving: true } },
  { label: 'patos', url: '/models/duck.glb', size: 8, length: 2, shape: { restAltitude: 0.3, alarmAltitude: 28, orbitRadius: 14 }, home: 'lake' },
  { label: 'orcas', url: '/models/orca.glb', size: 4, length: 7, shape: { restAltitude: -1.6, alarmAltitude: -4, orbitRadius: 40 }, home: 'ocean', clips: { walk: 'Take 001', alwaysMoving: true }, breach: { height: 7, seconds: 1.8, every: 11 } },
  { label: 'tubarões', url: '/models/shark.glb', size: 4, length: 4.5, shape: { restAltitude: -1.4, alarmAltitude: -4, orbitRadius: 35 }, home: 'ocean', clips: { walk: 'Action', alwaysMoving: true } },
  { label: 'baleias', url: '/models/whale.glb', size: 5, length: 18, shape: { restAltitude: -3.5, alarmAltitude: -9, orbitRadius: 70 }, home: 'ocean', clips: { walk: 'Take 001', alwaysMoving: true }, breach: { height: 16, seconds: 3.2, every: 17 } },
]

export const PREDATOR_SPECIES: PredatorSpecies[] = [
  { label: 'inseto gigante', url: '/models/insectoid.glb', kind: 'ground', count: 1, length: 14, height: 10, prey: ['creature', 'oryx', 'stag'], habitat: MEADOW },
  { label: 'pterodáctilo', url: '/models/lizard.glb', kind: 'air', count: 1, length: 14, prey: ['bunny', 'penguin'], habitat: ANYWHERE, clips: { idle: 'loopSoaring', walk: 'loopFlying', alwaysMoving: true } },
  { label: 'goblins', url: '/models/ghoul.glb', kind: 'ground', count: 3, length: 3, height: 2.4, prey: ['bunny', 'creature', 'penguin'], habitat: FOREST },
  { label: 'dragão da montanha', url: '/models/dragon.glb', kind: 'air', count: 1, length: 16, prey: ['stag', 'oryx'], habitat: ANYWHERE, clips: { walk: 'Take 001', alwaysMoving: true } },
]

const SCARE_ALTITUDE = 120
const STRIDE_SPEED = 9
const FLOCK_FLY_SPEED = 12
const THREAT_RANGE = 150
const SIGHTING_RANGE = 60
const FEED_SECONDS = 8
const RESPAWN_SECONDS = 45
const FLY_SWARMS = 3
const FLIES_PER_SWARM = 10
const LAIR_MIN_DISTANCE = 450

export function buildWildlife(cast: Cast, h: Heightmap, ground: Ground, lake: Lake, options: WildlifeOptions, random = Math.random) {
  const land: Land = { h, blocked: lake.contains, layout: options.layout, volcano: options.volcano, villages: options.villages }
  const herds = cast.herds.map(({ species, model }) => buildHerdGroup(species, fresh(model), land, random))
  const flocks = cast.flocks.map(({ species, model }) => buildFlockGroup(species, fresh(model), land, lake, random))
  const packs = cast.predators.flatMap(({ species, model }) => buildPack(species, fresh(model), land, random))
  const flies = cast.fly ? buildFlies(cloneSkeleton(cast.fly), lake) : { objects: [] as Object3D[], update() {} }
  const preyOf = new Map(packs.map((pack) => [pack, herds.filter((g) => pack.prey.includes(g.key))]))

  return {
    objects: [...herds.flatMap((g) => g.objects), ...flocks.flatMap((g) => g.objects), ...packs.flatMap((p) => p.objects), ...flies.objects],
    update(dt: number, time: number, ship: ShipSense | null): WildlifeEvents {
      const dangers: { x: number; z: number }[] = packs.filter((p) => p.state.state === 'hunt').map((p) => ({ x: p.state.x, z: p.state.z }))
      if (ship && ship.y < SCARE_ALTITUDE) dangers.push({ x: ship.x, z: ship.z })
      const threatAt = (x: number, z: number): Threat => nearestPoint(dangers, x, z, THREAT_RANGE)

      for (const group of herds) group.update(dt, time, threatAt, ground)
      for (const group of flocks) group.update(dt, time, threatAt(group.anchor()[0], group.anchor()[1]), ground)

      let hit = false
      for (const pack of packs) {
        const groups = preyOf.get(pack) ?? []
        const animals = groups.flatMap((g) => g.animals)
        const target = pickTarget(pack.state, ship, animals)
        pack.afterShip = target?.kind === 'ship'
        const struck = pack.update(dt, time, target, ground)
        if (!struck || !target) continue
        if (target.kind === 'ship') hit = true
        else {
          killAnimal(groups, target.index, time)
          pack.feedUntil = time + FEED_SECONDS
        }
      }
      flies.update(time, ground)

      return { hit, threat: ship ? nearestHunter(packs, ship) : null, nearby: ship ? nearestSighting(herds, packs, ship) : null }
    },
  }
}

function nearestPoint(points: { x: number; z: number }[], x: number, z: number, range: number): Threat {
  let best: Threat = null
  let bestDistance = range
  for (const point of points) {
    const distance = Math.hypot(point.x - x, point.z - z)
    if (distance < bestDistance) {
      bestDistance = distance
      best = point
    }
  }
  return best
}

function killAnimal(groups: HerdGroup[], index: number, time: number) {
  let offset = index
  for (const group of groups) {
    if (offset < group.animals.length) return group.kill(offset, time)
    offset -= group.animals.length
  }
}

function nearestHunter(packs: Pack[], ship: ShipSense): Sighting | null {
  let best: Sighting | null = null
  for (const pack of packs) {
    if (pack.state.state !== 'hunt' || !pack.afterShip) continue
    const distance = Math.hypot(pack.state.x - ship.x, pack.state.z - ship.z)
    if (!best || distance < best.distance) best = { label: pack.label, distance }
  }
  return best
}

function nearestSighting(herds: HerdGroup[], packs: Pack[], ship: ShipSense): Sighting | null {
  let best: Sighting | null = null
  const consider = (label: string, x: number, z: number) => {
    const distance = Math.hypot(x - ship.x, z - ship.z)
    if (distance < SIGHTING_RANGE && (!best || distance < best.distance)) best = { label, distance }
  }
  for (const group of herds) for (const animal of group.animals) if (animal.alive) consider(group.label, animal.x, animal.z)
  for (const pack of packs) consider(pack.label, pack.state.x, pack.state.z)
  return best
}

// each world gets its own copy, because scaling and placing mutate the scene graph
function fresh(model: HerdModel): HerdModel {
  return { scene: cloneSkeleton(model.scene), clips: model.clips }
}

// scales a model so its longest horizontal side is `length`, centred on x/z with its feet on y = 0.
// Rigged files often carry unit scales inside the clip, so the box is taken with the animation applied
function groundModel(root: Object3D, length: number, pose?: AnimationClip, height?: number, orient = false): Group {
  if (pose) {
    const mixer = new AnimationMixer(root)
    mixer.clipAction(pose).play()
    mixer.update(pose.duration * 0.25)
  }
  root.updateMatrixWorld(true)
  if (orient) root.rotation.y += headingCorrection(root)
  root.updateMatrixWorld(true)
  const box = new Box3().setFromObject(root, true)
  const size = box.getSize(new Vector3())
  const scale = height ? height / size.y : length / Math.max(size.x, size.z)
  const center = box.getCenter(new Vector3())
  const pivot = new Group()
  pivot.add(root)
  root.scale.multiplyScalar(scale)
  root.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)
  return pivot
}

const ORIENT_SAMPLES = 400

// the game moves animals toward +Z; files disagree, so the body's long axis is found and turned to face it.
// The head is the end of that axis that sits higher, which holds for quadrupeds (tail and haunches hang lower)
function headingCorrection(root: Object3D): number {
  const points: Vector3[] = []
  root.traverse((object) => {
    if (!(object instanceof Mesh) || !object.visible) return
    const count = object.geometry.getAttribute('position').count
    const step = Math.max(1, Math.floor(count / ORIENT_SAMPLES))
    for (let i = 0; i < count; i += step) {
      const v = new Vector3()
      if (object instanceof SkinnedMesh) object.getVertexPosition(i, v)
      else v.fromBufferAttribute(object.geometry.getAttribute('position'), i)
      points.push(v.applyMatrix4(object.matrixWorld))
    }
  })
  if (points.length === 0) return 0
  const box = new Box3().setFromPoints(points)
  const size = box.getSize(new Vector3())
  const center = box.getCenter(new Vector3())
  const alongX = size.x > size.z
  const axis = (v: Vector3) => (alongX ? v.x - center.x : v.z - center.z)
  const reach = (alongX ? size.x : size.z) * 0.25
  let highPos = 0
  let nPos = 0
  let highNeg = 0
  let nNeg = 0
  for (const v of points) {
    const a = axis(v)
    if (a > reach) {
      highPos += v.y
      nPos++
    } else if (a < -reach) {
      highNeg += v.y
      nNeg++
    }
  }
  const headPositive = nPos === 0 || nNeg === 0 || highPos / nPos >= highNeg / nNeg
  if (alongX) return headPositive ? -Math.PI / 2 : Math.PI / 2
  return headPositive ? 0 : Math.PI
}

// scans often ship two overlapping copies of the subject; only the densest one is rendered
function keepLargestMesh(root: Object3D) {
  const meshes: Mesh[] = []
  root.traverse((object) => object instanceof Mesh && meshes.push(object))
  const largest = meshes.reduce((a, b) => (b.geometry.getAttribute('position').count > a.geometry.getAttribute('position').count ? b : a))
  for (const mesh of meshes) mesh.visible = mesh === largest
}

function anchorFor(species: HerdSpecies, group: number, land: Land, random: () => number): [number, number] {
  if (species.village && land.villages.length > 0) {
    const centre = land.villages[group % land.villages.length]
    return [centre[0] + (random() - 0.5) * 20, centre[1] + (random() - 0.5) * 20]
  }
  return spotOnLand(land, random, 0.45, species.habitat)
}

function spotOnLand(land: Land, random: () => number, maxSlope: number, habitat: Habitat = ANYWHERE, minDistanceFromSpawn = 0): [number, number] {
  const { h, blocked, layout, volcano } = land
  for (let tries = 0; tries < 5000; tries++) {
    const x = (random() * 2 - 1) * 700
    const z = (random() * 2 - 1) * 700
    const y = sampleHeight(h, x, z)
    const slope = Math.hypot(sampleHeight(h, x + 4, z) - sampleHeight(h, x - 4, z), sampleHeight(h, x, z + 4) - sampleHeight(h, x, z - 4)) / 8
    const biome = biomeAt(x, z, layout)
    if (y < 8 || y > 80 || slope >= maxSlope || blocked(x, z) || biome.ocean > 0.2) continue
    if (Math.hypot(x, z - 650) < minDistanceFromSpawn || (volcano && Math.hypot(x - VOLCANO.x, z - VOLCANO.z) < VOLCANO.radius)) continue
    if (random() < habitat(biome)) return [x, z]
  }
  return [0, 0]
}

type Pose = { x: number; y: number; z: number; pitch: number; yaw: number; roll: number; hidden?: boolean }
type Renderer = { objects: Object3D[]; place(index: number, pose: Pose, speed: number, dt: number): void; commit(): void }

const dummy = new Object3D()

function instancedRenderer(scene: Object3D, length: number, count: number, height?: number, orient = false): Renderer {
  const model = instanceModel(groundModel(scene, length, undefined, height, orient), count)
  model.parts.forEach((part) => (part.frustumCulled = false))
  return {
    objects: model.parts,
    place(index, pose) {
      dummy.position.set(pose.x, pose.y, pose.z)
      dummy.rotation.order = 'YXZ'
      dummy.rotation.set(pose.pitch, pose.yaw, pose.roll)
      dummy.scale.setScalar(pose.hidden ? 0 : 1)
      dummy.updateMatrix()
      model.setMatrixAt(index, dummy.matrix)
    },
    commit: () => model.parts.forEach((part) => (part.instanceMatrix.needsUpdate = true)),
  }
}

// rigged models get one clone per animal so the file's own walk and idle clips can play
export type ClipPlan = { idle?: string; walk?: string; run?: string; alwaysMoving?: boolean }

const MOVE_WORDS = ['run', 'walk', 'trot', 'prowl', 'fly', 'flap', 'glide', 'swim', 'gallop']
const IDLE_WORDS = ['idle', 'iddle', 'stand', 'breath', 'rest', 'hover']
const WALK_SPEED = 4
const RUN_SPEED = 20
const MIN_FLAP_SCALE = 0.7

function byName(model: HerdModel, name?: string): AnimationClip | undefined {
  if (!name) return undefined
  const bare = (n: string) => n.toLowerCase().replace(/^.*\|/, '')
  return model.clips.find((clip) => bare(clip.name) === bare(name))
}

function byWords(model: HerdModel, words: string[]): AnimationClip | undefined {
  return model.clips.find((clip) => words.some((w) => clip.name.toLowerCase().includes(w)))
}

// an explicit plan names the clips to play; without one, only a recognizable idle or locomotion name earns a rig,
// because a lone "TakeDamage" looping on a walking animal is worse than no rig at all
function resolveClips(model: HerdModel, plan?: ClipPlan) {
  const walk = byName(model, plan?.walk) ?? (plan ? undefined : byWords(model, MOVE_WORDS))
  const run = byName(model, plan?.run)
  const idle = byName(model, plan?.idle) ?? (plan ? undefined : byWords(model, IDLE_WORDS))
  return { idle, walk, run }
}

function canAnimate(model: HerdModel, plan?: ClipPlan): boolean {
  const { idle, walk, run } = resolveClips(model, plan)
  return hasSkinnedMesh(model.scene) && (idle !== undefined || walk !== undefined || run !== undefined)
}

function skinnedRenderer(model: HerdModel, length: number, count: number, plan?: ClipPlan, height?: number, orient = false): Renderer {
  const clips = resolveClips(model, plan)
  const loco = clips.walk ?? clips.run ?? clips.idle!
  const template = groundModel(model.scene, length, loco, height, orient)
  const animals = Array.from({ length: count }, () => {
    const object = cloneSkeleton(template)
    const mixer = new AnimationMixer(object)
    const play = (clip?: AnimationClip) => (clip ? mixer.clipAction(clip).play() : null)
    const idle = clips.idle ? play(clips.idle) : null
    const walk = clips.walk ? play(clips.walk) : null
    const run = clips.run ? play(clips.run) : null
    if (!walk && !run) play(loco)
    return { object, mixer, idle, walk, run }
  })
  const single = !clips.idle && !(clips.walk && clips.run)
  return {
    objects: animals.map((a) => a.object),
    place(index, pose, speed, dt) {
      const { object, mixer, idle, walk, run } = animals[index]
      object.visible = !pose.hidden
      object.position.set(pose.x, pose.y, pose.z)
      object.rotation.order = 'YXZ'
      object.rotation.set(pose.pitch, pose.yaw, pose.roll)
      if (single) {
        mixer.timeScale = Math.max(plan?.alwaysMoving ? MIN_FLAP_SCALE : 0.05, speed / WALK_SPEED)
      } else {
        const idleW = idle ? clamp01(1 - speed / 2.5) : 0
        const runW = run ? clamp01((speed - 8) / 10) : 0
        const walkW = walk ? Math.max(0, 1 - idleW - runW) : 0
        if (idle) setWeight(idle, walk || run ? idleW : 1)
        if (walk) {
          setWeight(walk, run ? walkW : 1 - idleW)
          walk.timeScale = Math.min(Math.max(speed / WALK_SPEED, 0.6), 1.6)
        }
        if (run) {
          setWeight(run, run && !walk ? 1 - idleW : runW)
          run.timeScale = Math.min(Math.max(speed / RUN_SPEED, 0.7), 1.5)
        }
      }
      mixer.update(dt)
    },
    commit: () => {},
  }
}

function clamp01(v: number): number {
  return Math.min(Math.max(v, 0), 1)
}

function setWeight(action: AnimationAction, weight: number) {
  action.enabled = true
  action.setEffectiveWeight(weight)
}

function hasSkinnedMesh(root: Object3D): boolean {
  let found = false
  root.traverse((object) => object instanceof SkinnedMesh && (found = true))
  return found
}

type HerdGroup = {
  key: string
  label: string
  objects: Object3D[]
  animals: Animal[]
  kill(index: number, time: number): void
  update(dt: number, time: number, threatAt: (x: number, z: number) => Threat, ground: Ground): void
}

function buildHerdGroup(species: HerdSpecies, model: HerdModel, land: Land, random: () => number): HerdGroup {
  if (species.soloMesh) keepLargestMesh(model.scene)
  const herds = Array.from({ length: species.herds }, (_, g) => createHerd(species.size, anchorFor(species, g, land, random), random))
  const total = species.herds * species.size
  const render = canAnimate(model, species.clips) ? skinnedRenderer(model, species.length, total, species.clips, species.height, species.orient) : instancedRenderer(model.scene, species.length, total, species.height, species.orient)
  const animals: Animal[] = Array.from({ length: total }, () => ({ x: 0, z: 0, alive: true }))
  const respawnAt = new Float32Array(total)

  return {
    key: species.key,
    label: species.label,
    objects: render.objects,
    animals,
    kill(index, time) {
      animals[index].alive = false
      respawnAt[index] = time + RESPAWN_SECONDS
    },
    update(dt, time, threatAt, ground) {
      let index = 0
      for (const herd of herds) {
        const frozen = herd.pos.slice()
        stepHerd(herd, dt, threatAt(herd.anchor[0], herd.anchor[1]), random)
        for (let i = 0; i < herd.count; i++, index++) {
          const animal = animals[index]
          if (!animal.alive) {
            if (time >= respawnAt[index]) {
              animal.alive = true
              herd.pos[i * 2] = herd.anchor[0] + (random() - 0.5) * HERD.spread
              herd.pos[i * 2 + 1] = herd.anchor[1] + (random() - 0.5) * HERD.spread
              herd.speed[i] = 0
            } else {
              herd.pos[i * 2] = frozen[i * 2]
              herd.pos[i * 2 + 1] = frozen[i * 2 + 1]
            }
          }
          const x = herd.pos[i * 2]
          const z = herd.pos[i * 2 + 1]
          animal.x = x
          animal.z = z
          const stride = Math.min(herd.speed[i] / HERD.grazeSpeed, 3)
          const phase = time * (3 + herd.speed[i] * 0.5) + index * 1.7
          render.place(index, { x, y: ground(x, z) + Math.abs(Math.sin(phase)) * 0.3 * stride, z, pitch: Math.sin(phase * 2) * 0.05 * stride, yaw: Math.PI / 2 - herd.heading[i], roll: 0, hidden: !animal.alive }, herd.speed[i], dt)
        }
      }
      render.commit()
    },
  }
}

// each animal leaps on its own schedule: a parabolic arc with the nose rising on the way up and diving on the way down
function breachArc(breach: NonNullable<FlockSpecies['breach']>, time: number, index: number) {
  const period = breach.every + (index % 3) * 2.3
  const t = (time + index * 5.3) % period
  if (t >= breach.seconds) return { lift: 0, pitch: 0 }
  const u = t / breach.seconds
  return { lift: Math.sin(Math.PI * u) * breach.height, pitch: -Math.cos(Math.PI * u) * 0.7 }
}

function flockHome(species: FlockSpecies, land: Land, lake: Lake, random: () => number): [number, number] {
  if (species.home === 'lake') return [lake.x + lake.radius * 0.3, lake.z]
  if (species.home === 'land') return spotOnLand(land, random, 0.9)
  for (let tries = 0; tries < 3000; tries++) {
    const x = (random() * 2 - 1) * 800
    const z = (random() * 2 - 1) * 800
    if (biomeAt(x, z, land.layout).ocean > 0.9 && sampleHeight(land.h, x, z) < SEA_LEVEL - 6) return [x, z]
  }
  return [0, -800]
}

function buildFlockGroup(species: FlockSpecies, model: HerdModel, land: Land, lake: Lake, random: () => number) {
  const home = flockHome(species, land, lake, random)
  const flock: Flock = createFlock(species.size, home, species.shape, random)
  const render = canAnimate(model, species.clips) ? skinnedRenderer(model, species.length, species.size, species.clips) : instancedRenderer(model.scene, species.length, species.size)
  return {
    objects: render.objects,
    anchor: () => flock.anchor,
    update(dt: number, time: number, threat: Threat, ground: Ground) {
      stepFlock(flock, dt, threat)
      const base = ground(flock.anchor[0], flock.anchor[1]) + flock.altitude
      const airborne = flock.altitude > species.shape.restAltitude + 2 ? 1 : 0
      for (let i = 0; i < flock.count; i++) {
        const x = flock.pos[i * 2]
        const z = flock.pos[i * 2 + 1]
        const bob = Math.sin(time * 2.5 + i) * 0.6 * airborne
        const stoop = species.home === 'land' ? Math.pow(Math.max(0, Math.sin(time * 0.3 + i * 2.1)), 12) * 45 : 0
        const leap = species.breach ? breachArc(species.breach, time, i) : { lift: 0, pitch: 0 }
        render.place(i, { x, y: base + bob - stoop + leap.lift, z, pitch: Math.sin(time * 2.5 + i) * 0.06 * airborne - stoop * 0.012 + leap.pitch, yaw: Math.PI / 2 - flock.heading[i], roll: -0.35 * airborne }, airborne || species.home === 'ocean' ? FLOCK_FLY_SPEED : 0, dt)
      }
      render.commit()
    },
  }
}

type Pack = { label: string; prey: string[]; objects: Object3D[]; state: Predator; feedUntil: number; afterShip: boolean; update(dt: number, time: number, target: Prey, ground: Ground): boolean }

// one lair per species; pack members share it and spread out on their own
function buildPack(species: PredatorSpecies, model: HerdModel, land: Land, random: () => number): Pack[] {
  const lair = spotOnLand(land, random, species.kind === 'air' ? 2 : 0.5, species.habitat, LAIR_MIN_DISTANCE)
  const render = canAnimate(model, species.clips) ? skinnedRenderer(model, species.length, species.count, species.clips, species.height, species.orient) : instancedRenderer(model.scene, species.length, species.count, species.height, species.orient)
  const lastHeading: number[] = []
  return Array.from({ length: species.count }, (_, i) => {
    const state = createPredator(species.kind, lair)
    state.x += (i - (species.count - 1) / 2) * species.length * 1.5
    lastHeading[i] = state.heading
    const pack: Pack = {
      label: species.label,
      prey: species.prey,
      objects: i === 0 ? render.objects : [],
      state,
      feedUntil: 0,
      afterShip: false,
      update(dt, time, target, ground) {
        const feeding = time < pack.feedUntil
        if (feeding) state.speed = 0
        const struck = feeding ? null : stepPredator(state, dt, target, random)
        const turn = dt > 0 ? (state.heading - lastHeading[i]) / dt : 0
        lastHeading[i] = state.heading
        const airborne = species.kind === 'air' ? 1 : 0
        render.place(i, {
          x: state.x,
          y: ground(state.x, state.z) + state.y + Math.sin(time * 2.2 + i) * 1.2 * airborne,
          z: state.z,
          pitch: Math.sin(time * 2.2 + i) * 0.08 * airborne,
          yaw: Math.PI / 2 - state.heading,
          roll: Math.min(Math.max(turn * 0.4, -0.7), 0.7) * airborne,
        }, state.speed, dt)
        if (i === species.count - 1) render.commit()
        return struck === 'hit'
      },
    }
    return pack
  })
}

function buildFlies(model: Object3D, lake: Lake) {
  const count = FLY_SWARMS * FLIES_PER_SWARM
  const render = instancedRenderer(model, 1.2, count)
  const anchors = Array.from({ length: FLY_SWARMS }, (_, s) => {
    const angle = (s / FLY_SWARMS) * Math.PI * 2 + 0.7
    return { x: lake.x + Math.cos(angle) * lake.radius * 1.05, z: lake.z + Math.sin(angle) * lake.radius * 1.05 }
  })
  return {
    objects: render.objects,
    update(time: number, ground: Ground) {
      for (let i = 0; i < count; i++) {
        const anchor = anchors[Math.floor(i / FLIES_PER_SWARM)]
        const phase = i * 2.39996
        const radius = 4 + (i % 5) * 1.5
        const angle = time * 0.9 + phase
        render.place(i, { x: anchor.x + Math.cos(angle) * radius, y: ground(anchor.x, anchor.z) + 3 + Math.sin(time * 3.1 + phase) * 1.2, z: anchor.z + Math.sin(angle) * radius, pitch: 0, yaw: -angle, roll: 0 }, 0, 0)
      }
      render.commit()
    },
  }
}
