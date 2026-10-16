import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FLOCK, createFlock, stepFlock } from './flock.ts'

const dt = 1 / 60

function run(flock: ReturnType<typeof createFlock>, seconds: number, threat: { x: number; z: number } | null) {
  for (let i = 0; i < seconds * 60; i++) stepFlock(flock, dt, threat)
}

const rest = { restAltitude: 2, alarmAltitude: 30, orbitRadius: 10 }

test('em paz o bando orbita a casa na altitude de descanso', () => {
  const flock = createFlock(6, [100, 100], rest)
  run(flock, 20, null)
  assert.ok(Math.hypot(flock.anchor[0] - 100, flock.anchor[1] - 100) < 1)
  assert.ok(Math.abs(flock.altitude - rest.restAltitude) < 0.5)
  for (let i = 0; i < flock.count; i++) {
    const d = Math.hypot(flock.pos[i * 2] - 100, flock.pos[i * 2 + 1] - 100)
    assert.ok(d > rest.orbitRadius * 0.4 && d < rest.orbitRadius * 1.6, `ave ${i} a ${d}`)
  }
})

test('nave perto levanta o bando e afasta a órbita', () => {
  const flock = createFlock(6, [0, 0], rest)
  run(flock, 4, { x: 20, z: 0 })
  assert.ok(flock.altitude > rest.alarmAltitude * 0.6, `altitude ${flock.altitude}`)
  assert.ok(flock.anchor[0] < -20, `âncora em x ${flock.anchor[0]}`)
})

test('passado o susto o bando volta para casa e pousa', () => {
  const flock = createFlock(6, [0, 0], rest)
  run(flock, 4, { x: 20, z: 0 })
  run(flock, FLOCK.calmSeconds + 25, null)
  assert.ok(Math.hypot(flock.anchor[0], flock.anchor[1]) < 5)
  assert.ok(Math.abs(flock.altitude - rest.restAltitude) < 1)
})
