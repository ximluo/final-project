import {
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Material,
  Mesh,
  ShaderMaterial,
} from 'three'
import { paperMaterial, sheet } from './paper'
import rippleVertex from './shaders/ripple.vert?raw'

const RINGS = 8
const WAKES = 64
const WAKE_LIFE = 2.5
const EDGE = 600
const FLAT = 1000

export function pond(material: Material): Mesh {
  const water = new Mesh(sheet([-EDGE, 0, -EDGE, EDGE, 0, -EDGE, EDGE, 0, EDGE, -EDGE, 0, EDGE], [0, 1, 2, 0, 2, 3], () => false), material)
  water.position.y = -0.01
  water.receiveShadow = true
  return water
}

// Pleated polygon rings around the flowers, plus wakes that spread and fade
export class Ripples extends Mesh<InstancedBufferGeometry, ShaderMaterial> {
  private place: InstancedBufferAttribute
  private wave: InstancedBufferAttribute
  private born = new Float32Array(WAKES).fill(-WAKE_LIFE)
  private next = 0

  constructor(sides: number, private flowers: number, color: number) {
    const position: number[] = []
    const folds: number[] = []
    const corner = (k: number, ring: number) => {
      const angle = (2 * Math.PI * k) / sides
      position.push(Math.cos(angle), ring, -Math.sin(angle))
    }
    for (let ring = 0; ring < RINGS; ring++) {
      for (let k = 0; k < sides; k++) {
        corner(k, ring)
        corner(k, ring + 1)
        corner(k + 1, ring + 1)
        corner(k, ring)
        corner(k + 1, ring + 1)
        corner(k + 1, ring)
        const toInner = ring === 0 ? [FLAT, FLAT] : [0, 1]
        const toOuter = ring === RINGS - 1 ? [FLAT, FLAT] : [1, 0]
        for (const side of [0, 1, 1, 0, 1, 0]) folds.push(toInner[side], toOuter[side], FLAT)
      }
    }

    const count = flowers + WAKES
    const geometry = new InstancedBufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(position, 3))
    geometry.setAttribute('folds', new Float32BufferAttribute(folds, 3))
    geometry.setAttribute('place', new InstancedBufferAttribute(new Float32Array(3 * count), 3))
    geometry.setAttribute('wave', new InstancedBufferAttribute(new Float32Array(3 * count), 3))
    geometry.instanceCount = count

    const material = paperMaterial(color, rippleVertex)
    material.defines = { RINGS: RINGS.toFixed(1) }
    super(geometry, material)
    this.place = geometry.attributes.place as InstancedBufferAttribute
    this.wave = geometry.attributes.wave as InstancedBufferAttribute
    this.frustumCulled = false
    this.receiveShadow = true
  }

  set(i: number, x: number, z: number, rotation: number, inner: number, outer: number, height: number) {
    this.place.setXYZ(i, x, z, rotation)
    this.wave.setXYZ(i, inner, outer, height)
    this.place.needsUpdate = this.wave.needsUpdate = true
  }

  wake(x: number, z: number, rotation: number, time: number) {
    this.born[this.next] = time
    this.place.setXYZ(this.flowers + this.next, x, z, rotation)
    this.next = (this.next + 1) % WAKES
  }

  spread(time: number) {
    for (let i = 0; i < WAKES; i++) {
      const age = (time - this.born[i]) / WAKE_LIFE
      if (age < 1) this.wave.setXYZ(this.flowers + i, 0.08 + 0.5 * age, 0.3 + 0.9 * age, 0.03 * Math.sin(Math.PI * age))
      else this.wave.setXYZ(this.flowers + i, 0, 0, 0)
    }
    this.place.needsUpdate = this.wave.needsUpdate = true
  }
}
