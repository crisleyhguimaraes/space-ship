import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Points, PointsMaterial, Vector3 } from 'three'

const STAR_COUNT = 4000

export function buildStars(random: () => number, distance: number): Points<BufferGeometry, PointsMaterial> {
  const positions = new Float32Array(STAR_COUNT * 3)
  const colors = new Float32Array(STAR_COUNT * 3)
  const dir = new Vector3()
  for (let i = 0; i < STAR_COUNT; i++) {
    dir.set(random() - 0.5, random() - 0.5, random() - 0.5).normalize().multiplyScalar(distance)
    positions.set([dir.x, dir.y, dir.z], i * 3)
    const warmth = random()
    const brightness = 0.4 + random() * 0.6
    colors.set([brightness, brightness * (0.85 + warmth * 0.15), brightness * (0.8 + (1 - warmth) * 0.3)], i * 3)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  return new Points(
    geometry,
    new PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false }),
  )
}
