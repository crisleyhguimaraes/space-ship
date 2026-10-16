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
  switch (entry.role) {
    case 'grazer':
    case 'villager':
      return { kind: 'herd', species: { key: entry.id, label: entry.label, url, herds: entry.groups ?? 1, size: entry.count, length: entry.length, height, habitat, clips: entry.clips, village: entry.role === 'villager' } }
    case 'flock': {
      const rest = entry.altitude ?? 55
      return { kind: 'flock', species: { label: entry.label, url, size: entry.count, length: entry.length, shape: { restAltitude: rest, alarmAltitude: rest + FLOCK_ALARM_CLIMB, orbitRadius: 45 }, home: 'land', clips: { ...entry.clips, alwaysMoving: true } } }
    }
    case 'swimmer':
      return { kind: 'flock', species: { label: entry.label, url, size: entry.count, length: entry.length, shape: FISH, home: 'lake', clips: { ...entry.clips, alwaysMoving: true }, breach: entry.leaps ? { height: entry.length, seconds: 2, every: 14 } : undefined } }
    case 'hunter':
    case 'sky-hunter':
      return { kind: 'predator', species: { label: entry.label, url, kind: entry.role === 'hunter' ? 'ground' : 'air', count: entry.count, length: entry.length, height, prey: entry.prey ?? [], habitat, clips: entry.clips } }
  }
}

type Extra = Partial<Omit<RosterEntry, 'id' | 'label' | 'file' | 'role' | 'count' | 'length'>>
const entry = (dir: string) => (id: string, label: string, role: Role, count: number, length: number, extra: Extra = {}): RosterEntry => ({ id, label, file: `${dir}/${id}.glb`, role, count, length, ...extra })

const monster = entry('monsters')
const creature = entry('creatures')
const adventurer = entry('adventurers')

// Quaternius and KayKit export every model facing +Z, so none needs the heading guess;
// bipeds are sized by height, everything else by length
const STROLL: ClipPlan = { idle: 'Idle', walk: 'Walk' }
const STRIDE: ClipPlan = { idle: 'Idle', walk: 'Walk', run: 'Run' }
const HOVER: ClipPlan = { idle: 'Flying_Idle', walk: 'Fast_Flying' }
const WINGS: ClipPlan = { walk: 'Fast_Flying' }
const HOOVES: ClipPlan = { idle: 'Idle', walk: 'Walk', run: 'Gallop' }
const SWIM: ClipPlan = { walk: 'Swimming_Normal', run: 'Swimming_Fast' }
const KAYKIT: ClipPlan = { idle: 'Idle', walk: 'Walking_A', run: 'Running_A' }
const dinosaur = (name: string): ClipPlan => ({ idle: `${name}_Idle`, walk: `${name}_Walk`, run: `${name}_Run` })

export const MONSTERS: RosterEntry[] = [
  monster('bat', 'morcegos', 'flock', 8, 1.4, { altitude: 48 }),
  monster('bee', 'abelhas gigantes', 'flock', 6, 1.0, { altitude: 30 }),
  monster('yellow-dragon', 'dragão amarelo', 'sky-hunter', 1, 5, { prey: ['pig', 'chicken', 'deer'] }),
  monster('pig', 'porcos', 'grazer', 6, 1.6, { height: 1.2, groups: 2, habitat: 'meadow' }),
  monster('chicken', 'galinhas', 'grazer', 6, 1.0, { height: 0.9, groups: 2, habitat: 'meadow' }),
  monster('deer', 'cervos', 'grazer', 5, 2.0, { height: 1.6, habitat: 'forest' }),
  monster('panda', 'pandas', 'grazer', 3, 1.8, { height: 1.6, habitat: 'forest' }),
  monster('penguin', 'pinguins', 'grazer', 6, 1.2, { height: 1.1, habitat: 'meadow' }),
  monster('mushroom', 'cogumelos andantes', 'grazer', 5, 1.0, { height: 1.0, habitat: 'forest' }),
  monster('cactus', 'cactos andantes', 'grazer', 4, 1.4, { height: 1.3, habitat: 'meadow' }),
  monster('ghost', 'fantasmas', 'grazer', 4, 1.4, { height: 1.4, habitat: 'forest' }),
  monster('alien', 'visitantes', 'grazer', 3, 1.2, { height: 1.3, habitat: 'meadow' }),
  monster('alien-tall', 'visitantes altos', 'grazer', 2, 1.8, { height: 2.0, habitat: 'meadow' }),
  monster('walking-tree', 'árvores andantes', 'grazer', 3, 3.0, { height: 3.0, habitat: 'forest' }),
  monster('cyclops', 'ciclopes', 'hunter', 1, 3.0, { height: 3.2, prey: ['pig', 'deer', 'panda'], habitat: 'meadow' }),
  monster('demon', 'demônios', 'hunter', 2, 2.2, { height: 2.4, prey: ['chicken', 'ghost'], habitat: 'forest' }),
  monster('green-demon', 'demônios verdes', 'hunter', 2, 2.0, { height: 2.2, prey: ['mushroom', 'alien'], habitat: 'meadow' }),
  monster('yeti', 'yetis', 'hunter', 1, 3.0, { height: 3.0, prey: ['deer', 'penguin'], habitat: 'forest' }),
  monster('skull', 'caveiras', 'hunter', 2, 1.2, { height: 1.2, prey: ['chicken', 'mushroom'], habitat: 'forest' }),
  monster('crab', 'caranguejos', 'swimmer', 6, 1.2),
  monster('cthulhu', 'ancião do lago', 'swimmer', 1, 6, { leaps: true }),
]

