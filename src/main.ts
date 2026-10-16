import { BloomEffect, EffectComposer, EffectPass, RenderPass, ToneMappingEffect, ToneMappingMode, VignetteEffect } from 'postprocessing'
import { Euler, PerspectiveCamera, Quaternion, Timer, Vector3, WebGLRenderer } from 'three'
import { FLIGHT, createFlight, forwardOf, stepFlight, type FlightInput } from './flight.ts'
import { createAudio } from './audio.ts'
import { createHud } from './hud.ts'
import { IDLE, createInput } from './input.ts'
import { ReentryEffect } from './reentry.ts'
import { loadGltf } from './gltf.ts'
import { loadShip } from './ship.ts'
import { buildSpace, loadSpaceTextures, type Body } from './space.ts'
import { FLORA, SURFACE, buildSurface, loadGroundTextures } from './surface.ts'
import { buildCastFor } from './cast.ts'
import { WORLDS } from './worlds.ts'
import { VOLCANO, shapeTerrain } from './biomes.ts'
import { createHeightmap } from './terrain.ts'

const TRANSITION_SECONDS = 2.5
const LANDING_RANGE_RADII = 1.5
const AUTO_LAND_DISTANCE = 14
const SPAWN_RADII = 12
const TAKEOFF_RADII = 3.2
const TAKEOFF_SPEED = 30
const LANDING_LOCKOUT_SECONDS = 8
const BASE_FOV = 60
const ZOOM_FOV = 26
const BLOOM_BASE = 1.1
const BLOOM_FLASH = 2.5
const HULL_HIT = 20
const CRATER_BURN_PER_SECOND = 12
const CRATER_BURN_ALTITUDE = 40
const IMPACT_SHAKE = 1.6
const CAMERA_OFFSET = new Vector3(0, 4, 16)
const CAMERA_LAG = 12
const CAMERA_TURN_LAG = 5
const TILT_LAG = 6
const BANK_GAIN = 0.45
const BANK_MAX = 0.8
const PITCH_GAIN = 0.12
const PITCH_MAX = 0.35
const FORWARD = new Vector3(0, 0, -1)
const SURFACE_PITCH = new Quaternion().setFromEuler(new Euler(-0.22, 0, 0))

type Mode = 'space' | 'surface' | 'reentry' | 'takeoff'

const canvas = document.getElementById('view') as HTMLCanvasElement
const renderer = new WebGLRenderer({ canvas, powerPreference: 'high-performance', antialias: false, stencil: false, depth: false })
const params = new URLSearchParams(location.search)
const dprParam = Number(params.get('dpr'))
const startDay = Number(params.get('hora') ?? 0.72)
renderer.setPixelRatio(dprParam || Math.min(devicePixelRatio, 2))
renderer.setSize(innerWidth, innerHeight)

const hud = createHud()
const camera = new PerspectiveCamera(BASE_FOV, innerWidth / innerHeight, 0.5, 50000)
const [raven, spaceTextures] = await Promise.all([loadShip(), loadSpaceTextures()]).catch((error: unknown) => {
  hud.showFatal('Faltam arquivos do jogo. Veja docs/ASSETS.md para baixar os modelos e texturas.', String(error))
  throw error
})
const space = buildSpace(spaceTextures)
const bodies = space.bodies
const kaelith = bodies.find((b) => b.key === 'kaelith')!
const ship = raven.object
space.scene.add(ship)
let targetIndex = space.targets.indexOf(kaelith)

// surfaces stream in while the player flies; each landable planet gets its own world
type Surface = ReturnType<typeof buildSurface>
type SharedAssets = Omit<Parameters<typeof buildSurface>[1], 'wildlife'>
const surfaces = new Map<string, Surface>()
const loadingWorlds = new Set<string>()
let current: Surface | null = null
let landed: Body = kaelith
let sharedPromise: Promise<SharedAssets> | null = null

// flora, lake and ground textures are shared by every world; each world's animals load on their own
function sharedAssets(): Promise<SharedAssets> {
  sharedPromise ??= (async () => {
    const [flora, ocean, groundTextures] = await Promise.all([Promise.all(FLORA.map((f) => loadGltf(f.url))), loadGltf('/models/ocean.glb'), loadGroundTextures()])
    return { flora: flora.map((gltf) => gltf.scene), ocean: { scene: ocean.scene, clip: ocean.animations[0] }, ground: groundTextures }
  })()
  return sharedPromise
}

