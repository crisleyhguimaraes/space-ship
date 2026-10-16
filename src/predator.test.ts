import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PREDATOR, createPredator, pickTarget, stepPredator } from './predator.ts'

const dt = 1 / 60

function seeded(seed = 1) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function run(p: ReturnType<typeof createPredator>, seconds: number, prey: { x: number; y: number; z: number } | null, random: () => number) {
  let hits = 0
  for (let i = 0; i < seconds * 60; i++) if (stepPredator(p, dt, prey, random) === 'hit') hits++
  return hits
}

test('longe da nave, o predador ronda perto da toca', () => {
  const random = seeded(2)
  const p = createPredator('ground', [300, 300])
  run(p, 30, { x: -500, y: 40, z: -500 }, random)
  assert.equal(p.state, 'lurk')
  assert.ok(Math.hypot(p.x - 300, p.z - 300) < PREDATOR.lairRadius * 1.5)
  assert.ok(p.speed <= PREDATOR.lurkSpeed * 1.5)
})

test('nave baixa dentro do alcance dispara a caça e o predador avança', () => {
  const random = seeded(5)
  const p = createPredator('ground', [0, 0])
  const prey = { x: 200, y: 30, z: 0 }
  const before = Math.hypot(p.x - prey.x, p.z - prey.z)
  run(p, 3, prey, random)
  assert.equal(p.state, 'hunt')
  assert.ok(Math.hypot(p.x - prey.x, p.z - prey.z) < before - 30)
  assert.ok(p.speed > PREDATOR.lurkSpeed * 3)
})

test('predador de chão desiste quando a nave sobe alto', () => {
  const random = seeded(9)
  const p = createPredator('ground', [0, 0])
  run(p, 2, { x: 150, y: 30, z: 0 }, random)
  assert.equal(p.state, 'hunt')
  run(p, 2, { x: 150, y: PREDATOR.groundHuntAltitude + 20, z: 0 }, random)
  assert.notEqual(p.state, 'hunt')
})

test('predador voador persegue em altitude e acerta com intervalo', () => {
  const random = seeded(13)
  const p = createPredator('air', [0, 0])
  const prey = { x: 40, y: 90, z: 0 }
  run(p, 8, prey, random)
  assert.ok(Math.abs(p.y - prey.y) < 30, `altitude ${p.y}`)
  const target = { x: p.x, y: p.y, z: p.z }
  const first = run(p, 3.2, target, random)
  assert.equal(first, 1, `golpes em 3 s: ${first}`)
  const later = run(p, 12, target, random)
  assert.ok(later >= 2, `golpes em 12 s: ${later}`)
})

test('nave fora do alcance de perda manda o predador de volta à toca', () => {
  const random = seeded(17)
  const p = createPredator('ground', [0, 0])
  run(p, 3, { x: 150, y: 20, z: 0 }, random)
  run(p, 40, { x: 2000, y: 20, z: 0 }, random)
  assert.equal(p.state, 'lurk')
  assert.ok(Math.hypot(p.x, p.z) < PREDATOR.lairRadius * 1.5)
})

test('alvo: nave alcançável vence; senão a presa viva mais próxima; senão nada', () => {
  const p = createPredator('ground', [0, 0])
  const animals = [
    { x: 50, z: 0, alive: true },
    { x: 20, z: 0, alive: false },
    { x: 900, z: 0, alive: true },
  ]
  assert.deepEqual(pickTarget(p, { x: 100, y: 20, z: 0 }, animals), { kind: 'ship', x: 100, y: 20, z: 0 })
  assert.deepEqual(pickTarget(p, { x: 100, y: 200, z: 0 }, animals), { kind: 'animal', index: 0, x: 50, y: 0, z: 0 })
  assert.equal(pickTarget(p, null, [animals[1], animals[2]]), null)
})

test('depois do golpe o predador recua antes de voltar a atacar', () => {
  const random = seeded(21)
  const p = createPredator('air', [0, 0])
  const prey = { x: 30, y: 40, z: 0 }
  run(p, 8, prey, random)
  const atPrey = { x: p.x, y: p.y, z: p.z }
  stepPredator(p, 1 / 60, atPrey, random)
  assert.equal(p.state, 'retreat')
  let distance = 0
  for (let i = 0; i < 60; i++) {
    stepPredator(p, 1 / 60, atPrey, random)
    distance = Math.hypot(p.x - atPrey.x, p.z - atPrey.z)
  }
  assert.ok(distance > 10, `recuou só ${distance}`)
  run(p, PREDATOR.retreatSeconds + 1, atPrey, random)
  assert.equal(p.state, 'hunt')
})