// creatures that evolve live beside their evolved form, and pilots in mechs hunt them
export const CREATURES: RosterEntry[] = [
  creature('mushnub', 'mushnubs', 'grazer', 6, 1, { height: 0.9, groups: 2, habitat: 'forest', clips: STROLL }),
  creature('mushnub-evolved', 'mushnubs evoluídos', 'grazer', 2, 1.6, { height: 1.6, habitat: 'forest', clips: STROLL }),
  creature('green-blob', 'gosmas', 'grazer', 6, 1, { height: 0.8, groups: 2, habitat: 'meadow', clips: STROLL }),
  creature('spiky-blob', 'gosmas-espinho', 'grazer', 3, 1.2, { height: 1.1, habitat: 'meadow', clips: STROLL }),
  creature('cactoro', 'cactoros', 'grazer', 5, 1.2, { height: 1.2, habitat: 'desert', clips: STROLL }),
  creature('birb', 'birbs', 'grazer', 5, 1, { height: 0.9, habitat: 'meadow', clips: STROLL }),
  creature('bunny', 'coelhões', 'grazer', 4, 1.6, { height: 1.6, habitat: 'meadow', clips: STRIDE }),
  creature('frog', 'sapos', 'grazer', 4, 1.4, { height: 1.4, habitat: 'meadow', clips: STRIDE }),
  creature('dino', 'dinos', 'grazer', 3, 2.2, { height: 2.2, habitat: 'desert', clips: STRIDE }),
  creature('alpaking', 'alpakings', 'grazer', 3, 1.6, { height: 1.6, habitat: 'meadow', clips: HOVER }),
  creature('alpaking-evolved', 'alpaking evoluído', 'grazer', 1, 2.4, { height: 2.4, habitat: 'meadow', clips: HOVER }),
  creature('goleling', 'golelings', 'grazer', 3, 1.4, { height: 1.4, habitat: 'desert', clips: HOVER }),
  creature('goleling-evolved', 'goleling evoluído', 'grazer', 1, 2.4, { height: 2.4, habitat: 'desert', clips: HOVER }),
  creature('armabee', 'armabelhas', 'flock', 6, 1.2, { altitude: 30, clips: WINGS }),
  creature('armabee-evolved', 'armabelhas evoluídas', 'flock', 2, 1.8, { altitude: 40, clips: WINGS }),
  creature('hywirl', 'hywirls', 'flock', 4, 1.6, { altitude: 55, clips: WINGS }),
  creature('glub', 'glubs', 'swimmer', 6, 1.2, { clips: WINGS }),
  creature('glub-evolved', 'glub evoluído', 'swimmer', 1, 2.4, { leaps: true, clips: WINGS }),
  creature('squidle', 'squidles', 'swimmer', 3, 1.6, { clips: WINGS }),
  creature('blue-demon', 'demônios azuis', 'hunter', 2, 2.2, { height: 2.2, prey: ['dino', 'cactoro'], habitat: 'desert', clips: STRIDE }),
  creature('mech-bee', 'mech-abelha', 'hunter', 1, 3.2, { height: 3.2, prey: ['green-blob', 'birb'], habitat: 'meadow', clips: STRIDE }),
  creature('mech-panda', 'mech-panda', 'hunter', 1, 3.2, { height: 3.2, prey: ['mushnub', 'mushnub-evolved'], habitat: 'forest', clips: STRIDE }),
  creature('mech-frog', 'mech-sapo', 'hunter', 1, 3.2, { height: 3.2, prey: ['frog', 'bunny'], habitat: 'meadow', clips: STRIDE }),
  creature('mech-flamingo', 'mech-flamingo', 'hunter', 1, 3.2, { height: 3.2, prey: ['cactoro', 'goleling'], habitat: 'desert', clips: STRIDE }),
  creature('dragon-evolved', 'dragão evoluído', 'sky-hunter', 1, 7, { prey: ['alpaking', 'mushnub', 'green-blob'], clips: HOVER }),
  creature('drone', 'drones', 'sky-hunter', 2, 2, { prey: ['birb', 'spiky-blob'], clips: STRIDE }),
]

