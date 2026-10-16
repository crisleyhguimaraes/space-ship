import { test } from 'node:test'
import assert from 'node:assert/strict'
import { WEATHER, createWeather, stepWeather } from './weather.ts'

function seeded(seed = 1) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function run(w: ReturnType<typeof createWeather>, seconds: number, random: () => number) {
  let flashes = 0
  for (let i = 0; i < seconds * 10; i++) if (stepWeather(w, 0.1, random).flash) flashes++
  return flashes
}

test('começa limpo, sem chuva e sem nuvens pesadas', () => {
  const w = createWeather(seeded(1))
  const out = stepWeather(w, 0.1, seeded(2))
  assert.equal(w.state, 'clear')
  assert.equal(out.rain, 0)
  assert.ok(out.clouds < 0.4)
})

test('o tempo fecha, chove, troveja e abre de novo', () => {
  const random = seeded(3)
  const w = createWeather(random)
  const seen = new Set<string>()
  let flashes = 0
  for (let i = 0; i < 900 * 10; i++) {
    const out = stepWeather(w, 0.1, random)
    seen.add(w.state)
    if (out.flash) flashes++
    if (w.state === 'rain' || w.state === 'storm') assert.ok(out.rain > 0.2)
    if (w.state === 'clear') assert.equal(out.rain, 0)
  }
  for (const state of ['clear', 'clouding', 'rain', 'storm', 'clearing']) assert.ok(seen.has(state), `faltou ${state}`)
  assert.ok(flashes > 3, `raios ${flashes}`)
})

test('raios só acontecem na tempestade e respeitam o intervalo', () => {
  const random = seeded(5)
  const w = createWeather(random)
  w.state = 'storm'
  w.remaining = 60
  w.rain = 1
  w.clouds = 1
  const flashes = run(w, 60, random)
  assert.ok(flashes >= 60 / WEATHER.flashMaxGap - 1 && flashes <= 60 / WEATHER.flashMinGap + 1, `raios ${flashes}`)
  w.state = 'clear'
  w.remaining = 60
  assert.equal(run(w, 30, random), 0)
})
