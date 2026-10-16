import { loadGltf } from './gltf.ts'
import { ROSTERS, modelUrl, speciesFromRoster } from './roster.ts'
import { FLOCK_SPECIES, HERD_SPECIES, PREDATOR_SPECIES, type Cast, type FlockSpecies, type HerdModel, type HerdSpecies, type PredatorSpecies } from './wildlife.ts'
import type { WorldProfile } from './worlds.ts'

const cache = new Map<string, Promise<HerdModel | null>>()

// a model that is missing or broken just leaves that species out; the world still loads
function loadModel(url: string): Promise<HerdModel | null> {
  let pending = cache.get(url)
  if (!pending) {
    pending = loadGltf(url).then(
      (gltf) => ({ scene: gltf.scene, clips: gltf.animations }),
      () => {
        console.warn(`modelo ausente: ${url}`)
        return null
      },
    )
    cache.set(url, pending)
  }
  return pending
}

async function withModels<S extends { url: string }>(species: S[]): Promise<{ species: S; model: HerdModel }[]> {
  const loaded = await Promise.all(species.map(async (s) => ({ species: s, model: await loadModel(s.url) })))
  return loaded.filter((entry): entry is { species: S; model: HerdModel } => entry.model !== null)
}

export async function buildCastFor(profile: WorldProfile): Promise<Cast> {
  const herds: HerdSpecies[] = HERD_SPECIES.filter((s) => profile.herds.includes(s.key))
  const flocks: FlockSpecies[] = FLOCK_SPECIES.filter((s) => profile.flocks.includes(s.label))
  const predators: PredatorSpecies[] = PREDATOR_SPECIES.filter((s) => profile.predators.includes(s.label))
  if (profile.roster) {
    for (const entry of ROSTERS[profile.roster]) {
      const resolved = speciesFromRoster(entry)
      if (resolved.kind === 'herd') herds.push(resolved.species)
      else if (resolved.kind === 'flock') flocks.push(resolved.species)
      else predators.push(resolved.species)
    }
  }
  const [h, f, p, fly] = await Promise.all([withModels(herds), withModels(flocks), withModels(predators), profile.roster ? Promise.resolve(null) : loadModel('/models/fly.glb')])
  return { herds: h, flocks: f, predators: p, fly: fly?.scene ?? null }
}

export function rosterFiles(profile: WorldProfile): string[] {
  return profile.roster ? ROSTERS[profile.roster].map(modelUrl) : []
}