async function prepareWorld(body: Body) {
  const profile = WORLDS[body.key]
  if (!profile || surfaces.has(body.key) || loadingWorlds.has(body.key)) return
  loadingWorlds.add(body.key)
  const [assets, wildlife] = await Promise.all([sharedAssets(), buildCastFor(profile)])
  const heightmap = createHeightmap({ size: 257, worldSize: 2000, maxHeight: 120, seed: profile.seed })
  shapeTerrain(heightmap, profile)
  surfaces.set(body.key, buildSurface(heightmap, { ...assets, wildlife }, { ...profile, startDay: params.has('hora') ? startDay : profile.startDay }))
  loadingWorlds.delete(body.key)
}

const PREPARE_RADII = 12

function prepareNearbyWorlds() {
  for (const body of bodies) if (WORLDS[body.key] && surfaceDistance(body) < body.radius * PREPARE_RADII) void prepareWorld(body)
}

const renderPass = new RenderPass(space.scene, camera)
const reentry = new ReentryEffect()
const bloom = new BloomEffect({ luminanceThreshold: 0.85, intensity: BLOOM_BASE, mipmapBlur: true, radius: 0.7 })
const composer = new EffectComposer(renderer, { multisampling: 4 })
composer.addPass(renderPass)
composer.addPass(
  new EffectPass(
    camera,
    bloom,
    reentry,
    new VignetteEffect({ darkness: 0.45, offset: 0.3 }),
    new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC }),
  ),
)

const input = createInput(canvas)
const audio = createAudio()
const flight = createFlight()
const home = bodies.find((b) => b.key === params.get('em')) ?? kaelith
flight.position.copy(home.position).add(new Vector3(0, home.radius * 0.5, home.radius * SPAWN_RADII))
let mode: Mode = 'space'
let transition = 0
let swapped = false
let hull = 100
let impact = 0
let burnFlash = 0
let landingLockout = 0
const orbitReturn = { offset: new Vector3(), quaternion: new Quaternion() }
const turnRate = { yaw: 0, pitch: 0 }
let alertText = ''
let sightingText = ''
const tilt = new Quaternion()
const tiltEuler = new Euler()

hud.onStart(() => input.lock())
document.addEventListener('pointerlockchange', () => (input.locked ? begin() : hud.showStart()))
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyC') hud.toggleCredits()
  else if (e.code === 'KeyM') hud.setMuted(audio.toggleMute())
  else if (e.code === 'Tab') {
    e.preventDefault()
    targetIndex = (targetIndex + 1) % space.targets.length
  } else if (e.code !== 'Escape') begin()
})

function begin() {
  audio.start()
  hud.hideStart()
  setTimeout(hud.hideHelp, 6000)
}
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
  composer.setSize(innerWidth, innerHeight)
})

const timer = new Timer()
const fps = { frames: 0, elapsed: 0, value: 0 }
const cameraTarget = new Vector3()
const toPlanet = new Vector3()
const projected = new Vector3()
const heading = new Vector3()

function frame() {
  timer.update()
  const dt = Math.min(timer.getDelta(), 0.05)
  const time = timer.getElapsed()
  const commands = input.consume(dt)

  if (mode === 'space') {
    flySpace(commands.flight, commands.land, dt)
    prepareNearbyWorlds()
  }
  else if (mode === 'surface') flySurface(commands.flight, dt)
  else advanceTransition(dt)

  presentShip(commands.flight, dt)
  followShip(dt)
  space.update(dt, time, camera.position)
  if (mode !== 'space' && current) {
    const events = current.update(dt, time, shipSense(), camera.position)
    if (events.hit) takeHit()
    if (events.flash) audio.thunder()
    alertText = events.threat ? `alerta · ${events.threat.label} a ${Math.round(events.threat.distance)}` : ''
    sightingText = events.nearby ? `${events.nearby.label} · ${Math.round(events.nearby.distance)}` : ''
  } else {
    alertText = ''
    sightingText = ''
  }
  impact = Math.max(0, impact - dt * 2)
  reentry.time = time
  const thrust = thrustLevel(commands.flight.throttle)
  raven.setThrust(thrust, time)
  audio.update(thrust, mode === 'reentry' || mode === 'takeoff' ? transition : 0)

  measureFps(dt)
  const nearest = onSurface() ? landed : nearestBody()
  hud.update({
    speed: flight.speed,
    fps: fps.value,
    bodyName: nearest.name,
    distance: altitude() ?? surfaceDistance(nearest),
    hint: hintFor(),
    hull,
    alert: alertText,
  })
  pointAtTarget()
  composer.render(dt)
  requestAnimationFrame(frame)
}

