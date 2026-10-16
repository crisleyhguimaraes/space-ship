import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Vector3 } from 'three'
import { SYSTEM, cometPosition, orbitPosition } from './system.ts'

test('órbita circular mantém o raio e completa uma volta no período', () => {
  const orbit = { radius: 1000, period: 600, phase: 0.3, inclination: 0.1 }
  const out = new Vector3()
  for (const t of [0, 100, 250, 599]) {
    orbitPosition(orbit, t, out)
    assert.ok(Math.abs(out.length() - 1000) < 1e-6, `raio em ${t}`)
  }
  const start = orbitPosition(orbit, 0, new Vector3())
  const lap = orbitPosition(orbit, 600, new Vector3())
  assert.ok(start.distanceTo(lap) < 1e-6)
})

test('cometa passa perto do sol no periélio e longe no afélio', () => {
  const comet = { perihelion: 900, aphelion: 11000, period: 1200, phase: 0, inclination: 0.4 }
  const near = cometPosition(comet, 0, new Vector3()).length()
  const far = cometPosition(comet, 600, new Vector3()).length()
  assert.ok(Math.abs(near - 900) < 1)
  assert.ok(Math.abs(far - 11000) < 1)
})

test('o catálogo tem dez planetas com órbitas crescentes e nomes únicos', () => {
  assert.equal(SYSTEM.length, 10)
  const names = new Set(SYSTEM.map((p) => p.name))
  assert.equal(names.size, 10)
  for (let i = 1; i < SYSTEM.length; i++) assert.ok(SYSTEM[i].orbit.radius > SYSTEM[i - 1].orbit.radius)
  assert.ok(SYSTEM.filter((p) => p.landable).length >= 1)
})
