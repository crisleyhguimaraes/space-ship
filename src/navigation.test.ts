import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NAV, avoidProfile, beltProfile, gravityPull, shellClearance, slideDirection, warnRange } from './navigation.ts'

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
  const alertOnly = avoidProfile(NAV.avoidMin * 1.2, radius)
  assert.ok(alertOnly.warn > 0 && alertOnly.push === 0)
  const close = avoidProfile(NAV.avoidMin * 0.4, radius)
  const closer = avoidProfile(NAV.avoidMin * 0.1, radius)
  assert.ok(close.push > 0 && closer.push > close.push && closer.push <= 1)
})

test('corpos grandes avisam de mais longe que corpos pequenos', () => {
  assert.ok(avoidProfile(120, 150).warn > avoidProfile(120, 20).warn)
})

test('o cinturão avisa na borda e empurra para fora do plano quando se está dentro', () => {
  const middle = (5400 + 5900) / 2
  assert.equal(beltProfile(0, 0).warn, 0)
  assert.equal(beltProfile(middle, 0).warn, 1)
  assert.ok(beltProfile(middle, 10).push > 0)
  assert.equal(beltProfile(middle, 600).push, 0)
  assert.ok(beltProfile(5400 - 100, 0).warn > 0 && beltProfile(5400 - 100, 0).push === 0)
})

test('o desvio contorna a superfície: tira só a parte da direção que aponta para o corpo', () => {
  const outward = { x: 0, y: 0, z: 1 }
  const oblique = slideDirection({ x: 0.6, y: 0, z: -0.8 }, outward, { x: 0, y: 1, z: 0 })
  assert.ok(Math.abs(oblique.z) < 1e-9 && oblique.x > 0.99, 'desliza pela tangente na direção em que já ia')
  const away = slideDirection({ x: 0, y: 0, z: 1 }, outward, { x: 0, y: 1, z: 0 })
  assert.deepEqual(away, { x: 0, y: 0, z: 1 })
})

test('de frente não há tangente, então a nave abre pelo lado sugerido', () => {
  const head = slideDirection({ x: 0, y: 0, z: -1 }, { x: 0, y: 0, z: 1 }, { x: 0, y: 1, z: 0 })
  assert.ok(Math.abs(head.z) < 1e-9 && Math.abs(Math.hypot(head.x, head.y, head.z) - 1) < 1e-9)
  assert.ok(head.y > 0.99)
})

test('a camada de segurança acompanha o tamanho do corpo e nunca some', () => {
  assert.equal(shellClearance(5), NAV.shellMin)
  assert.ok(shellClearance(150) > shellClearance(40))
  assert.ok(shellClearance(150) < avoidProfileRange(150))
})

function avoidProfileRange(radius: number): number {
  return Math.max(NAV.avoidMin, radius * NAV.avoidRadii)
}

test('o desvio é um arco: contorna e, livre o caminho, volta a mirar no destino original', () => {
  const body = { x: 0, z: 0, r: 40 }
  const goal = { x: 0, z: -3000 }
  let pos = { x: 0, z: 400 }
  let heading = { x: 0, y: 0, z: -1 }
  let closest = Infinity
  const speed = 90
  const dt = 1 / 30
  for (let i = 0; i < 30 * 70; i++) {
    const outward = { x: pos.x - body.x, y: 0, z: pos.z - body.z }
    const d = Math.hypot(outward.x, outward.z)
    closest = Math.min(closest, d - body.r)
    outward.x /= d
    outward.z /= d
    const toGoal = { x: goal.x - pos.x, y: 0, z: goal.z - pos.z }
    const gl = Math.hypot(toGoal.x, toGoal.z)
    toGoal.x /= gl
    toGoal.z /= gl
    const wanted = d - body.r < warnRange(body.r) ? slideDirection({ ...toGoal }, outward, { x: 1, y: 0, z: 0 }) : toGoal
    const turn = Math.min(1, 4 * dt)
    heading = { x: heading.x + (wanted.x - heading.x) * turn, y: 0, z: heading.z + (wanted.z - heading.z) * turn }
    const l = Math.hypot(heading.x, heading.z)
    heading.x /= l
    heading.z /= l
    pos = { x: pos.x + heading.x * speed * dt, z: pos.z + heading.z * speed * dt }
    if (gl < 60) break
  }
  assert.ok(closest > 5, `passou a ${closest} da superfície`)
  assert.ok(Math.hypot(pos.x - goal.x, pos.z - goal.z) < 120, `terminou longe do destino: ${Math.round(pos.x)},${Math.round(pos.z)}`)
})