function flySpace(controls: typeof IDLE, land: boolean, dt: number) {
  stepFlight(flight, controls, dt)
  keepOutOfPlanets()
  landingLockout = Math.max(0, landingLockout - dt)
  const target = landingBody()
  const grazing = surfaceDistance(target) < AUTO_LAND_DISTANCE && divingAt(target)
  if (landingLockout === 0 && surfaces.has(target.key) && (grazing || (land && nearPlanet()))) {
    landed = target
    beginTransition('reentry')
  }
}

// a flyby that merely skims the atmosphere stays in orbit; only a nose-down approach lands by itself
function divingAt(body: Body): boolean {
  toPlanet.subVectors(body.position, flight.position).normalize()
  return forwardOf(flight, heading).dot(toPlanet) > 0.3
}

function landingBody(): Body {
  return bodies.filter((b) => WORLDS[b.key]).reduce((best: Body, body: Body) => (surfaceDistance(body) < surfaceDistance(best) ? body : best))
}

function onSurface() {
  return current !== null && ship.parent === current.scene
}

function altitude(): number | null {
  if (!current || !onSurface()) return null
  return flight.position.y - current.ground(flight.position.x, flight.position.z)
}

function shipSense() {
  const y = altitude()
  return y === null ? null : { x: flight.position.x, y, z: flight.position.z }
}

function takeHit() {
  hull = Math.max(0, hull - HULL_HIT)
  impact = IMPACT_SHAKE
  hud.flashDamage()
  if (hull === 0 && mode === 'surface') beginTransition('takeoff')
}

function keepOutOfPlanets() {
  for (const body of bodies) {
    toPlanet.subVectors(flight.position, body.position)
    const minDistance = body.radius * 1.08
    if (toPlanet.length() < minDistance) flight.position.copy(body.position).addScaledVector(toPlanet.normalize(), minDistance)
  }
}

function surfaceDistance(body: Body) {
  return toPlanet.subVectors(flight.position, body.position).length() - body.radius
}

function nearestBody(): Body {
  return bodies.reduce((best: Body, body: Body) => (surfaceDistance(body) < surfaceDistance(best) ? body : best))
}

// the navigation bracket sits on the chosen body, or on the screen edge in its direction
function pointAtTarget() {
  const target = space.targets[targetIndex]
  if (onSurface() || mode !== 'space') return hud.setTarget(null)
  projected.copy(target.position).project(camera)
  const behind = projected.z > 1
  let x = behind ? -projected.x : projected.x
  let y = behind ? -projected.y : projected.y
  const offscreen = behind || Math.abs(x) > 0.95 || Math.abs(y) > 0.9
  if (offscreen) {
    const m = Math.max(Math.abs(x) / 0.95, Math.abs(y) / 0.9)
    x /= m
    y /= m
  }
  hud.setTarget({ x: (x * 0.5 + 0.5) * innerWidth, y: (-y * 0.5 + 0.5) * innerHeight, text: `${target.name} · ${Math.round(surfaceDistance(target))}`, offscreen })
}

function flySurface(controls: typeof IDLE, dt: number) {
  if (!current) return
  stepFlight(flight, controls, dt)
  const p = flight.position
  p.x = Math.min(Math.max(p.x, -SURFACE.edge), SURFACE.edge)
  p.z = Math.min(Math.max(p.z, -SURFACE.edge), SURFACE.edge)
  p.y = Math.max(p.y, current.ground(p.x, p.z) + SURFACE.hoverGap)
  if (WORLDS[landed.key]?.volcano && Math.hypot(p.x - VOLCANO.x, p.z - VOLCANO.z) < VOLCANO.crater && p.y - current.ground(p.x, p.z) < CRATER_BURN_ALTITUDE) scorch(dt)
  if (p.y > SURFACE.ceiling) beginTransition('takeoff')
}

// hovering inside the crater cooks the hull a little every second
function scorch(dt: number) {
  hull = Math.max(0, hull - CRATER_BURN_PER_SECOND * dt)
  burnFlash -= dt
  if (burnFlash <= 0) {
    burnFlash = 0.5
    hud.flashDamage()
    impact = IMPACT_SHAKE * 0.4
  }
  if (hull === 0 && mode === 'surface') beginTransition('takeoff')
}

function beginTransition(next: 'reentry' | 'takeoff') {
  if (next === 'reentry') {
    orbitReturn.offset.subVectors(flight.position, landed.position)
    orbitReturn.quaternion.copy(flight.quaternion)
  }
  mode = next
  transition = 0
  swapped = false
}

