import { ANYWHERE, type ClipPlan, DESERT, FOREST, ICE, MEADOW, type FlockSpecies, type Habitat, type HerdSpecies, type PredatorSpecies } from './wildlife.ts'

export type Role = 'grazer' | 'villager' | 'flock' | 'swimmer' | 'hunter' | 'sky-hunter'
type HabitatName = 'anywhere' | 'forest' | 'meadow' | 'desert' | 'ice'

export type RosterEntry = {
  id: string
  label: string
  file: string
  role: Role
  count: number
  groups?: number
  length: number
  height?: number
  habitat?: HabitatName
  prey?: string[]
  upright?: boolean
  altitude?: number
  leaps?: boolean
  clips?: ClipPlan
}

export type RosterSpecies =
  | { kind: 'herd'; species: HerdSpecies }
  | { kind: 'flock'; species: FlockSpecies }
  | { kind: 'predator'; species: PredatorSpecies }

const HABITATS: Record<HabitatName, Habitat> = { anywhere: ANYWHERE, forest: FOREST, meadow: MEADOW, desert: DESERT, ice: ICE }
const FLOCK_ALARM_CLIMB = 40
const FISH = { restAltitude: -0.6, alarmAltitude: -3, orbitRadius: 20 }

export function modelUrl(entry: RosterEntry): string {
  return `/models/${entry.file}`
}

export function speciesFromRoster(entry: RosterEntry): RosterSpecies {
  const url = modelUrl(entry)
  const habitat = HABITATS[entry.habitat ?? (entry.role === 'villager' ? 'meadow' : 'anywhere')]
  const height = entry.height
  const orient = !entry.upright && height === undefined
  switch (entry.role) {
    case 'grazer':
    case 'villager':
      return { kind: 'herd', species: { key: entry.id, label: entry.label, url, herds: entry.groups ?? 1, size: entry.count, length: entry.length, height, habitat, orient, clips: entry.clips, village: entry.role === 'villager' } }
    case 'flock': {
      const rest = entry.altitude ?? 55
      return { kind: 'flock', species: { label: entry.label, url, size: entry.count, length: entry.length, shape: { restAltitude: rest, alarmAltitude: rest + FLOCK_ALARM_CLIMB, orbitRadius: 45 }, home: 'land', clips: { ...entry.clips, alwaysMoving: true } } }
    }
    case 'swimmer':
      return { kind: 'flock', species: { label: entry.label, url, size: entry.count, length: entry.length, shape: FISH, home: 'lake', clips: { ...entry.clips, alwaysMoving: true }, breach: entry.leaps ? { height: entry.length, seconds: 2, every: 14 } : undefined } }
    case 'hunter':
    case 'sky-hunter':
      return { kind: 'predator', species: { label: entry.label, url, kind: entry.role === 'hunter' ? 'ground' : 'air', count: entry.count, length: entry.length, height, prey: entry.prey ?? [], habitat, orient, clips: entry.clips } }
  }
}

type Extra = Partial<Omit<RosterEntry, 'id' | 'label' | 'file' | 'role' | 'count' | 'length'>>
const entry = (dir: string) => (id: string, label: string, role: Role, count: number, length: number, extra: Extra = {}): RosterEntry => ({ id, label, file: `${dir}/${id}.glb`, role, count, length, ...extra })

const monster = entry('monsters')
const machine = entry('machines')
const adventurer = entry('adventurers')

// chibi bipeds are sized by height and face +Z as exported, so the quadruped heading guess is skipped
const biped = (height: number, extra: Extra = {}): Extra => ({ upright: true, height, ...extra })
const KAYKIT: ClipPlan = { idle: 'Idle', walk: 'Walking_A', run: 'Running_A' }

