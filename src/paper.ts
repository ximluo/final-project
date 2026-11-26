import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  ShaderChunk,
  ShaderMaterial,
  UniformsLib,
  UniformsUtils,
  Vector3,
} from 'three'
import paperChunk from './shaders/paper.glsl?raw'
import sheetVertex from './shaders/sheet.vert?raw'
import sheetFragment from './shaders/sheet.frag?raw'

;(ShaderChunk as Record<string, string>).paper = paperChunk

export const light = {
  lightDirection: { value: new Vector3(0, 1, 0) },
  lightColor: { value: new Color() },
  skyColor: { value: new Color() },
  bounceColor: { value: new Color() },
  hazeColor: { value: new Color() },
  weight: { value: 0.4 },
  time: { value: 0 },
}

export function paperMaterial(color: number, vertexShader = sheetVertex): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { ...UniformsUtils.clone(UniformsLib.lights), ...light, color: { value: new Color(color) } },
    vertexShader,
    fragmentShader: sheetFragment,
    lights: true,
    side: DoubleSide,
  })
}

const FAR = 1000

// One folded sheet as loose triangles, each corner carrying its distance to fold lines and cut edges
export function sheet(points: ArrayLike<number>, triangles: number[], isFold: (a: number, b: number) => boolean) {
  const key = (a: number, b: number) => `${Math.min(a, b)} ${Math.max(a, b)}`
  const point = (v: number) => new Vector3(points[3 * v], points[3 * v + 1], points[3 * v + 2])

  const uses = new Map<string, number>()
  for (let t = 0; t < triangles.length; t += 3) {
    for (let s = 0; s < 3; s++) {
      const edge = key(triangles[t + s], triangles[t + ((s + 1) % 3)])
      uses.set(edge, (uses.get(edge) ?? 0) + 1)
    }
  }

  const position: number[] = []
  const flat: number[] = []
  const folds: number[] = []
  const cuts: number[] = []
  for (let t = 0; t < triangles.length; t += 3) {
    const corners = triangles.slice(t, t + 3)
    const [a, b, c] = corners.map(point)
    const area = b.clone().sub(a).cross(c.clone().sub(a)).length()

    const edges = [0, 1, 2].map((s) => {
      const from = corners[(s + 1) % 3]
      const to = corners[(s + 2) % 3]
      const cut = uses.get(key(from, to)) === 1
      return { cut, fold: !cut && isFold(from, to), height: area / point(from).distanceTo(point(to)) }
    })

    corners.forEach((corner, s) => {
      const p = point(corner)
      position.push(p.x, p.y, p.z)
      flat.push(p.x, p.z)
      edges.forEach((edge, e) => {
        const away = e === s ? edge.height : 0
        folds.push(edge.fold ? away : FAR)
        cuts.push(edge.cut ? away : FAR)
      })
    })
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
  geometry.setAttribute('sheet', new Float32BufferAttribute(flat, 2))
  geometry.setAttribute('folds', new Float32BufferAttribute(folds, 3))
  geometry.setAttribute('cuts', new Float32BufferAttribute(cuts, 3))
  return geometry
}
