export const FLOCK = {
  scareRadius: 140,
  calmSeconds: 5,
  fleeDistance: 80,
  driftRate: 0.6,
  climbRate: 0.8,
  orbitSpeedRest: 0.5,
  orbitSpeedAlarm: 1.6,
}

export type FlockShape = { restAltitude: number; alarmAltitude: number; orbitRadius: number }
export type Threat = { x: number; z: number } | null

export type Flock = {
  count: number
  shape: FlockShape
  home: [number, number]
  anchor: [number, number]
  altitude: number
  alarm: number
  angle: Float32Array
  radius: Float32Array
  pos: Float32Array
  heading: Float32Array
}

export function createFlock(count: number, home: [number, number], shape: FlockShape, random = Math.random): Flock {
  const angle = new Float32Array(count)
  const radius = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    angle[i] = (i / count) * Math.PI * 2 + random() * 0.5
    radius[i] = shape.orbitRadius * (0.6 + random() * 0.7)
  }
  const flock: Flock = { count, shape, home, anchor: [home[0], home[1]], altitude: shape.restAltitude, alarm: 0, angle, radius, pos: new Float32Array(count * 2), heading: new Float32Array(count) }
  placeBirds(flock)
  return flock
}

export function stepFlock(f: Flock, dt: number, threat: Threat): void {
  const drift = 1 - Math.exp(-FLOCK.driftRate * dt)
  const scared = threat !== null && Math.hypot(f.anchor[0] - threat.x, f.anchor[1] - threat.z) < FLOCK.scareRadius
  if (scared && threat) {
    f.alarm = FLOCK.calmSeconds
    const away = Math.atan2(f.anchor[1] - threat.z, f.anchor[0] - threat.x)
    f.anchor[0] += Math.cos(away) * FLOCK.fleeDistance * drift
    f.anchor[1] += Math.sin(away) * FLOCK.fleeDistance * drift
  } else {
    f.alarm = Math.max(0, f.alarm - dt)
    if (f.alarm === 0) {
      f.anchor[0] += (f.home[0] - f.anchor[0]) * drift
      f.anchor[1] += (f.home[1] - f.anchor[1]) * drift
    }
  }
  const targetAltitude = f.alarm > 0 ? f.shape.alarmAltitude : f.shape.restAltitude
  f.altitude += (targetAltitude - f.altitude) * (1 - Math.exp(-FLOCK.climbRate * dt))
  const speed = f.alarm > 0 ? FLOCK.orbitSpeedAlarm : FLOCK.orbitSpeedRest
  for (let i = 0; i < f.count; i++) f.angle[i] += speed * (0.8 + 0.2 * (i % 3)) * dt
  placeBirds(f)
}

function placeBirds(f: Flock): void {
  for (let i = 0; i < f.count; i++) {
    f.pos[i * 2] = f.anchor[0] + Math.cos(f.angle[i]) * f.radius[i]
    f.pos[i * 2 + 1] = f.anchor[1] + Math.sin(f.angle[i]) * f.radius[i]
    f.heading[i] = f.angle[i] + Math.PI / 2
  }
}
