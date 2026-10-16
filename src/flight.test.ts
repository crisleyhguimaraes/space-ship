import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FLIGHT, createFlight, forwardOf, stepFlight, type FlightInput } from './flight.ts'

const idle: FlightInput = { throttle: 0, roll: 0, yaw: 0, pitch: 0, boost: false }
const dt = 1 / 60

test('acelerar move a nave para frente no eixo -Z local', () => {
  const s = createFlight()
  for (let i = 0; i < 60; i++) stepFlight(s, { ...idle, throttle: 1 }, dt)
  assert.ok(s.speed > 0)
  assert.ok(s.position.z < 0)
  assert.equal(s.position.x, 0)
})

test('velocidade satura no máximo e o boost eleva o teto', () => {
  const s = createFlight()
  for (let i = 0; i < 600; i++) stepFlight(s, { ...idle, throttle: 1 }, dt)
  assert.equal(s.speed, FLIGHT.maxSpeed)
  for (let i = 0; i < 600; i++) stepFlight(s, { ...idle, throttle: 1, boost: true }, dt)
  assert.equal(s.speed, FLIGHT.maxSpeed * FLIGHT.boostMultiplier)
})

test('sem acelerador a velocidade decai até parar', () => {
  const s = createFlight()
  s.speed = 50
  for (let i = 0; i < 600; i++) stepFlight(s, idle, dt)
  assert.ok(s.speed < 0.5)
})

test('frear nunca inverte o sentido', () => {
  const s = createFlight()
  s.speed = 5
  for (let i = 0; i < 120; i++) stepFlight(s, { ...idle, throttle: -1 }, dt)
  assert.equal(s.speed, 0)
})

test('guinada de 90 graus aponta a frente para -X', () => {
  const s = createFlight()
  stepFlight(s, { ...idle, yaw: Math.PI / 2 }, dt)
  const f = forwardOf(s)
  assert.ok(Math.abs(f.x + 1) < 1e-6)
  assert.ok(Math.abs(f.z) < 1e-6)
})

test('rolagem não muda a direção de frente', () => {
  const s = createFlight()
  for (let i = 0; i < 30; i++) stepFlight(s, { ...idle, roll: 1 }, dt)
  const f = forwardOf(s)
  assert.ok(Math.abs(f.z + 1) < 1e-6)
})
