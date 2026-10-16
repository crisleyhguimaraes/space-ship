import { turnToward } from './angles.ts'

export const HERD = {
  grazeSpeed: 3,
  trotSpeed: 8,
  fleeSpeed: 26,
  fleeRadius: 110,
  calmSeconds: 4,
  spread: 18,
  turnRate: 4,
  wanderRate: 1.5,
  accel: 3,
}

export type Herd = {
  count: number
  anchor: [number, number]
  pos: Float32Array
  heading: Float32Array
  speed: Float32Array
  fear: Float32Array
}

export type Threat = { x: number; z: number } | null

export function createHerd(count: number, anchor: [number, number], random = Math.random): Herd {
  const pos = new Float32Array(count * 2)
  const heading = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2
    const radius = Math.sqrt(random()) * HERD.spread
    pos[i * 2] = anchor[0] + Math.cos(angle) * radius
    pos[i * 2 + 1] = anchor[1] + Math.sin(angle) * radius
    heading[i] = random() * Math.PI * 2
  }
  return { count, anchor, pos, heading, speed: new Float32Array(count), fear: new Float32Array(count) }
}

export function stepHerd(h: Herd, dt: number, threat: Threat, random = Math.random): void {
  for (let i = 0; i < h.count; i++) {
    const px = h.pos[i * 2]
    const pz = h.pos[i * 2 + 1]
    let desired = h.heading[i]
    let targetSpeed = HERD.grazeSpeed

    if (threat && Math.hypot(px - threat.x, pz - threat.z) < HERD.fleeRadius) {
      h.fear[i] = HERD.calmSeconds
      desired = Math.atan2(pz - threat.z, px - threat.x) + scatterBias(i)
    }

    if (h.fear[i] > 0) {
      h.fear[i] -= dt
      targetSpeed = HERD.fleeSpeed
    } else {
      const homeDistance = Math.hypot(h.anchor[0] - px, h.anchor[1] - pz)
      if (homeDistance > HERD.spread) desired = Math.atan2(h.anchor[1] - pz, h.anchor[0] - px)
      else desired = h.heading[i] + (random() - 0.5) * 2 * HERD.wanderRate * dt
      if (homeDistance > HERD.spread * 2) targetSpeed = HERD.trotSpeed
    }

    h.heading[i] = turnToward(h.heading[i], desired, HERD.turnRate * dt)
    h.speed[i] += (targetSpeed - h.speed[i]) * (1 - Math.exp(-HERD.accel * dt))
    h.pos[i * 2] += Math.cos(h.heading[i]) * h.speed[i] * dt
    h.pos[i * 2 + 1] += Math.sin(h.heading[i]) * h.speed[i] * dt
  }
}

function scatterBias(i: number): number {
  return ((i % 5) - 2) * 0.4
}
