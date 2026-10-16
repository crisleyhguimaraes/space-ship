import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js'
import type { Heightmap } from './terrain.ts'
import type { Layout } from './worlds.ts'

export const SEA_LEVEL = 6
export const VOLCANO = { x: -600, z: -250, radius: 220, height: 170, crater: 40, craterDepth: 60 }

export type Biome = { ocean: number; desert: number; forest: number; meadow: number; ice: number }

const OCEAN_DEPTH = 14
const DESERT_FLOOR = 22
const DESERT_RELIEF = 0.25
const noise = new ImprovedNoise()

// boundaries wobble with low-frequency noise so coasts and tree lines are not straight
function wobble(x: number, z: number): number {
  return noise.noise(x / 420 + 7.3, z / 420 + 2.1, 0.5) * 140
}

export function biomeAt(x: number, z: number, layout: Layout = 'kaelith'): Biome {
  const w = wobble(x, z)
  switch (layout) {
    case 'desert':
    case 'lava': {
      const meadow = layout === 'desert' ? ramp(w, 60, 130) * 0.6 : 0
      return { ocean: 0, desert: 1 - meadow, forest: 0, meadow, ice: 0 }
    }
    case 'ice': {
      const ocean = ramp(z + w * 0.6, -520, -720)
      const forest = ramp(w, 20, 110) * (1 - ocean)
      return { ocean, desert: 0, forest, meadow: Math.max(0, 1 - ocean - forest), ice: 0 }
    }
    case 'ocean': {
      const island = ramp(wobble(x + 900, z - 400) + w * 0.5, -10, 90)
      return { ocean: 1 - island, desert: 0, forest: island * 0.7, meadow: island * 0.3, ice: 0 }
    }
    case 'verdant': {
      const ocean = ramp(z + w * 0.6, -640, -800)
      const forest = ramp(wobble(x + 300, z + 700) + w * 0.3, -30, 70) * (1 - ocean)
      return { ocean, desert: 0, forest, meadow: Math.max(0, 1 - ocean - forest), ice: 0 }
    }
    case 'quadrants': {
      const ice = ramp(z + w * 0.6, -260, -520)
      const desert = ramp(x + w, -240, -520) * (1 - ice)
      const forest = ramp(x + w, 240, 520) * (1 - ice)
      return { ocean: 0, desert, forest, meadow: Math.max(0, 1 - ice - desert - forest), ice }
    }
    default: {
      const ocean = ramp(z + w * 0.6, -520, -720)
      const desert = ramp(x + w, -200, -480) * (1 - ocean)
      const forest = ramp(x + w, 180, 460) * (1 - ocean)
      return { ocean, desert, forest, meadow: Math.max(0, 1 - ocean - desert - forest), ice: 0 }
    }
  }
}

export type Shaping = { layout: Layout; sea: boolean; volcano: boolean }

export function shapeTerrain(h: Heightmap, shaping: Shaping = { layout: 'kaelith', sea: true, volcano: true }): void {
  const cell = h.worldSize / (h.size - 1)
  for (let j = 0; j < h.size; j++) {
    for (let i = 0; i < h.size; i++) {
      const x = -h.worldSize / 2 + i * cell
      const z = -h.worldSize / 2 + j * cell
      const b = biomeAt(x, z, shaping.layout)
      let height = h.data[j * h.size + i]
      height = lerp(height, DESERT_FLOOR + height * DESERT_RELIEF, b.desert)
      if (shaping.sea) height = lerp(height, SEA_LEVEL - OCEAN_DEPTH - height * 0.1, b.ocean)
      h.data[j * h.size + i] = shaping.volcano ? Math.max(height, volcanoHeight(x, z)) : height
    }
  }
}

function volcanoHeight(x: number, z: number): number {
  const d = Math.hypot(x - VOLCANO.x, z - VOLCANO.z)
  if (d >= VOLCANO.radius) return -Infinity
  const cone = VOLCANO.height * Math.pow(1 - d / VOLCANO.radius, 1.1)
  const bowl = d < VOLCANO.crater ? VOLCANO.craterDepth * (1 - (d / VOLCANO.crater) ** 2) : 0
  return cone - bowl
}

function ramp(value: number, from: number, to: number): number {
  const t = Math.min(Math.max((value - from) / (to - from), 0), 1)
  return t * t * (3 - 2 * t)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
