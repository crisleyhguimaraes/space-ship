import { test } from 'node:test'
import assert from 'node:assert/strict'
import { engineTone } from './audio.ts'

test('o foguete abre o grave, engrossa o sub e só estala sob potência', () => {
  const idle = engineTone(0)
  const cruise = engineTone(0.5)
  const boost = engineTone(1)
  assert.ok(idle.gain < 0.08)
  assert.ok(cruise.gain > idle.gain && boost.gain > cruise.gain)
  assert.ok(cruise.rumble > idle.rumble && boost.rumble > cruise.rumble)
  assert.ok(boost.rumble < 400)
  assert.ok(boost.sub > idle.sub)
  assert.ok(idle.crackle === 0 && cruise.crackle < boost.crackle)
})
