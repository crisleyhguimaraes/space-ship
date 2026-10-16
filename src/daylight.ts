export const DAY_SECONDS = 360

type Rgb = [number, number, number]
type Key = { sky: Rgb; horizon: Rgb; fog: Rgb; sunColor: Rgb; sunIntensity: number; ambient: number; stars: number }

export type Daylight = Key & { elevation: number; azimuth: number; sunDir: Rgb }

const NIGHT: Key = { sky: [0.02, 0.02, 0.06], horizon: [0.05, 0.04, 0.1], fog: [0.04, 0.03, 0.08], sunColor: [0.6, 0.7, 1.0], sunIntensity: 0, ambient: 0.25, stars: 1 }
const DAWN: Key = { sky: [0.35, 0.3, 0.5], horizon: [1.0, 0.55, 0.3], fog: [0.6, 0.45, 0.4], sunColor: [1.0, 0.6, 0.35], sunIntensity: 1.6, ambient: 0.7, stars: 0.1 }
const DAY: Key = { sky: [0.35, 0.55, 0.95], horizon: [0.75, 0.85, 0.95], fog: [0.7, 0.78, 0.88], sunColor: [1.0, 0.97, 0.9], sunIntensity: 3.2, ambient: 1.0, stars: 0 }
const DUSK: Key = { sky: [0.04, 0.02, 0.09], horizon: [0.23, 0.13, 0.31], fog: [0.23, 0.13, 0.31], sunColor: [1.0, 0.69, 0.44], sunIntensity: 2.4, ambient: 0.9, stars: 0.2 }
const KEYS: Key[] = [NIGHT, DAWN, DAY, DUSK]
const MAX_ELEVATION = Math.PI / 2 - 0.16

// t runs 0..1 over a day: 0 midnight, 0.25 dawn, 0.5 noon, 0.75 dusk
export function daylightAt(t: number): Daylight {
  const phase = ((t % 1) + 1) % 1
  const slot = phase * KEYS.length
  const from = KEYS[Math.floor(slot) % KEYS.length]
  const to = KEYS[(Math.floor(slot) + 1) % KEYS.length]
  const f = smooth(slot - Math.floor(slot))
  const elevation = Math.sin((phase - 0.25) * Math.PI * 2) * MAX_ELEVATION
  const azimuth = (phase - 0.25) * Math.PI
  return {
    sky: mix(from.sky, to.sky, f),
    horizon: mix(from.horizon, to.horizon, f),
    fog: mix(from.fog, to.fog, f),
    sunColor: mix(from.sunColor, to.sunColor, f),
    sunIntensity: lerp(from.sunIntensity, to.sunIntensity, f),
    ambient: lerp(from.ambient, to.ambient, f),
    stars: lerp(from.stars, to.stars, f),
    elevation,
    azimuth,
    sunDir: [Math.cos(elevation) * Math.cos(azimuth), Math.sin(elevation), Math.cos(elevation) * Math.sin(azimuth)],
  }
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
}
