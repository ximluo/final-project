import { BufferGeometry, Material, Mesh } from 'three'
import { Bloom } from './bloom'
import { sheet } from './paper'

export class Flower extends Mesh<BufferGeometry, Material> {
  open = 0
  private frames: Float32Array[]
  private index: number[]

  constructor(bloom: Bloom, material: Material) {
    super(sheet(bloom.frames[0], bloom.index, (a, b) => a > 0 && b > 0), material)
    this.frames = bloom.frames
    this.index = bloom.index
    this.castShadow = true
    this.receiveShadow = true
  }

  // 0 is the flat sheet, 1 is the last baked keyframe
  fold(amount: number) {
    const at = amount * (this.frames.length - 1)
    const i = Math.min(Math.floor(at), this.frames.length - 2)
    const from = this.frames[i]
    const to = this.frames[i + 1]
    const position = this.geometry.attributes.position
    this.index.forEach((vertex, corner) => {
      for (let axis = 0; axis < 3; axis++) {
        const j = 3 * vertex + axis
        position.array[3 * corner + axis] = from[j] + (to[j] - from[j]) * (at - i)
      }
    })
    position.needsUpdate = true
    this.geometry.computeBoundingSphere()
  }
}
