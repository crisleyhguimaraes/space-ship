import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { ROSTERS, type Role, modelUrl, speciesFromRoster } from './roster.ts'

const ROLES: Role[] = ['grazer', 'villager', 'flock', 'swimmer', 'hunter', 'sky-hunter']
const ALL = Object.values(ROSTERS).flat()

// the JSON chunk of a .glb starts at byte 20 and its length sits at byte 12
function clipNames(file: string): string[] {
  const bytes = readFileSync(file)
  const json = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12))) as { animations?: { name: string }[] }
  return (json.animations ?? []).map((a) => a.name)
}

test('todo elenco tem ids únicos, arquivos únicos e tamanhos positivos', () => {
  for (const [name, roster] of Object.entries(ROSTERS)) {
    assert.equal(new Set(roster.map((r) => r.id)).size, roster.length, `ids repetidos em ${name}`)
    assert.equal(new Set(roster.map((r) => r.file)).size, roster.length, `arquivos repetidos em ${name}`)
    for (const r of roster) assert.ok(r.length > 0 && r.count > 0, r.id)
  }
})

test('todo arquivo do elenco existe em public/models, senão quem clona vê um planeta vazio', () => {
  for (const r of ALL) assert.ok(existsSync(`public${modelUrl(r)}`), `falta ${modelUrl(r)}`)
})

test('todo clipe pedido pelo elenco existe no arquivo, senão o bicho fica parado', () => {
  for (const r of ALL.filter((x) => x.clips)) {
    const names = clipNames(`public${modelUrl(r)}`)
    for (const clip of [r.clips!.idle, r.clips!.walk, r.clips!.run].filter(Boolean)) assert.ok(names.includes(clip!), `${r.file} não tem o clipe ${clip}`)
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
    assert.ok(roster.length >= 20, `${name} tem só ${roster.length} espécies`)
  }
})

test('só o planeta com vilas tem aldeões', () => {
  assert.ok(ROSTERS.adventurers.some((r) => r.role === 'villager'))
  assert.ok(!ROSTERS.monsters.some((r) => r.role === 'villager'))
  assert.ok(!ROSTERS.creatures.some((r) => r.role === 'villager'))
})

test('cada papel vira o tipo de espécie certo', () => {
  const kinds = ROLES.map((role) => speciesFromRoster(ALL.find((r) => r.role === role)!).kind)
  assert.deepEqual(kinds, ['herd', 'herd', 'flock', 'flock', 'predator', 'predator'])
})

test('nenhum bicho do elenco passa pelo endireitamento automático, porque os packs já exportam virados para a frente', () => {
  for (const r of ALL) {
    const resolved = speciesFromRoster(r)
    if (resolved.kind !== 'flock') assert.ok(!resolved.species.orient, r.id)
  }
})
