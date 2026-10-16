import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DAY_SECONDS, daylightAt } from './daylight.ts'

test('meio-dia tem o sol no alto e meia-noite abaixo do horizonte', () => {
  assert.ok(daylightAt(0.5).elevation > 1.2)
  assert.ok(daylightAt(0).elevation < -0.3)
  assert.ok(daylightAt(1).elevation < -0.3)
})

test('amanhecer e entardecer têm o sol rente ao horizonte', () => {
  assert.ok(Math.abs(daylightAt(0.25).elevation) < 0.2)
  assert.ok(Math.abs(daylightAt(0.75).elevation) < 0.2)
})

test('luz e céu mudam de forma contínua ao longo do dia', () => {
  let previous = daylightAt(0)
  for (let t = 0.01; t <= 1; t += 0.01) {
    const now = daylightAt(t)
    assert.ok(Math.abs(now.sunIntensity - previous.sunIntensity) < 0.3, `salto de luz em ${t}`)
    for (let c = 0; c < 3; c++) assert.ok(Math.abs(now.sky[c] - previous.sky[c]) < 0.15, `salto de céu em ${t}`)
    previous = now
  }
})

test('de noite a luz do sol some e as estrelas aparecem', () => {
  const night = daylightAt(0.02)
  const noon = daylightAt(0.5)
  assert.ok(night.sunIntensity < 0.15)
  assert.ok(night.stars > 0.8)
  assert.ok(noon.stars < 0.05)
  assert.ok(noon.sunIntensity > 2)
  assert.ok(DAY_SECONDS > 0)
})