export const MONSTERS: RosterEntry[] = [
  monster('bat', 'morcegos', 'flock', 8, 1.4, { altitude: 48 }),
  monster('bee', 'abelhas gigantes', 'flock', 6, 1.0, { altitude: 30 }),
  monster('yellow-dragon', 'dragão amarelo', 'sky-hunter', 1, 5, { prey: ['pig', 'chicken', 'deer'] }),
  monster('pig', 'porcos', 'grazer', 6, 1.6, biped(1.2, { groups: 2, habitat: 'meadow' })),
  monster('chicken', 'galinhas', 'grazer', 6, 1.0, biped(0.9, { groups: 2, habitat: 'meadow' })),
  monster('deer', 'cervos', 'grazer', 5, 2.0, biped(1.6, { habitat: 'forest' })),
  monster('panda', 'pandas', 'grazer', 3, 1.8, biped(1.6, { habitat: 'forest' })),
  monster('penguin', 'pinguins', 'grazer', 6, 1.2, biped(1.1, { habitat: 'meadow' })),
  monster('mushroom', 'cogumelos andantes', 'grazer', 5, 1.0, biped(1.0, { habitat: 'forest' })),
  monster('cactus', 'cactos andantes', 'grazer', 4, 1.4, biped(1.3, { habitat: 'meadow' })),
  monster('ghost', 'fantasmas', 'grazer', 4, 1.4, biped(1.4, { habitat: 'forest' })),
  monster('alien', 'visitantes', 'grazer', 3, 1.2, biped(1.3, { habitat: 'meadow' })),
  monster('alien-tall', 'visitantes altos', 'grazer', 2, 1.8, biped(2.0, { habitat: 'meadow' })),
  monster('walking-tree', 'árvores andantes', 'grazer', 3, 3.0, biped(3.0, { habitat: 'forest' })),
  monster('cyclops', 'ciclopes', 'hunter', 1, 3.0, biped(3.2, { prey: ['pig', 'deer', 'panda'], habitat: 'meadow' })),
  monster('demon', 'demônios', 'hunter', 2, 2.2, biped(2.4, { prey: ['chicken', 'ghost'], habitat: 'forest' })),
  monster('green-demon', 'demônios verdes', 'hunter', 2, 2.0, biped(2.2, { prey: ['mushroom', 'alien'], habitat: 'meadow' })),
  monster('yeti', 'yetis', 'hunter', 1, 3.0, biped(3.0, { prey: ['deer', 'penguin'], habitat: 'forest' })),
  monster('skull', 'caveiras', 'hunter', 2, 1.2, biped(1.2, { prey: ['chicken', 'mushroom'], habitat: 'forest' })),
  monster('crab', 'caranguejos', 'swimmer', 6, 1.2),
  monster('cthulhu', 'ancião do lago', 'swimmer', 1, 6, { leaps: true }),
]

export const MACHINES: RosterEntry[] = []

export const ADVENTURERS: RosterEntry[] = [
  adventurer('knight', 'cavaleiros', 'villager', 3, 1.8, biped(1.8, { clips: KAYKIT })),
  adventurer('mage', 'magos', 'villager', 2, 1.8, biped(1.8, { clips: KAYKIT })),
  adventurer('rogue', 'ladinos', 'villager', 3, 1.8, biped(1.8, { clips: KAYKIT })),
  adventurer('barbarian', 'bárbaros', 'villager', 3, 1.8, biped(1.9, { clips: KAYKIT })),
  adventurer('ranger', 'arqueiros', 'villager', 3, 1.8, biped(1.8, { clips: KAYKIT })),
  adventurer('skeleton-warrior', 'esqueletos guerreiros', 'hunter', 3, 1.8, biped(1.9, { clips: KAYKIT, prey: ['knight', 'barbarian'], habitat: 'anywhere' })),
  adventurer('skeleton-minion', 'esqueletos', 'hunter', 4, 1.6, biped(1.7, { clips: KAYKIT, prey: ['rogue', 'ranger'], habitat: 'forest' })),
  adventurer('skeleton-rogue', 'esqueletos ladinos', 'hunter', 2, 1.8, biped(1.8, { clips: KAYKIT, prey: ['ranger', 'mage'], habitat: 'desert' })),
  adventurer('skeleton-mage', 'esqueletos magos', 'hunter', 1, 1.8, biped(1.8, { clips: KAYKIT, prey: ['mage', 'knight'], habitat: 'ice' })),
]

export const ROSTERS = { monsters: MONSTERS, machines: MACHINES, adventurers: ADVENTURERS } as const
export type RosterName = keyof typeof ROSTERS
