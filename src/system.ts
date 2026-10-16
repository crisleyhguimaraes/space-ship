import { Vector3 } from 'three'

export type Rgb = [number, number, number]
export type Orbit = { radius: number; period: number; phase: number; inclination: number }
export type CometOrbit = { perihelion: number; aphelion: number; period: number; phase: number; inclination: number }
export type ShaderLook = { kind: 'shader'; low: Rgb; mid: Rgb; high: Rgb; atmosphere: Rgb; clouds: number; bands: boolean; glow: Rgb }
export type TexturedLook = { kind: 'textured'; color: string; normal: string; atmosphere: Rgb }
export type Look = ShaderLook | TexturedLook
export type MoonSpec = { name: string; radius: number; orbit: Orbit; look: ShaderLook }
export type RingSpec = { inner: number; outer: number; color: Rgb; tilt: number }
export type PlanetSpec = { key: string; name: string; radius: number; orbit: Orbit; look: Look; rings?: RingSpec; moons?: MoonSpec[]; landable?: boolean }

export const SUN_RADIUS = 200
export const BLACK_HOLE = { position: new Vector3(6000, 2500, -24000), radius: 300, diskOuter: 1100 }
export const ASTEROID_BELT = { inner: 5400, outer: 5900, thickness: 60, count: 2500, period: 2400 }

const rock = (low: Rgb, mid: Rgb, high: Rgb, atmosphere: Rgb, clouds = 0): ShaderLook => ({ kind: 'shader', low, mid, high, atmosphere, clouds, bands: false, glow: [0, 0, 0] })
const gas = (low: Rgb, mid: Rgb, high: Rgb, atmosphere: Rgb): ShaderLook => ({ kind: 'shader', low, mid, high, atmosphere, clouds: 0.3, bands: true, glow: [0, 0, 0] })

