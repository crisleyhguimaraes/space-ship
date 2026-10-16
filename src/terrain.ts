import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js'

export type Heightmap = {
  size: number
  worldSize: number
  maxHeight: number
  data: Float32Array
}

export type HeightmapOptions = {
  size: number
  worldSize: number
  maxHeight: number
  seed: number
}

const OCTAVES = 5
const FREQUENCY = 4
const VALLEY_FLATTENING = 1.6

export function createHeightmap({ size, worldSize, maxHeight, seed }: HeightmapOptions): Heightmap {
  const noise = new ImprovedNoise()
  const data = new Float32Array(size * size)
  const offset = seed * 97.13
  let lo = Infinity
  let hi = -Infinity

  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const v = fbm(noise, (i / size) * FREQUENCY + offset, (j / size) * FREQUENCY + offset)
      data[j * size + i] = v
      lo = Math.min(lo, v)
      hi = Math.max(hi, v)
    }
  }

  const range = hi - lo || 1
  for (let k = 0; k < data.length; k++) {
    data[k] = Math.pow(Math.max(0, (data[k] - lo) / range), VALLEY_FLATTENING) * maxHeight
  }
  return { size, worldSize, maxHeight, data }
}

function fbm(noise: ImprovedNoise, x: number, y: number): number {
  let amplitude = 1
  let frequency = 1
  let sum = 0
  for (let o = 0; o < OCTAVES; o++) {
    sum += amplitude * noise.noise(x * frequency, y * frequency, 0.5)
    amplitude *= 0.5
    frequency *= 2
  }
  return sum
}

export function sampleHeight(h: Heightmap, x: number, z: number): number {
  const last = h.size - 1
  const cell = h.worldSize / last
  const u = clamp((x + h.worldSize / 2) / cell, 0, last)
  const v = clamp((z + h.worldSize / 2) / cell, 0, last)
  const i0 = Math.floor(u)
  const j0 = Math.floor(v)
  const i1 = Math.min(i0 + 1, last)
  const j1 = Math.min(j0 + 1, last)
  const fu = u - i0
  const fv = v - j0
  const top = h.data[j0 * h.size + i0] * (1 - fu) + h.data[j0 * h.size + i1] * fu
  const bottom = h.data[j1 * h.size + i0] * (1 - fu) + h.data[j1 * h.size + i1] * fu
  return top * (1 - fv) + bottom * fv
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi)
}

export type Basin = { x: number; z: number; level: number }

const BASIN_SAMPLES = 5

export function lowestBasin(h: Heightmap, windowSize: number, allowed: (x: number, z: number) => boolean = () => true): Basin {
  const half = h.worldSize / 2 - windowSize / 2
  const step = windowSize / 4
  let best: Basin = { x: 0, z: 0, level: Infinity }
  for (let z = -half; z <= half; z += step) {
    for (let x = -half; x <= half; x += step) {
      if (!allowed(x, z)) continue
      const level = meanHeight(h, x, z, windowSize)
      if (level < best.level) best = { x, z, level }
    }
  }
  return best
}

function meanHeight(h: Heightmap, cx: number, cz: number, windowSize: number): number {
  let sum = 0
  for (let j = 0; j < BASIN_SAMPLES; j++) {
    for (let i = 0; i < BASIN_SAMPLES; i++) {
      const u = (i / (BASIN_SAMPLES - 1) - 0.5) * windowSize
      const v = (j / (BASIN_SAMPLES - 1) - 0.5) * windowSize
      sum += sampleHeight(h, cx + u, cz + v)
    }
  }
  return sum / (BASIN_SAMPLES * BASIN_SAMPLES)
}
