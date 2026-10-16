import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pickClips } from './keep-clips.ts'

test('mantém só os clipes pedidos, já sem o prefixo da armadura', () => {
  assert.deepEqual(pickClips(['CharacterArmature|Idle', 'CharacterArmature|Walk', 'CharacterArmature|Death'], ['Idle', 'Walk']), ['Idle', 'Walk', null])
})

test('o mesmo clipe exportado com e sem prefixo fica uma vez só', () => {
  assert.deepEqual(pickClips(['Idle', 'Walk', 'AnimalArmature|Idle', 'AnimalArmature|Walk'], ['Idle', 'Walk']), ['Idle', 'Walk', null, null])
})

test('sem lista, nenhum clipe é mantido', () => {
  assert.deepEqual(pickClips(['Idle', 'Walk'], []), [null, null])
})
