import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { prune } from '@gltf-transform/functions'

const bare = (name: string) => name.replace(/^.*\|/, '')

// Blender exports often carry each clip twice, with and without the armature prefix; the game looks clips up by bare name
export function pickClips(names: string[], keep: string[]): (string | null)[] {
  const wanted = new Set(keep)
  const taken = new Set<string>()
  return names.map((name) => {
    const clip = bare(name)
    if (!wanted.has(clip) || taken.has(clip)) return null
    taken.add(clip)
    return clip
  })
}

async function main(input: string, output: string, keep: string[]) {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  const doc = await io.read(input)
  const animations = doc.getRoot().listAnimations()
  const picked = pickClips(animations.map((a) => a.getName()), keep)
  animations.forEach((animation, i) => {
    const name = picked[i]
    if (name === null) animation.dispose()
    else animation.setName(name)
  })
  const missing = keep.filter((clip) => !picked.includes(clip))
  if (missing.length > 0) throw new Error(`${input}: clipes não encontrados: ${missing.join(', ')}`)
  await doc.transform(prune())
  await io.write(output, doc)
}

if (import.meta.main) {
  const [input, output, keep = ''] = process.argv.slice(2)
  if (!input || !output) throw new Error('uso: node scripts/keep-clips.ts <entrada> <saida.glb> [Idle,Walk,...]')
  await main(input, output, keep.split(',').filter(Boolean))
}