// villagers keep to the villages; the herds, dinosaurs and dragon roam the four quadrants around them
export const ADVENTURERS: RosterEntry[] = [
  adventurer('knight', 'cavaleiros', 'villager', 3, 1.8, { height: 1.8, clips: KAYKIT }),
  adventurer('mage', 'magos', 'villager', 2, 1.8, { height: 1.8, clips: KAYKIT }),
  adventurer('rogue', 'ladinos', 'villager', 3, 1.8, { height: 1.8, clips: KAYKIT }),
  adventurer('barbarian', 'bárbaros', 'villager', 3, 1.8, { height: 1.9, clips: KAYKIT }),
  adventurer('ranger', 'arqueiros', 'villager', 3, 1.8, { height: 1.8, clips: KAYKIT }),
  adventurer('horse', 'cavalos', 'grazer', 5, 2.6, { habitat: 'meadow', clips: HOOVES }),
  adventurer('cow', 'vacas', 'grazer', 5, 2.4, { habitat: 'meadow', clips: HOOVES }),
  adventurer('alpaca', 'alpacas', 'grazer', 5, 2, { habitat: 'ice', clips: HOOVES }),
  adventurer('deer', 'cervos', 'grazer', 5, 1.8, { habitat: 'forest', clips: HOOVES }),
  adventurer('stag', 'alces', 'grazer', 2, 2.6, { habitat: 'forest', clips: HOOVES }),
  adventurer('triceratops', 'tricerátopos', 'grazer', 3, 7, { habitat: 'desert', clips: dinosaur('Triceratops') }),
  adventurer('stegosaurus', 'estegossauros', 'grazer', 2, 7, { habitat: 'desert', clips: dinosaur('Stegosaurus') }),
  adventurer('parasaurolophus', 'parassaurolofos', 'grazer', 4, 6, { habitat: 'meadow', clips: dinosaur('Parasaurolophus') }),
  adventurer('apatosaurus', 'apatossauros', 'grazer', 2, 16, { habitat: 'meadow', clips: dinosaur('Apatosaurus') }),
  adventurer('skeleton-warrior', 'esqueletos guerreiros', 'hunter', 3, 1.8, { height: 1.9, clips: KAYKIT, prey: ['knight', 'barbarian'], habitat: 'anywhere' }),
  adventurer('skeleton-minion', 'esqueletos', 'hunter', 4, 1.6, { height: 1.7, clips: KAYKIT, prey: ['rogue', 'ranger'], habitat: 'forest' }),
  adventurer('skeleton-rogue', 'esqueletos ladinos', 'hunter', 2, 1.8, { height: 1.8, clips: KAYKIT, prey: ['ranger', 'mage'], habitat: 'desert' }),
  adventurer('skeleton-mage', 'esqueletos magos', 'hunter', 1, 1.8, { height: 1.8, clips: KAYKIT, prey: ['mage', 'knight'], habitat: 'ice' }),
  adventurer('wolf', 'lobos', 'hunter', 4, 1.8, { prey: ['alpaca', 'deer'], habitat: 'ice', clips: HOOVES }),
  adventurer('t-rex', 'tiranossauro', 'hunter', 1, 10, { prey: ['triceratops', 'stegosaurus', 'parasaurolophus'], habitat: 'desert', clips: dinosaur('TRex') }),
  adventurer('velociraptor', 'velocirraptores', 'hunter', 3, 2.4, { prey: ['deer', 'horse'], habitat: 'forest', clips: dinosaur('Velociraptor') }),
  adventurer('dragon', 'dragão', 'sky-hunter', 1, 9, { prey: ['cow', 'horse', 'alpaca'], clips: { walk: 'Dragon_Flying' } }),
  adventurer('bat', 'morcegos', 'flock', 6, 1.2, { altitude: 40, clips: { walk: 'Bat_Flying' } }),
  adventurer('bird', 'pássaros', 'flock', 8, 0.8, { altitude: 55 }),
  adventurer('koi', 'carpas', 'swimmer', 6, 1, { clips: SWIM }),
  adventurer('swordfish', 'peixes-espada', 'swimmer', 2, 2.2, { leaps: true, clips: SWIM }),
]

export const ROSTERS = { monsters: MONSTERS, creatures: CREATURES, adventurers: ADVENTURERS } as const
export type RosterName = keyof typeof ROSTERS
