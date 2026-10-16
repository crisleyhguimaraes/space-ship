import { ASTEROID_BELT } from './system.ts'

export const NAV = {
  pullRadii: 5,
  pullMax: 22,
  avoidMin: 140,
  avoidRadii: 1.4,
  warnFactor: 1.8,
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