export const SYSTEM: PlanetSpec[] = [
  { key: 'cinza', name: 'Cinza', radius: 30, orbit: { radius: 700, period: 900, phase: 0.1, inclination: 0.02 }, look: { ...rock([0.05, 0.03, 0.03], [0.18, 0.12, 0.1], [0.3, 0.25, 0.22], [0.9, 0.4, 0.15]), glow: [1.6, 0.35, 0.05] }, landable: true },
  { key: 'rubra', name: 'Rubra', radius: 45, orbit: { radius: 1500, period: 1500, phase: 0.6, inclination: 0.03 }, look: { kind: 'textured', color: '/textures/mars-color.webp', normal: '/textures/mars-normal.webp', atmosphere: [1.0, 0.45, 0.2] }, landable: true },
  {
    key: 'kaelith', name: 'Kaelith', radius: 60, orbit: { radius: 2500, period: 2200, phase: 0.0, inclination: 0.0 },
    look: rock([0.02, 0.16, 0.24], [0.1, 0.42, 0.24], [0.72, 0.66, 0.92], [0.35, 0.62, 1.0], 1), landable: true,
    moons: [{ name: 'Vela', radius: 12, orbit: { radius: 170, period: 240, phase: 0.2, inclination: 0.15 }, look: rock([0.3, 0.3, 0.32], [0.5, 0.5, 0.52], [0.7, 0.7, 0.72], [0.2, 0.2, 0.25]) }],
  },
  { key: 'zafir', name: 'Zafir', radius: 55, orbit: { radius: 3600, period: 3000, phase: 0.45, inclination: 0.05 }, look: rock([0.02, 0.12, 0.4], [0.05, 0.3, 0.6], [0.6, 0.75, 0.7], [0.4, 0.7, 1.0], 0.9), landable: true },
  { key: 'brumal', name: 'Brumal', radius: 40, orbit: { radius: 4800, period: 4000, phase: 0.8, inclination: 0.08 }, look: rock([0.55, 0.65, 0.8], [0.8, 0.88, 0.95], [0.95, 0.97, 1.0], [0.6, 0.8, 1.0], 0.35), landable: true },
  {
    key: 'vorn', name: 'Vorn', radius: 150, orbit: { radius: 6500, period: 5200, phase: 0.3, inclination: 0.04 },
    look: gas([0.55, 0.35, 0.2], [0.85, 0.65, 0.4], [0.95, 0.85, 0.7], [0.9, 0.7, 0.5]),
    rings: { inner: 190, outer: 330, color: [0.85, 0.75, 0.6], tilt: 0.35 },
    moons: [
      { name: 'Ilo', radius: 18, orbit: { radius: 420, period: 420, phase: 0.1, inclination: 0.1 }, look: rock([0.4, 0.35, 0.3], [0.6, 0.55, 0.5], [0.8, 0.78, 0.75], [0.3, 0.3, 0.3]) },
      { name: 'Teu', radius: 24, orbit: { radius: 560, period: 700, phase: 0.7, inclination: 0.3 }, look: rock([0.2, 0.25, 0.3], [0.35, 0.4, 0.45], [0.6, 0.65, 0.7], [0.3, 0.4, 0.5]) },
    ],
  },
  { key: 'ocre', name: 'Ocre', radius: 38, orbit: { radius: 8000, period: 6500, phase: 0.95, inclination: 0.06 }, look: rock([0.45, 0.3, 0.15], [0.75, 0.55, 0.3], [0.9, 0.8, 0.6], [0.9, 0.7, 0.4]) },
  {
    key: 'lilas', name: 'Lilás', radius: 110, orbit: { radius: 9500, period: 8000, phase: 0.55, inclination: 0.02 },
    look: gas([0.3, 0.15, 0.45], [0.55, 0.35, 0.75], [0.85, 0.7, 0.95], [0.7, 0.5, 1.0]),
    rings: { inner: 135, outer: 210, color: [0.75, 0.65, 0.9], tilt: 0.6 },
  },
  { key: 'ferrugem', name: 'Ferrugem', radius: 35, orbit: { radius: 11000, period: 9500, phase: 0.2, inclination: 0.12 }, look: rock([0.25, 0.1, 0.05], [0.5, 0.25, 0.12], [0.7, 0.5, 0.35], [0.5, 0.3, 0.2]) },
  { key: 'noite', name: 'Noite', radius: 48, orbit: { radius: 12000, period: 11000, phase: 0.7, inclination: 0.2 }, look: rock([0.03, 0.04, 0.08], [0.08, 0.1, 0.18], [0.3, 0.35, 0.5], [0.3, 0.4, 0.7], 0.2) },
]

export const COMETS: CometOrbit[] = [
  { perihelion: 900, aphelion: 11000, period: 1800, phase: 0.1, inclination: 0.4 },
  { perihelion: 1300, aphelion: 9000, period: 1500, phase: 0.55, inclination: -0.25 },
  { perihelion: 600, aphelion: 12500, period: 2400, phase: 0.8, inclination: 0.7 },
]

export function orbitPosition(orbit: Orbit, time: number, out: Vector3): Vector3 {
  const angle = (orbit.phase + time / orbit.period) * Math.PI * 2
  const r = orbit.radius
  return out.set(Math.cos(angle) * r, Math.sin(angle) * r * Math.sin(orbit.inclination), Math.sin(angle) * r * Math.cos(orbit.inclination))
}

// an ellipse with the sun at one focus; perihelion at phase 0
export function cometPosition(comet: CometOrbit, time: number, out: Vector3): Vector3 {
  const a = (comet.perihelion + comet.aphelion) / 2
  const c = a - comet.perihelion
  const b = Math.sqrt(a * a - c * c)
  const angle = (comet.phase + time / comet.period) * Math.PI * 2
  const x = a * Math.cos(angle) - c
  const z = b * Math.sin(angle)
  const rotated = { x: x * Math.cos(comet.inclination), y: x * Math.sin(comet.inclination) }
  return out.set(rotated.x, rotated.y, z)
}
