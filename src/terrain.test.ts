import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHeightmap, lowestBasin, sampleHeight } from './terrain.ts'

const small = { size: 4, worldSize: 400, maxHeight: 10, seed: 1 }
const cell = 400 / 3

test('alturas cobrem exatamente o intervalo de zero ao máximo', () => {
  const h = createHeightmap({ size: 64, worldSize: 2000, maxHeight: 120, seed: 7 })
  let lo = Infinity
  let hi = -Infinity
  for (const v of h.data) {
    lo = Math.min(lo, v)
    hi = Math.max(hi, v)
  }
  assert.ok(Math.abs(lo) < 1e-6)
  assert.ok(Math.abs(hi - 120) < 1e-6)
})

test('amostra sobre um vértice devolve o valor da grade', () => {
  const h = createHeightmap(small)
  const x = -200 + 1 * cell
  const z = -200 + 2 * cell
  assert.ok(Math.abs(sampleHeight(h, x, z) - h.data[2 * 4 + 1]) < 1e-6)
})

test('amostra entre dois vértices interpola linearmente', () => {
  const h = createHeightmap(small)
  const expected = (h.data[0] + h.data[1]) / 2
  assert.ok(Math.abs(sampleHeight(h, -200 + cell / 2, -200) - expected) < 1e-6)
})

test('coordenadas fora do mapa são grampeadas na borda', () => {
  const h = createHeightmap(small)
  assert.equal(sampleHeight(h, 5000, -5000), sampleHeight(h, 200, -200))
})

test('acha a bacia mais baixa do mapa', () => {
  const size = 9
  const data = new Float32Array(size * size).fill(50)
  for (let j = 6; j < 9; j++) for (let i = 0; i < 3; i++) data[j * size + i] = 5
  const basin = lowestBasin({ size, worldSize: 800, maxHeight: 50, data }, 200)
  assert.ok(basin.x < -150, `x ${basin.x}`)
  assert.ok(basin.z > 150, `z ${basin.z}`)
  assert.ok(basin.level < 20, `level ${basin.level}`)
})

test('nenhuma altura vira NaN, seja qual for a semente', () => {
  for (const seed of [3, 11, 23, 37, 41]) {
    const h = createHeightmap({ size: 257, worldSize: 2000, maxHeight: 120, seed })
    for (const v of h.data) assert.ok(!Number.isNaN(v), `NaN na semente ${seed}`)
  }
})
