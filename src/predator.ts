import { turnToward } from './angles.ts'

export const PREDATOR = {
  detect: 260,
  lose: 380,
  strike: 14,
  strikeCooldown: 1.5,
  lurkSpeed: 4,
  huntSpeed: 28,
  airHuntSpeed: 40,
  returnSpeed: 17,
  turnRate: 2.5,
  lairRadius: 60,
  groundHuntAltitude: 70,
  airLurkAltitude: 40,
  climbRate: 1.5,
  accel: 2,
  wanderRate: 1.2,
  retreatSeconds: 2,
}

export type PredatorKind = 'ground' | 'air'
export type PredatorState = 'lurk' | 'hunt' | 'return' | 'retreat'
export type Prey = { x: number; y: number; z: number } | null
export type Animal = { x: number; z: number; alive: boolean }
export type Target = { kind: 'ship'; x: number; y: number; z: number } | { kind: 'animal'; index: number; x: number; y: number; z: number } | null

export type Predator = {
  kind: PredatorKind
  lair: [number, number]
  x: number
  y: number
  z: number
  heading: number
  speed: number
  state: PredatorState
  cooldown: number
  retreat: number
}

export function createPredator(kind: PredatorKind, lair: [number, number]): Predator {
  return { kind, lair, x: lair[0], z: lair[1], y: kind === 'air' ? PREDATOR.airLurkAltitude : 0, heading: 0, speed: 0, state: 'lurk', cooldown: 0, retreat: 0 }
}

// the ship is the preferred target while it is reachable; otherwise the nearest living prey within sight
export function pickTarget(p: Predator, ship: Prey, animals: Animal[]): Target {
  if (ship && canHunt(p, ship)) return { kind: 'ship', x: ship.x, y: ship.y, z: ship.z }
  let best = -1
  let bestDistance = PREDATOR.detect
  animals.forEach((animal, index) => {
    if (!animal.alive) return
    const distance = Math.hypot(animal.x - p.x, animal.z - p.z)
    if (distance < bestDistance) {
      bestDistance = distance
      best = index
    }
  })
  return best >= 0 ? { kind: 'animal', index: best, x: animals[best].x, y: 0, z: animals[best].z } : null
}

function canHunt(p: Predator, prey: NonNullable<Prey>): boolean {
  const range = p.state === 'hunt' ? PREDATOR.lose : PREDATOR.detect
  const reachable = p.kind === 'air' || prey.y < PREDATOR.groundHuntAltitude
  return reachable && Math.hypot(prey.x - p.x, prey.z - p.z) < range
}

export function stepPredator(p: Predator, dt: number, prey: Prey, random = Math.random): 'hit' | null {
  p.cooldown = Math.max(0, p.cooldown - dt)
  const horizontal = prey ? Math.hypot(prey.x - p.x, prey.z - p.z) : Infinity
  if (p.state === 'retreat') {
    p.retreat -= dt
    if (p.retreat <= 0) p.state = 'hunt'
  } else if (prey && canHunt(p, prey)) p.state = 'hunt'
  else if (p.state === 'hunt') p.state = 'return'

  const home = Math.hypot(p.lair[0] - p.x, p.lair[1] - p.z)
  if (p.state === 'return' && home < PREDATOR.lairRadius * 0.5) p.state = 'lurk'

  let desired = p.heading
  let targetSpeed = PREDATOR.lurkSpeed
  let targetAltitude = PREDATOR.airLurkAltitude
  let hit: 'hit' | null = null

  if (p.state === 'hunt' && prey) {
    desired = Math.atan2(prey.z - p.z, prey.x - p.x)
    targetSpeed = p.kind === 'air' ? PREDATOR.airHuntSpeed : PREDATOR.huntSpeed
    targetAltitude = prey.y
    if (Math.hypot(horizontal, prey.y - p.y) < PREDATOR.strike) {
      targetSpeed = 0
      if (p.cooldown === 0) {
        p.cooldown = PREDATOR.strikeCooldown
        p.state = 'retreat'
        p.retreat = PREDATOR.retreatSeconds
        hit = 'hit'
      }
    }
  } else if (p.state === 'retreat' && prey) {
    // hit and run: peel away from the prey, climbing if airborne, then come back for another pass
    desired = Math.atan2(p.z - prey.z, p.x - prey.x)
    targetSpeed = p.kind === 'air' ? PREDATOR.airHuntSpeed : PREDATOR.huntSpeed
    targetAltitude = prey.y + 25
  } else if (p.state === 'return') {
    desired = Math.atan2(p.lair[1] - p.z, p.lair[0] - p.x)
    targetSpeed = PREDATOR.returnSpeed
  } else if (home > PREDATOR.lairRadius) {
    desired = Math.atan2(p.lair[1] - p.z, p.lair[0] - p.x)
  } else {
    desired = p.heading + (random() - 0.5) * 2 * PREDATOR.wanderRate * dt
  }

  p.heading = turnToward(p.heading, desired, PREDATOR.turnRate * dt)
  p.speed += (targetSpeed - p.speed) * (1 - Math.exp(-PREDATOR.accel * dt))
  p.x += Math.cos(p.heading) * p.speed * dt
  p.z += Math.sin(p.heading) * p.speed * dt
  if (p.kind === 'air') p.y += (targetAltitude - p.y) * (1 - Math.exp(-PREDATOR.climbRate * dt))
  return hit
}
