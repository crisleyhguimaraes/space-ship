import { Mesh, type Object3D } from 'three'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { asset } from './asset.ts'

const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder)

export function loadGltf(url: string) {
  return loader.loadAsync(asset(url))
}

export function largestMesh(root: Object3D): Mesh {
  let best: Mesh | undefined
  root.traverse((object) => {
    if (object instanceof Mesh && (!best || object.geometry.getAttribute('position').count > best.geometry.getAttribute('position').count)) best = object
  })
  if (!best) throw new Error('modelo sem malha')
  return best
}
