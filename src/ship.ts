import {
  AdditiveBlending,
  Box3,
  Color,
  ConeGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from 'three'
import { loadGltf } from './gltf.ts'

const SHIP_LENGTH = 9
const EMISSIVE_BOOST = 2.5
// the Raven's nose points +Z in the file; the ship flies toward -Z, so the model is turned around
const MODEL_YAW = Math.PI
const NOZZLES = [
  { at: new Vector3(250, -20, -737), size: 1.4 },
  { at: new Vector3(-250, -20, -737), size: 1.4 },
]
const AXIS_Y = new Vector3(0, 1, 0)

export type Ship = {
  object: Group
  setThrust(level: number, time: number): void
}

export async function loadShip(url = '/models/raven.glb'): Promise<Ship> {
  const { scene } = await loadGltf(url)

  const box = new Box3().setFromObject(scene)
  const size = box.getSize(new Vector3())
  const scale = SHIP_LENGTH / Math.max(size.x, size.y, size.z)
  scene.scale.setScalar(scale)
  scene.position.copy(box.getCenter(new Vector3())).multiplyScalar(-scale)
  scene.traverse((object) => {
    if (object instanceof Mesh && object.material instanceof MeshStandardMaterial && object.material.emissiveMap) {
      object.material.emissiveIntensity = EMISSIVE_BOOST
    }
  })

  const model = new Group()
  model.add(scene)
  model.rotation.y = MODEL_YAW
  const object = new Group()
  const exhausts = NOZZLES.map((n) => buildExhaust(n.at.clone().multiplyScalar(scale).add(scene.position).applyAxisAngle(AXIS_Y, MODEL_YAW), n.size))
  object.add(model, ...exhausts.map((e) => e.root))

  return {
    object,
    setThrust(level, time) {
      exhausts.forEach((e, i) => e.update(level, 1 + 0.12 * Math.sin(time * 37 + i * 1.7)))
    },
  }
}

const coreGeometry = new SphereGeometry(0.16, 10, 8)
const plumeGeometry = new ConeGeometry(0.22, 1, 10, 1, true).translate(0, 0.5, 0).rotateX(Math.PI / 2)
const coreMaterial = new MeshBasicMaterial({ color: new Color(2, 5, 9) })
const plumeMaterial = new MeshBasicMaterial({
  color: new Color(0.5, 2.2, 4.5),
  transparent: true,
  opacity: 0.55,
  blending: AdditiveBlending,
  depthWrite: false,
  side: DoubleSide,
})

function buildExhaust(position: Vector3, size: number) {
  const root = new Group()
  root.position.copy(position)
  root.scale.setScalar(size)
  const core = new Mesh(coreGeometry, coreMaterial)
  const plume = new Mesh(plumeGeometry, plumeMaterial)
  root.add(core, plume)
  return {
    root,
    update(level: number, flicker: number) {
      const width = (1 + 0.4 * level) * flicker
      core.scale.setScalar((1 + 0.6 * level) * flicker)
      plume.scale.set(width, width, (0.3 + 2.4 * level) * flicker)
    },
  }
}
