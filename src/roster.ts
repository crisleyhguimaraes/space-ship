import { ANYWHERE, DESERT, FOREST, ICE, MEADOW, type FlockSpecies, type Habitat, type HerdSpecies, type PredatorSpecies } from './wildlife.ts'

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
      return { kind: 'herd', species: { key: entry.id, label: entry.label, url, herds: entry.groups ?? 1, size: entry.count, length: entry.length, height, habitat, orient: !entry.upright && height === undefined, village: entry.role === 'villager' } }
    case 'flock': {
      const rest = entry.altitude ?? 55
      return { kind: 'flock', species: { label: entry.label, url, size: entry.count, length: entry.length, shape: { restAltitude: rest, alarmAltitude: rest + FLOCK_ALARM_CLIMB, orbitRadius: 45 }, home: 'land', clips: { alwaysMoving: true } } }
    }
    case 'swimmer':
      return { kind: 'flock', species: { label: entry.label, url, size: entry.count, length: entry.length, shape: FISH, home: 'lake', clips: { alwaysMoving: true }, breach: entry.leaps ? { height: entry.length, seconds: 2, every: 14 } : undefined } }
    case 'hunter':
    case 'sky-hunter':
      return { kind: 'predator', species: { label: entry.label, url, kind: entry.role === 'hunter' ? 'ground' : 'air', count: entry.count, length: entry.length, height, prey: entry.prey ?? [], habitat, orient: !entry.upright && height === undefined } }
  }
}

const e = (id: string, label: string, role: Role, count: number, length: number, extra: Partial<RosterEntry> = {}, dir = ''): RosterEntry => ({ id, label, file: `${dir}${id}.glb`, role, count, length, ...extra })

// behaviour follows how each creature is described in its own series: flocks stay airborne, herd animals graze and bolt,
// solitary giants are rare, and the hunters only chase what they eat
const pokemon = (id: string, label: string, role: Role, count: number, length: number, extra: Partial<RosterEntry> = {}) => e(id, label, role, count, length, extra, 'pokemon/')
const digimon = (id: string, label: string, role: Role, count: number, length: number, extra: Partial<RosterEntry> = {}) => e(id, label, role, count, length, extra, 'digimon/')

export const POKEMON: RosterEntry[] = [
  pokemon('pidgey', 'Pidgey', 'flock', 6, 1.2, { altitude: 50 }),
  pokemon('spearow', 'Spearow', 'flock', 5, 1.2, { altitude: 62 }),
  pokemon('butterfree', 'Butterfree', 'flock', 5, 2, { altitude: 35 }),
  pokemon('zubat', 'Zubat', 'flock', 8, 1.4, { altitude: 48 }),
  pokemon('pidgeot', 'Pidgeot', 'sky-hunter', 1, 4, { prey: ['rattata', 'caterpie'] }),
  pokemon('charizard', 'Charizard', 'sky-hunter', 1, 5, { prey: ['ponyta', 'nidoran'] }),
  pokemon('rattata', 'Rattata', 'grazer', 6, 1.2, { groups: 2, habitat: 'meadow' }),
  pokemon('nidoran', 'Nidoran', 'grazer', 5, 1.4, { habitat: 'forest' }),
  pokemon('caterpie', 'Caterpie', 'grazer', 6, 0.8, { habitat: 'forest' }),
  pokemon('oddish', 'Oddish', 'grazer', 5, 1, { habitat: 'forest' }),
  pokemon('pikachu', 'Pikachu', 'grazer', 3, 1.1, { groups: 2, habitat: 'forest' }),
  pokemon('eevee', 'Eevee', 'grazer', 3, 1.1, { habitat: 'forest' }),
  pokemon('tauros', 'Tauros', 'grazer', 5, 3, { habitat: 'meadow' }),
  pokemon('ponyta', 'Ponyta', 'grazer', 3, 2.4, { habitat: 'meadow' }),
  pokemon('slowpoke', 'Slowpoke', 'grazer', 3, 2, { habitat: 'meadow' }),
  pokemon('snorlax', 'Snorlax', 'grazer', 1, 5, { habitat: 'meadow' }),
  pokemon('onix', 'Onix', 'grazer', 1, 10, { habitat: 'meadow' }),
  pokemon('arcanine', 'Arcanine', 'hunter', 2, 3, { habitat: 'meadow', prey: ['rattata', 'nidoran', 'ponyta'] }),
  pokemon('magikarp', 'Magikarp', 'swimmer', 8, 1.4),
  pokemon('psyduck', 'Psyduck', 'swimmer', 3, 1.2),
  pokemon('gyarados', 'Gyarados', 'swimmer', 1, 9, { leaps: true }),
  pokemon('lapras', 'Lapras', 'swimmer', 1, 5, { leaps: true }),
]

