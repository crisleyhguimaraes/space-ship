import { test } from 'node:test'
import assert from 'node:assert/strict'
import { HERD, createHerd, stepHerd } from './herd.ts'

const dt = 1 / 60

function seeded(seed = 1) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function run(herd: ReturnType<typeof createHerd>, seconds: number, threat: { x: number; z: number } | null, random: () => number) {
  for (let i = 0; i < seconds * 60; i++) stepHerd(herd, dt, threat, random)
}

function distanceTo(herd: ReturnType<typeof createHerd>, i: number, x: number, z: number) {
  return Math.hypot(herd.pos[i * 2] - x, herd.pos[i * 2 + 1] - z)
}

function spread(herd: ReturnType<typeof createHerd>) {
  let cx = 0
  let cz = 0
  for (let i = 0; i < herd.count; i++) {
    cx += herd.pos[i * 2]
    cz += herd.pos[i * 2 + 1]
  }
  cx /= herd.count
  cz /= herd.count
  let sum = 0
  for (let i = 0; i < herd.count; i++) sum += distanceTo(herd, i, cx, cz)
  return sum / herd.count
}

test('sem ameaça o bando pasta perto da âncora', () => {
  const random = seeded(3)
  const herd = createHerd(6, [100, -50], random)
  run(herd, 30, null, random)
  for (let i = 0; i < herd.count; i++) {
    assert.ok(distanceTo(herd, i, 100, -50) < HERD.spread * 2.5, `bicho ${i} longe demais`)
    assert.ok(herd.speed[i] <= HERD.grazeSpeed * 1.5)
  }
})

test('nave perto faz o bando fugir e se espalhar', () => {
  const random = seeded(7)
  const herd = createHerd(6, [0, 0], random)
  const before = spread(herd)
  const threat = { x: 0, z: 0 }
  run(herd, 2, threat, random)
  for (let i = 0; i < herd.count; i++) {
    assert.ok(distanceTo(herd, i, 0, 0) > HERD.spread * 1.5, `bicho ${i} não fugiu`)
    assert.ok(herd.speed[i] > HERD.grazeSpeed * 3)
  }
  assert.ok(spread(herd) > before * 1.5)
})

test('passado o susto, o bando desacelera e volta para a âncora', () => {
  const random = seeded(11)
  const herd = createHerd(6, [0, 0], random)
  run(herd, 2, { x: 0, z: 0 }, random)
  const scattered = spread(herd)
  run(herd, HERD.calmSeconds + 30, null, random)
  for (let i = 0; i < herd.count; i++) assert.ok(herd.speed[i] <= HERD.grazeSpeed * 1.5, `bicho ${i} ainda correndo`)
  assert.ok(spread(herd) < scattered)
})
