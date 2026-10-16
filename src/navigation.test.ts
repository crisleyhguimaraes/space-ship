import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NAV, avoidProfile, beltProfile, gravityPull } from './navigation.ts'

test('a gravidade só puxa dentro do alcance e cresce ao chegar perto, sem passar do teto', () => {
  const radius = 50
  assert.equal(gravityPull(radius * NAV.pullRadii + 1, radius), 0)
  const far = gravityPull(radius * 4, radius)
  const near = gravityPull(radius * 0.5, radius)
  assert.ok(far > 0 && near > far)
  assert.ok(gravityPull(0, radius) <= NAV.pullMax + 1e-9)
})

test('o desvio avisa antes de empurrar e empurra mais forte quanto mais perto', () => {
  const radius = 40
  assert.deepEqual(avoidProfile(5000, radius), { warn: 0, push: 0 })
  const alertOnly = avoidProfile(NAV.avoidMin * 1.5, radius)
  assert.ok(alertOnly.warn > 0 && alertOnly.push === 0)
  const close = avoidProfile(NAV.avoidMin * 0.4, radius)
  const closer = avoidProfile(NAV.avoidMin * 0.1, radius)
  assert.ok(close.push > 0 && closer.push > close.push && closer.push <= 1)
})

test('corpos grandes avisam de mais longe que corpos pequenos', () => {
  assert.ok(avoidProfile(300, 150).warn > avoidProfile(300, 20).warn)
})

test('o cinturão avisa na borda e empurra para fora do plano quando se está dentro', () => {
  const middle = (5400 + 5900) / 2
  assert.equal(beltProfile(0, 0).warn, 0)
  assert.equal(beltProfile(middle, 0).warn, 1)
  assert.ok(beltProfile(middle, 10).push > 0)
  assert.equal(beltProfile(middle, 600).push, 0)
  assert.ok(beltProfile(5400 - 100, 0).warn > 0 && beltProfile(5400 - 100, 0).push === 0)
})