export const DIGIMON: RosterEntry[] = [
  digimon('agumon', 'Agumon', 'grazer', 4, 1.4, { groups: 2, habitat: 'meadow', upright: true, height: 1.4 }),
  digimon('gabumon', 'Gabumon', 'grazer', 3, 1.4, { habitat: 'ice', upright: true, height: 1.4 }),
  digimon('palmon', 'Palmon', 'grazer', 3, 1.2, { habitat: 'forest', upright: true, height: 1.3 }),
  digimon('tentomon', 'Tentomon', 'grazer', 3, 1.2, { habitat: 'forest', upright: true, height: 1.3 }),
  digimon('gazimon', 'Gazimon', 'grazer', 5, 1, { habitat: 'forest', upright: true, height: 1.1 }),
  digimon('numemon', 'Numemon', 'grazer', 4, 1, { habitat: 'meadow', upright: true, height: 1.1 }),
  digimon('frigimon', 'Frigimon', 'grazer', 3, 2, { habitat: 'ice', upright: true, height: 2.4 }),
  digimon('mammothmon', 'Mammothmon', 'grazer', 2, 7, { habitat: 'desert' }),
  digimon('monochromon', 'Monochromon', 'grazer', 1, 6, { habitat: 'desert' }),
  digimon('patamon', 'Patamon', 'flock', 5, 1, { altitude: 35 }),
  digimon('biyomon', 'Biyomon', 'flock', 4, 1.4, { altitude: 45 }),
  digimon('angemon', 'Angemon', 'flock', 2, 2.2, { altitude: 70 }),
  digimon('birdramon', 'Birdramon', 'sky-hunter', 1, 6, { prey: ['gazimon', 'numemon'] }),
  digimon('kuwagamon', 'Kuwagamon', 'sky-hunter', 1, 4, { prey: ['tentomon', 'palmon'] }),
  digimon('devimon', 'Devimon', 'sky-hunter', 1, 5, { prey: ['agumon', 'gabumon'] }),
  digimon('garurumon', 'Garurumon', 'hunter', 2, 3, { habitat: 'ice', prey: ['gabumon', 'frigimon'] }),
  digimon('greymon', 'Greymon', 'hunter', 1, 5, { habitat: 'desert', prey: ['numemon', 'gazimon'] }),
  digimon('etemon', 'Etemon', 'hunter', 1, 3, { habitat: 'desert', upright: true, height: 4, prey: ['agumon'] }),
  digimon('gomamon', 'Gomamon', 'swimmer', 4, 1.2),
  digimon('betamon', 'Betamon', 'swimmer', 6, 1.1),
  digimon('seadramon', 'Seadramon', 'swimmer', 1, 9, { leaps: true }),
  digimon('whamon', 'Whamon', 'swimmer', 1, 16, { leaps: true }),
]

type AnimeSpec = {
  id: string
  title: string
  hero: [string, string]
  villain: [string, string, { sky?: boolean; count?: number; height?: number; length?: number }?]
  creature: [string, string, Role, { count?: number; length?: number; habitat?: HabitatName; height?: number; upright?: boolean; altitude?: number }?]
}

