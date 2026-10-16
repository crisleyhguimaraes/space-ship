import { BoxGeometry, ConeGeometry, CylinderGeometry, InstancedMesh, MeshStandardMaterial, Object3D } from 'three'
import { biomeAt } from './biomes.ts'
import { sampleHeight, type Heightmap } from './terrain.ts'
import type { Layout } from './worlds.ts'

const HOUSES_PER_VILLAGE = 9
const RING_RADIUS = 26
const CLEAR_RADIUS = 46
const MIN_SPACING = 320
const SEARCH_RANGE = 700
const MAX_SLOPE = 0.18

export type Villages = { objects: Object3D[]; centres: [number, number][]; contains(x: number, z: number): boolean }

export function buildVillages(h: Heightmap, layout: Layout, count: number, random: () => number): Villages {
  const centres: [number, number][] = []
  for (let tries = 0; tries < 6000 && centres.length < count; tries++) {
    const x = (random() * 2 - 1) * SEARCH_RANGE
    const z = (random() * 2 - 1) * SEARCH_RANGE
    if (isGoodSite(h, layout, x, z) && centres.every(([cx, cz]) => Math.hypot(cx - x, cz - z) > MIN_SPACING)) centres.push([x, z])
  }
  const total = centres.length * HOUSES_PER_VILLAGE
  const walls = new InstancedMesh(new BoxGeometry(6, 4, 5).translate(0, 2, 0), new MeshStandardMaterial({ color: 0xe0d2b0, roughness: 0.9 }), Math.max(total, 1))
  const roofs = new InstancedMesh(new ConeGeometry(5.2, 3.2, 4).rotateY(Math.PI / 4).translate(0, 5.6, 0), new MeshStandardMaterial({ color: 0x8a3a30, roughness: 0.8 }), Math.max(total, 1))
  const wells = new InstancedMesh(new CylinderGeometry(1.4, 1.6, 1.6, 10).translate(0, 0.8, 0), new MeshStandardMaterial({ color: 0x8a8580 }), Math.max(centres.length, 1))
  walls.count = roofs.count = total
  wells.count = centres.length
  const dummy = new Object3D()
  let house = 0
  centres.forEach(([cx, cz], v) => {
    dummy.position.set(cx, sampleHeight(h, cx, cz) - 0.1, cz)
    dummy.rotation.set(0, 0, 0)
    dummy.scale.setScalar(1)
    dummy.updateMatrix()
    wells.setMatrixAt(v, dummy.matrix)
    for (let i = 0; i < HOUSES_PER_VILLAGE; i++, house++) {
      const angle = (i / HOUSES_PER_VILLAGE) * Math.PI * 2 + v
      const x = cx + Math.cos(angle) * RING_RADIUS
      const z = cz + Math.sin(angle) * RING_RADIUS
      dummy.position.set(x, sampleHeight(h, x, z) - 0.3, z)
      dummy.rotation.set(0, -angle + Math.PI / 2, 0)
      dummy.updateMatrix()
      walls.setMatrixAt(house, dummy.matrix)
      roofs.setMatrixAt(house, dummy.matrix)
    }
  })
  return {
    objects: centres.length > 0 ? [walls, roofs, wells] : [],
    centres,
    contains: (x, z) => centres.some(([cx, cz]) => Math.hypot(cx - x, cz - z) < CLEAR_RADIUS),
  }
}

function isGoodSite(h: Heightmap, layout: Layout, x: number, z: number): boolean {
  const y = sampleHeight(h, x, z)
  if (y < 10 || y > 60 || biomeAt(x, z, layout).meadow < 0.7) return false
  const slope = Math.hypot(sampleHeight(h, x + RING_RADIUS, z) - sampleHeight(h, x - RING_RADIUS, z), sampleHeight(h, x, z + RING_RADIUS) - sampleHeight(h, x, z - RING_RADIUS)) / (2 * RING_RADIUS)
  return slope < MAX_SLOPE
}
