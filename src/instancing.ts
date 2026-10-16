import { type BufferGeometry, Float32BufferAttribute, InstancedMesh, type Material, type Matrix4, Mesh, type Object3D, SkinnedMesh, Vector3 } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export type InstancedModel = {
  parts: InstancedMesh[]
  setMatrixAt(index: number, matrix: Matrix4): void
}

export function instanceModel(root: Object3D, count: number): InstancedModel {
  root.updateMatrixWorld(true)
  const byMaterial = new Map<Material, BufferGeometry[]>()
  root.traverse((object) => {
    if (!(object instanceof Mesh) || !object.visible) return
    const material = Array.isArray(object.material) ? object.material[0] : object.material
    const geometry = (object instanceof SkinnedMesh ? bakedPose(object) : unpacked(object.geometry)).applyMatrix4(object.matrixWorld)
    byMaterial.set(material, [...(byMaterial.get(material) ?? []), geometry])
  })
  const parts = [...byMaterial].map(([material, geometries]) => new InstancedMesh(mergeGeometries(geometries), cutout(material), count))
  return { parts, setMatrixAt: (index, matrix) => parts.forEach((part) => part.setMatrixAt(index, matrix)) }
}

// blended foliage can't be depth-sorted across thousands of instances; alpha test gives the same silhouette
function cutout(material: Material): Material {
  if (!material.transparent) return material
  material.transparent = false
  material.alphaTest = 0.5
  material.depthWrite = true
  return material
}

// an instanced copy has no bones, so the bind pose is written into the vertices once
function bakedPose(skinned: SkinnedMesh): BufferGeometry {
  const out = unpacked(skinned.geometry)
  const position = out.getAttribute('position')
  const vertex = new Vector3()
  for (let i = 0; i < position.count; i++) {
    skinned.getVertexPosition(i, vertex)
    position.setXYZ(i, vertex.x, vertex.y, vertex.z)
  }
  out.deleteAttribute('skinIndex')
  out.deleteAttribute('skinWeight')
  out.computeVertexNormals()
  return out
}

// meshopt/quantized GLBs mix Uint16 and Float32 attributes; mergeGeometries needs one array type per attribute
function unpacked(geometry: BufferGeometry): BufferGeometry {
  const out = geometry.clone()
  for (const [name, attribute] of Object.entries(out.attributes)) {
    if (attribute.array instanceof Float32Array && !attribute.normalized) continue
    const floats = new Float32BufferAttribute(attribute.count * attribute.itemSize, attribute.itemSize)
    for (let i = 0; i < attribute.count; i++) {
      for (let c = 0; c < attribute.itemSize; c++) floats.setComponent(i, c, attribute.getComponent(i, c))
    }
    out.setAttribute(name, floats)
  }
  return out
}
