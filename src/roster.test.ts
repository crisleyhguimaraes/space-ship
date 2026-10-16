import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { ROSTERS, type Role, modelUrl, speciesFromRoster } from './roster.ts'

const ROLES: Role[] = ['grazer', 'villager', 'flock', 'swimmer', 'hunter', 'sky-hunter']

test('todo elenco tem ids únicos, arquivos únicos e tamanhos positivos', () => {
  for (const [name, roster] of Object.entries(ROSTERS)) {
    assert.equal(new Set(roster.map((r) => r.id)).size, roster.length, `ids repetidos em ${name}`)
    assert.equal(new Set(roster.map((r) => r.file)).size, roster.length, `arquivos repetidos em ${name}`)
    for (const r of roster) assert.ok(r.length > 0 && r.count > 0, r.id)
  }
})

test('todo arquivo do elenco existe em public/models, senão quem clona vê um planeta vazio', () => {
  for (const roster of Object.values(ROSTERS)) {
    for (const r of roster) assert.ok(existsSync(`public${modelUrl(r)}`), `falta ${modelUrl(r)}`)
  }
})

test('todo caçador só persegue espécies que existem no mesmo elenco', () => {
  for (const [name, roster] of Object.entries(ROSTERS)) {
    const grazers = new Set(roster.filter((r) => r.role === 'grazer' || r.role === 'villager').map((r) => r.id))
    for (const r of roster.filter((x) => x.role === 'hunter' || x.role === 'sky-hunter')) {
      assert.ok((r.prey ?? []).length > 0, `${r.id} sem presa`)
      for (const prey of r.prey ?? []) assert.ok(grazers.has(prey), `${name}: ${r.id} caça ${prey}, que não existe`)
    }
  }
})

test('cada planeta tem bichos no chão, no ar, na água e caçadores', () => {
  for (const [name, roster] of Object.entries(ROSTERS)) {
    const roles = new Set(roster.map((r) => r.role))
    for (const role of ['grazer', 'flock', 'swimmer', 'hunter', 'sky-hunter'] as const) assert.ok(roles.has(role), `${name} sem ${role}`)
    assert.ok(roster.length >= 12, `${name} tem só ${roster.length} espécies`)
  }
})

test('só o planeta com vilas tem aldeões', () => {
  assert.ok(ROSTERS.adventurers.some((r) => r.role === 'villager'))
  assert.ok(!ROSTERS.monsters.some((r) => r.role === 'villager'))
  assert.ok(!ROSTERS.machines.some((r) => r.role === 'villager'))
})

test('cada papel vira o tipo de espécie certo', () => {
  const sample = (role: Role) => ROSTERS.adventurers.find((r) => r.role === role) ?? ROSTERS.monsters.find((r) => r.role === role)!
  const kinds = ROLES.map((role) => speciesFromRoster(sample(role)).kind)
  assert.deepEqual(kinds, ['herd', 'herd', 'flock', 'flock', 'predator', 'predator'])
})

test('aldeão em pé e caçador no ar não passam pelo endireitamento automático', () => {
  const villager = ROSTERS.adventurers.find((r) => r.role === 'villager')!
  const resolved = speciesFromRoster(villager)
  assert.equal(resolved.kind, 'herd')
  if (resolved.kind === 'herd') assert.equal(resolved.species.orient, false)
})
