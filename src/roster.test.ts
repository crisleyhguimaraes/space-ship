import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ROSTERS, speciesFromRoster } from './roster.ts'

test('todo elenco tem ids únicos, arquivos únicos e tamanhos positivos', () => {
  for (const [name, roster] of Object.entries(ROSTERS)) {
    assert.equal(new Set(roster.map((r) => r.id)).size, roster.length, `ids repetidos em ${name}`)
    assert.equal(new Set(roster.map((r) => r.file)).size, roster.length, `arquivos repetidos em ${name}`)
    for (const r of roster) assert.ok(r.length > 0 && r.count > 0, r.id)
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

test('o elenco de animê cobre pelo menos quinze séries, com herói, vilão e criatura em cada', () => {
  const franchises = new Set(ROSTERS.anime.map((r) => r.file.split('/')[1]))
  assert.ok(franchises.size >= 15)
  for (const f of franchises) {
    const roles = new Set(ROSTERS.anime.filter((r) => r.file.split('/')[1] === f).map((r) => r.role))
    assert.ok(roles.has('villager') && (roles.has('hunter') || roles.has('sky-hunter')), f)
  }
})

test('cada papel vira o tipo de espécie certo', () => {
  const kinds = new Set(ROSTERS.pokemon.map((r) => speciesFromRoster(r).kind))
  assert.deepEqual([...kinds].sort(), ['flock', 'herd', 'predator'])
  const snorlax = ROSTERS.pokemon.find((r) => r.id === 'snorlax')!
  assert.equal(speciesFromRoster(snorlax).kind, 'herd')
})