function advanceTransition(dt: number) {
  transition += dt / TRANSITION_SECONDS
  flight.speed *= Math.exp(-dt)
  stepFlight(flight, IDLE, dt)
  if (mode === 'reentry' && !swapped) keepOutOfPlanets()
  reentry.progress = Math.min(transition, 1)
  if (transition >= 0.5 && !swapped) {
    swapped = true
    if (mode === 'reentry') enterSurface()
    else enterSpace()
  }
  zoomThroughAtmosphere(Math.min(transition, 1))
  if (transition >= 1) {
    reentry.progress = 0
    zoomThroughAtmosphere(0)
    mode = mode === 'reentry' ? 'surface' : 'space'
  }
}

// the camera dives in and the bloom flares around the swap, then both relax as the new scene fades in
function zoomThroughAtmosphere(progress: number) {
  const bump = Math.sin(progress * Math.PI)
  camera.fov = BASE_FOV - ZOOM_FOV * bump
  camera.updateProjectionMatrix()
  bloom.intensity = BLOOM_BASE + BLOOM_FLASH * bump
}

function enterSurface() {
  current = surfaces.get(landed.key) ?? null
  if (!current) return
  current.scene.add(ship)
  renderPass.mainScene = current.scene
  flight.position.copy(SURFACE.spawn)
  flight.quaternion.copy(SURFACE_PITCH)
  flight.speed = 25
  snapCamera()
}

function enterSpace() {
  space.scene.add(ship)
  renderPass.mainScene = space.scene
  const away = orbitReturn.offset.clone().normalize()
  flight.position.copy(landed.position).addScaledVector(away, landed.radius * TAKEOFF_RADII)
  flight.quaternion.setFromUnitVectors(FORWARD, away)
  flight.speed = TAKEOFF_SPEED
  landingLockout = LANDING_LOCKOUT_SECONDS
  hull = 100
  snapCamera()
}

// the hull banks into turns ahead of the camera, so the ship reads as turning instead of the world
function presentShip(controls: FlightInput, dt: number) {
  if (dt > 0) {
    const k = 1 - Math.exp(-TILT_LAG * dt)
    turnRate.yaw += (controls.yaw / dt - turnRate.yaw) * k
    turnRate.pitch += (controls.pitch / dt - turnRate.pitch) * k
  }
  tiltEuler.set(clamp(turnRate.pitch * PITCH_GAIN, PITCH_MAX), 0, clamp(turnRate.yaw * BANK_GAIN, BANK_MAX))
  ship.position.copy(flight.position)
  ship.quaternion.copy(flight.quaternion).multiply(tilt.setFromEuler(tiltEuler))
}

function clamp(value: number, limit: number) {
  return Math.min(Math.max(value, -limit), limit)
}

function followShip(dt: number) {
  cameraTarget.copy(CAMERA_OFFSET).applyQuaternion(flight.quaternion).add(flight.position)
  camera.position.lerp(cameraTarget, 1 - Math.exp(-CAMERA_LAG * dt))
  camera.quaternion.slerp(flight.quaternion, 1 - Math.exp(-CAMERA_TURN_LAG * dt))
  const shake = (mode === 'reentry' || mode === 'takeoff' ? 0.25 * Math.sin(transition * Math.PI) : 0) + impact
  if (shake > 0) {
    camera.position.x += (Math.random() - 0.5) * shake
    camera.position.y += (Math.random() - 0.5) * shake
  }
}

function snapCamera() {
  camera.position.copy(CAMERA_OFFSET).applyQuaternion(flight.quaternion).add(flight.position)
  camera.quaternion.copy(flight.quaternion)
}

function nearPlanet() {
  const target = landingBody()
  return surfaceDistance(target) < target.radius * LANDING_RANGE_RADII
}

function hintFor() {
  if (mode === 'space' && landingLockout === 0 && nearPlanet()) return surfaces.has(landingBody().key) ? 'E · descer' : 'preparando a descida…'
  if (mode === 'surface') return sightingText || 'suba acima de 150 para decolar'
  return ''
}

function thrustLevel(throttle: number) {
  const topSpeed = FLIGHT.maxSpeed * FLIGHT.boostMultiplier
  return Math.min(1, flight.speed / topSpeed + (throttle > 0 ? 0.15 : 0))
}

function measureFps(dt: number) {
  fps.frames++
  fps.elapsed += dt
  if (fps.elapsed >= 0.5) {
    fps.value = fps.frames / fps.elapsed
    fps.frames = 0
    fps.elapsed = 0
  }
}

frame()
void prepareWorld(home)
