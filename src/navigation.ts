import { ASTEROID_BELT } from './system.ts'

export const NAV = {
  pullRadii: 5,
  pullMax: 22,
  avoidMin: 70,
  avoidRadii: 0.7,
  warnFactor: 1.5,
  shellMin: 22,
  shellRadii: 0.22,
  assistDamping: 0.65,
  beltBand: 250,
  beltHalfThickness: 140,
  slingshotSpeed: 150,
  slingshotDecay: 1.1,
  slingshotSeconds: 4,
}

// gravity grows as the ship falls toward a landable world, never faster than the ship can fight with its engines
export function gravityPull(distanceToSurface: number, radius: number): number {
  const reach = radius * NAV.pullRadii
  if (distanceToSurface >= reach) return 0
  const closeness = 1 - Math.max(distanceToSurface, 0) / reach
  return NAV.pullMax * closeness * closeness
}

// the thin layer the emergency system holds the ship to while it circles an obstacle
export function shellClearance(radius: number): number {
  return Math.max(NAV.shellMin, radius * NAV.shellRadii)
}

export function warnRange(radius: number): number {
  return Math.max(NAV.avoidMin, radius * NAV.avoidRadii) * NAV.warnFactor
}

// warn: how urgent the alert is (0 none, 1 imminent); push: how hard the autopilot swerves
export function avoidProfile(distanceToSurface: number, radius: number): { warn: number; push: number } {
  const avoid = Math.max(NAV.avoidMin, radius * NAV.avoidRadii)
  const warnRange = avoid * NAV.warnFactor
  if (distanceToSurface >= warnRange) return { warn: 0, push: 0 }
  const warn = 1 - Math.max(distanceToSurface, 0) / warnRange
  if (distanceToSurface >= avoid) return { warn, push: 0 }
  const push = 1 - Math.max(distanceToSurface, 0) / avoid
  return { warn, push }
}

// the belt is a flat ring: warn on approach, and once inside the dust push the ship out through the nearest face
export function beltProfile(radialDistance: number, height: number): { warn: number; push: number } {
  const { inner, outer } = ASTEROID_BELT
  const outside = Math.max(inner - radialDistance, radialDistance - outer, 0)
  const verticalOutside = Math.max(Math.abs(height) - NAV.beltHalfThickness, 0)
  const away = Math.max(outside, verticalOutside)
  if (away >= NAV.beltBand) return { warn: 0, push: 0 }
  const warn = 1 - away / NAV.beltBand
  const inside = outside === 0 && verticalOutside === 0
  return { warn: inside ? 1 : warn, push: inside ? 1 - Math.abs(height) / NAV.beltHalfThickness : 0 }
}

export type Vec3 = { x: number; y: number; z: number }

// steering that follows the obstacle's surface: drop the part of the heading that points into the body, keep the rest.
// Head-on, there is no tangent, so the ship breaks toward `fallback` (any direction perpendicular to the normal)
export function slideDirection(forward: Vec3, outward: Vec3, fallback: Vec3): Vec3 {
  const into = -(forward.x * outward.x + forward.y * outward.y + forward.z * outward.z)
  if (into <= 0) return forward
  let t = { x: forward.x + outward.x * into, y: forward.y + outward.y * into, z: forward.z + outward.z * into }
  let length = Math.hypot(t.x, t.y, t.z)
  if (length < 0.05) {
    const along = fallback.x * outward.x + fallback.y * outward.y + fallback.z * outward.z
    t = { x: fallback.x - outward.x * along, y: fallback.y - outward.y * along, z: fallback.z - outward.z * along }
    length = Math.hypot(t.x, t.y, t.z) || 1
  }
  return { x: t.x / length, y: t.y / length, z: t.z / length }
}
