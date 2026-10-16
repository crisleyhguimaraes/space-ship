import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SEA_LEVEL, VOLCANO, biomeAt, shapeTerrain } from './biomes.ts'
import { createHeightmap, sampleHeight } from './terrain.ts'

test('pesos de bioma somam um em qualquer ponto', () => {
  for (const [x, z] of [[0, 0], [-900, 0], [900, 0], [0, -900], [300, 500], [-500, -500]]) {
    const b = biomeAt(x, z)
    const sum = b.ocean + b.desert + b.forest + b.meadow
    assert.ok(Math.abs(sum - 1) < 1e-6, `soma ${sum} em ${x},${z}`)
    for (const w of [b.ocean, b.desert, b.forest, b.meadow]) assert.ok(w >= 0 && w <= 1)
  }
})

test('norte é oceano, oeste deserto, leste floresta, centro campo', () => {
  assert.ok(biomeAt(0, -950).ocean > 0.9)
  assert.ok(biomeAt(-900, 0).desert > 0.6)
  assert.ok(biomeAt(900, 100).forest > 0.6)
  assert.ok(biomeAt(0, 300).meadow > 0.6)
})

test('o relevo moldado afunda o oceano, aplaina o deserto e ergue o vulcão', () => {
  const h = createHeightmap({ size: 129, worldSize: 2000, maxHeight: 120, seed: 3 })
  const desertBefore = [-800, -700, -600].map((x) => sampleHeight(h, x, 100))
  shapeTerrain(h)
  assert.ok(sampleHeight(h, 0, -950) < SEA_LEVEL)
  assert.ok(sampleHeight(h, 500, -950) < SEA_LEVEL)
  const desertAfter = [-800, -700, -600].map((x) => sampleHeight(h, x, 100))
  const range = (v: number[]) => Math.max(...v) - Math.min(...v)
  assert.ok(range(desertAfter) < range(desertBefore) + 1e-6)
  const rim = sampleHeight(h, VOLCANO.x + VOLCANO.crater * 1.2, VOLCANO.z)
  const crater = sampleHeight(h, VOLCANO.x, VOLCANO.z)
  assert.ok(rim > VOLCANO.height * 0.7, `borda ${rim}`)
  assert.ok(crater < rim - 10, `cratera ${crater} borda ${rim}`)
})
