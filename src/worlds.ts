import type { Rgb } from './system.ts'

export type Layout = 'kaelith' | 'desert' | 'ice' | 'ocean' | 'lava'

export type WorldProfile = {
  key: string
  seed: number
  layout: Layout
  sea: boolean
  lake: boolean
  volcano: boolean
  ground: { tint: Rgb; snowLine: number }
  sky: { horizon: Rgb; zenith: Rgb; fog: Rgb }
  flora: Record<string, number>
  herds: string[]
  flocks: string[]
  predators: string[]
  startDay: number
}

const ALL_FLORA = { pine: 1, 'tree-night': 1, 'tree-night2': 1, 'tree-fir': 1, bush: 1, rocks: 1 }

export const WORLDS: Record<string, WorldProfile> = {
  kaelith: {
    key: 'kaelith',
    seed: 3,
    layout: 'kaelith',
    sea: true,
    lake: true,
    volcano: true,
    ground: { tint: [1, 1, 1], snowLine: 80 },
    sky: { horizon: [1, 1, 1], zenith: [1, 1, 1], fog: [1, 1, 1] },
    flora: ALL_FLORA,
    herds: ['creature', 'bunny', 'oryx', 'stag', 'elephant'],
    flocks: ['águias', 'patos'],
    predators: ['inseto gigante', 'lagarto voador', 'goblins'],
    startDay: 0.72,
  },
  rubra: {
    key: 'rubra',
    seed: 11,
    layout: 'desert',
    sea: false,
    lake: false,
    volcano: true,
    ground: { tint: [1.05, 0.62, 0.45], snowLine: 999 },
    sky: { horizon: [1.3, 0.75, 0.55], zenith: [1.1, 0.7, 0.6], fog: [1.25, 0.8, 0.6] },
    flora: { rocks: 2.2, 'tree-night2': 0.4, bush: 0.3 },
    herds: ['oryx', 'bunny'],
    flocks: ['águias'],
    predators: ['inseto gigante', 'lagarto voador'],
    startDay: 0.45,
  },
  brumal: {
    key: 'brumal',
    seed: 23,
    layout: 'ice',
    sea: true,
    lake: false,
    volcano: false,
    ground: { tint: [0.92, 0.96, 1.05], snowLine: 18 },
    sky: { horizon: [0.95, 1.0, 1.15], zenith: [0.85, 0.95, 1.2], fog: [1.05, 1.1, 1.2] },
    flora: { 'tree-fir': 0.9, pine: 0.5, rocks: 0.8 },
    herds: ['stag', 'bunny', 'elephant'],
    flocks: ['águias'],
    predators: ['goblins'],
    startDay: 0.3,
  },
  zafir: {
    key: 'zafir',
    seed: 37,
    layout: 'ocean',
    sea: true,
    lake: false,
    volcano: true,
    ground: { tint: [0.9, 1.0, 0.85], snowLine: 999 },
    sky: { horizon: [0.9, 1.05, 1.2], zenith: [0.8, 0.95, 1.25], fog: [0.9, 1.0, 1.15] },
    flora: { 'tree-night': 1.2, bush: 1.2, 'tree-night2': 1, rocks: 0.6 },
    herds: ['creature', 'bunny'],
    flocks: ['patos', 'águias'],
    predators: ['lagarto voador'],
    startDay: 0.55,
  },
  cinza: {
    key: 'cinza',
    seed: 41,
    layout: 'lava',
    sea: false,
    lake: false,
    volcano: true,
    ground: { tint: [0.42, 0.36, 0.36], snowLine: 999 },
    sky: { horizon: [1.1, 0.5, 0.35], zenith: [0.45, 0.25, 0.25], fog: [0.75, 0.45, 0.35] },
    flora: { rocks: 2.5 },
    herds: [],
    flocks: [],
    predators: ['inseto gigante', 'goblins'],
    startDay: 0.8,
  },
}