const ANIMES: AnimeSpec[] = [
  { id: 'naruto', title: 'Naruto', hero: ['naruto', 'Naruto Uzumaki'], villain: ['akatsuki', 'Akatsuki'], creature: ['gamabunta', 'Gamabunta', 'grazer', { count: 1, length: 9, habitat: 'forest' }] },
  { id: 'onepiece', title: 'One Piece', hero: ['luffy', 'Monkey D. Luffy'], villain: ['bigmom', 'Big Mom', { height: 6, count: 1 }], creature: ['seaking', 'Rei do Mar', 'swimmer', { count: 1, length: 12 }] },
  { id: 'dragonball', title: 'Dragon Ball', hero: ['goku', 'Goku'], villain: ['frieza', 'Freeza', { sky: true, count: 1 }], creature: ['dbdino', 'Dinossauros', 'grazer', { count: 3, length: 5, habitat: 'desert' }] },
  { id: 'aot', title: 'Attack on Titan', hero: ['scout', 'Legião de Exploração'], villain: ['titan', 'Titãs', { count: 2, height: 15 }], creature: ['aothorse', 'Cavalos', 'grazer', { count: 4, length: 2.6, habitat: 'meadow' }] },
  { id: 'demonslayer', title: 'Demon Slayer', hero: ['tanjiro', 'Tanjiro'], villain: ['demon', 'Demônios', { count: 3 }], creature: ['nezuko', 'Nezuko', 'grazer', { count: 1, length: 1.2, habitat: 'forest', upright: true, height: 1.3 }] },
  { id: 'fma', title: 'Fullmetal Alchemist', hero: ['edward', 'Edward Elric'], villain: ['homunculus', 'Homunculus', { count: 2 }], creature: ['chimera', 'Quimeras', 'grazer', { count: 3, length: 3, habitat: 'desert' }] },
  { id: 'monstermusume', title: 'Monster Musume', hero: ['miia', 'Miia, a lâmia'], villain: ['mmboss', 'Chefe do Departamento', { count: 1 }], creature: ['harpy', 'Harpias', 'flock', { count: 4, length: 2.2 }] },
  { id: 'sololeveling', title: 'Solo Leveling', hero: ['jinwoo', 'Sung Jin-Woo'], villain: ['antking', 'Rei das Formigas', { count: 1, height: 5 }], creature: ['shadow', 'Soldados das Sombras', 'grazer', { count: 5, length: 1.8, habitat: 'anywhere', upright: true, height: 2 }] },
  { id: 'bleach', title: 'Bleach', hero: ['ichigo', 'Ichigo'], villain: ['hollow', 'Hollows', { count: 3, height: 4 }], creature: ['hell', 'Borboletas do Inferno', 'flock', { count: 6, length: 1.2 }] },
  { id: 'jjk', title: 'Jujutsu Kaisen', hero: ['itadori', 'Yuji Itadori'], villain: ['curse', 'Maldições', { count: 3, height: 3 }], creature: ['shikigami', 'Shikigamis', 'grazer', { count: 3, length: 2.2, habitat: 'forest' }] },
  { id: 'mha', title: 'My Hero Academia', hero: ['deku', 'Deku'], villain: ['nomu', 'Nomus', { count: 2, height: 3.5 }], creature: ['mhapets', 'Heróis de rua', 'grazer', { count: 3, length: 1.8, habitat: 'meadow', upright: true, height: 1.8 }] },
  { id: 'hxh', title: 'Hunter x Hunter', hero: ['gon', 'Gon'], villain: ['chimeraant', 'Formigas-Quimera', { count: 3, height: 2.6 }], creature: ['mogura', 'Mogura', 'grazer', { count: 2, length: 3, habitat: 'forest' }] },
  { id: 'fairytail', title: 'Fairy Tail', hero: ['natsu', 'Natsu'], villain: ['acnologia', 'Acnologia', { sky: true, count: 1, length: 14 }], creature: ['exceed', 'Exceeds', 'flock', { count: 4, length: 1 }] },
  { id: 'sao', title: 'Sword Art Online', hero: ['kirito', 'Kirito'], villain: ['saoboss', 'Chefe de Andar', { count: 1, height: 6 }], creature: ['saomob', 'Monstros de campo', 'grazer', { count: 4, length: 2, habitat: 'meadow' }] },
  { id: 'tokyoghoul', title: 'Tokyo Ghoul', hero: ['kaneki', 'Kaneki'], villain: ['ghoul', 'Ghouls', { count: 3 }], creature: ['owl', 'Corujas', 'flock', { count: 3, length: 1.6 }] },
  { id: 'deathnote', title: 'Death Note', hero: ['light', 'Light Yagami'], villain: ['ryuk', 'Ryuk', { sky: true, count: 1, length: 3 }], creature: ['apple', 'Maçãs ambulantes', 'grazer', { count: 3, length: 0.8, habitat: 'meadow' }] },
  { id: 'onepunchman', title: 'One-Punch Man', hero: ['saitama', 'Saitama'], villain: ['monsterassoc', 'Associação dos Monstros', { count: 2, height: 4 }], creature: ['fubuki', 'Gangue Fubuki', 'grazer', { count: 3, length: 1.8, habitat: 'meadow', upright: true, height: 1.8 }] },
  { id: 'blackclover', title: 'Black Clover', hero: ['asta', 'Asta'], villain: ['devil', 'Demônio', { sky: true, count: 1, length: 8 }], creature: ['bcbirds', 'Aves mágicas', 'flock', { count: 5, length: 1.4 }] },
  { id: 'berserk', title: 'Berserk', hero: ['guts', 'Guts'], villain: ['apostle', 'Apóstolos', { count: 2, height: 4 }], creature: ['puck', 'Duendes', 'flock', { count: 4, length: 0.8, altitude: 25 }] },
]

function animeEntries(spec: AnimeSpec): RosterEntry[] {
  const dir = `anime/${spec.id}/`
  const hero = e(spec.hero[0], `${spec.hero[1]} (${spec.title})`, 'villager', 3, 1.8, { upright: true, height: 1.8, habitat: 'meadow' }, dir)
  const [vid, vlabel, vopts = {}] = spec.villain
  const villain = e(vid, `${vlabel} (${spec.title})`, vopts.sky ? 'sky-hunter' : 'hunter', vopts.count ?? 2, vopts.length ?? 2, { upright: !vopts.sky, height: vopts.sky ? undefined : vopts.height ?? 2.2, prey: [spec.hero[0]], habitat: 'anywhere' }, dir)
  const [cid, clabel, crole, copts = {}] = spec.creature
  const creature = e(cid, `${clabel} (${spec.title})`, crole, copts.count ?? 3, copts.length ?? 2, { habitat: copts.habitat, upright: copts.upright, height: copts.height, altitude: copts.altitude }, dir)
  return [hero, villain, creature]
}

export const ANIME: RosterEntry[] = ANIMES.flatMap(animeEntries)

export const ROSTERS = { pokemon: POKEMON, digimon: DIGIMON, anime: ANIME } as const
export type RosterName = keyof typeof ROSTERS
